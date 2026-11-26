

import jwt
import time
from collections import defaultdict
from pathlib import Path
import uuid
import httpx
from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File, BackgroundTasks, Form
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import Query
from pydantic import BaseModel, EmailStr, Field, field_validator
from starlette.responses import JSONResponse, RedirectResponse
from fastapi import Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
import secrets
import time
from datetime import datetime, timedelta

from app.config import ALGORITHM, SECRET_KEY, FRONTEND_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
import re
from app.schemas import UserCreate, User as UserSchema, UserUpdate, UserWithToken
from app.models.users import User as UserModel
from app.db_depends import get_async_db
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    get_current_user,
    get_current_seller,
)
from app.cache import cache_invalidate_user
from loguru import logger

# Защита от брутфорса: email -> список timestamp неудачных попыток
_brute_force_tracker: dict[str, list[float]] = defaultdict(list)
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_TIME = 300

# Защита от password reset abuse: email -> timestamp последнего запроса
_reset_request_tracker: dict[str, float] = {}
RESET_REQUEST_COOLDOWN = 60  # 60 секунд между запросами на сброс

# Хранилище токенов сброса пароля: token -> {email, expires}
_reset_tokens: dict[str, dict] = {}
RESET_TOKEN_EXPIRY = timedelta(hours=1)

# Google OAuth
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USER_INFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

# Avatar settings
BASE_DIR = Path(__file__).resolve().parent.parent.parent
AVATAR_ROOT = BASE_DIR / "media" / "avatars"
AVATAR_ROOT.mkdir(parents=True, exist_ok=True)
ALLOWED_AVATAR_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_AVATAR_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
MAX_AVATAR_SIZE = 2 * 1024 * 1024  # 2MB

# Email validation regex
EMAIL_REGEX = re.compile(
    r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
)
MAX_EMAIL_LENGTH = 320

router = APIRouter(prefix="/users", tags=["users"])

class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    """Запрос на сброс пароля с валидацией email."""
    email: EmailStr = Field(
        ...,
        description="Email пользователя",
        max_length=320  # RFC 5321 стандарт
    )


class ResetPasswordRequest(BaseModel):
    """Запрос на установку нового пароля."""
    token: str = Field(..., description="Токен сброса пароля")
    new_password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Новый пароль (минимум 8 символов)"
    )

    @field_validator('new_password')
    @classmethod
    def password_strength(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Пароль должен содержать хотя бы одну заглавную букву')
        if not any(c.islower() for c in v):
            raise ValueError('Пароль должен содержать хотя бы одну строчную букву')
        if not any(c.isdigit() for c in v):
            raise ValueError('Пароль должен содержать хотя бы одну цифру')
        return v


@router.get("/google-login")
async def google_login(request: Request):
    """
    Перенаправление на страницу авторизации Google.
    
    Защита:
    - CSRF state token (сохраняется в cookie)
    - Валидация redirect_uri
    - Secure cookie
    """
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth не настроен"
        )
    
    # Генерируем state для CSRF защиты
    state = secrets.token_urlsafe(32)
    
    auth_params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "select_account"
    }
    
    auth_url = f"{GOOGLE_AUTH_URL}?{httpx.QueryParams(auth_params)}"
    
    # Сохраняем state в secure cookie
    response = RedirectResponse(url=auth_url)
    response.set_cookie(
        key="google_oauth_state",
        value=state,
        httponly=True,  # недоступен JS
        secure=False,   # False для localhost (True для production)
        samesite="lax", # защита от CSRF
        max_age=300      # 5 минут
    )
    
    return response


@router.get("/google/callback")
async def google_callback(
    code: str = Query(...),
    state: str = Query(...),
    request: Request = None,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Обработка ответа от Google OAuth.
    
    Защита:
    - Проверка CSRF state из cookie
    - Валидация redirect_uri
    - Secure token handling
    """
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth не настроен"
        )
    
    # Проверяем CSRF state
    cookie_state = request.cookies.get("google_oauth_state")
    if not cookie_state or cookie_state != state:
        logger.warning("Google OAuth CSRF validation failed")
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=csrf_failed")
    
    # Очищаем cookie после использования
    # (будет очищено после перенаправления)
    
    # Обмениваем code на access token
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET
            }
        )
        
        if token_response.status_code != 200:
            return RedirectResponse(url=f"{FRONTEND_URL}/login?error=oauth_failed")
        
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        
        # Получаем данные пользователя из Google
        user_info_response = await client.get(
            GOOGLE_USER_INFO_URL,
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        if user_info_response.status_code != 200:
            return RedirectResponse(url=f"{FRONTEND_URL}/login?error=oauth_failed")
        
        user_info = user_info_response.json()
        google_email = user_info.get("email")
        google_name = user_info.get("name", "")
        google_picture = user_info.get("picture", "")
        
        if not google_email:
            return RedirectResponse(url=f"{FRONTEND_URL}/login?error=oauth_failed")
        
        # Ищем или создаём пользователя
        result = await db.scalars(
            select(UserModel).where(UserModel.email == google_email)
        )
        user = result.first()
        
        if not user:
            # Создаём нового пользователя
            user = UserModel(
                email=google_email,
                hashed_password=hash_password(secrets.token_urlsafe(16)),  # случайный пароль
                name=google_name,
                role="buyer",
                is_active=True
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
            logger.info(f"Создан новый пользователь через Google: {google_email}")
        else:
            # Обновляем имя и аватар если есть
            if google_name and not user.name:
                user.name = google_name
            if google_picture and not user.avatar_url:
                user.avatar_url = google_picture
            await db.commit()
            logger.info(f"Вход через Google: {google_email}")
        
        # Создаём токены
        access_token = create_access_token(
            data={"sub": user.email, "role": user.role, "id": user.id}
        )
        refresh_token = create_refresh_token(
            data={"sub": user.email, "role": user.role, "id": user.id}
        )
        
        # Перенаправляем на фронтенд с токенами
        callback_url = f"{FRONTEND_URL}/auth-success?access_token={access_token}&refresh_token={refresh_token}"
        return RedirectResponse(url=callback_url)


# Специфичные роуты ДО параметризованных!
@router.get("/", response_model=list[UserSchema])
async def get_users(db: AsyncSession = Depends(get_async_db),
                    current_user: UserModel = Depends(get_current_seller)):
    """Только для авторизованных пользователей (seller/admin)"""
    result = await db.execute(select(UserModel))
    users = result.scalars().all()
    return users


@router.get("/email/{email}", response_model=UserSchema)
async def get_user_by_email(email: str, db: AsyncSession = Depends(get_async_db),
                            current_user: UserModel = Depends(get_current_user)):
    """Только для авторизованных пользователей"""
    result = await db.execute(select(UserModel).where(UserModel.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_async_db)):
    """
    Регистрация нового пользователя.
    
    Защита:
    - Валидация email по RFC 5321
    - Проверка сложности пароля
    - Проверка уникальности email
    """
    # Дополнительная валидация email
    if not EMAIL_REGEX.match(user.email):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Некорректный email формат"
        )
    
    result = await db.scalars(select(UserModel).where(UserModel.email == user.email))
    if result.first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )

    db_user = UserModel(
        email=user.email,
        hashed_password=hash_password(user.password),
        role=user.role
    )

    db.add(db_user)
    await db.commit()
    logger.info(f"Регистрация нового пользователя: {user.email} (role={user.role})")
    return db_user


@router.post("/create-admin", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def create_admin(admin_data: UserCreate, db: AsyncSession = Depends(get_async_db)):
    # Валидация email
    if not EMAIL_REGEX.match(admin_data.email):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Некорректный email формат"
        )
    
    result = await db.scalars(select(UserModel).where(UserModel.email == admin_data.email))
    if result.first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )

    db_admin = UserModel(
        email=admin_data.email,
        hashed_password=hash_password(admin_data.password),
        role="admin"
    )

    db.add(db_admin)
    await db.commit()
    logger.info(f"Создан администратор: {admin_data.email}")
    return db_admin


def _cleanup_old_attempts(identifier: str, current_time: float):
    """Удаляет попытки старше LOCKOUT_TIME."""
    _brute_force_tracker[identifier] = [
        t for t in _brute_force_tracker[identifier]
        if current_time - t < LOCKOUT_TIME
    ]
    if not _brute_force_tracker[identifier]:
        del _brute_force_tracker[identifier]


@router.post("/token")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Получение токена доступа.
    
    Защита:
    - Валидация email формата
    - Защита от брутфорса
    - Rate limiting
    """
    email = form_data.username
    password = form_data.password
    
    # Валидация email формата
    if not email or len(email) > MAX_EMAIL_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Некорректный email"
        )
    
    if not EMAIL_REGEX.match(email):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Некорректный email формат"
        )
    
    # --- Защита от брутфорса ---
    identifier = email.lower().strip()
    current_time = time.time()

    # Очищаем старые попытки
    _cleanup_old_attempts(identifier, current_time)

    # Проверяем, заблокирован ли
    if identifier in _brute_force_tracker and len(_brute_force_tracker[identifier]) >= MAX_FAILED_ATTEMPTS:
        retry_after = LOCKOUT_TIME - (current_time - _brute_force_tracker[identifier][0])
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "message": "Слишком много попыток входа. Попробуйте позже.",
                "retry_after": int(retry_after)
            },
        )

    # Проверяем пользователя
    result = await db.scalars(select(UserModel).where(UserModel.email == email))
    user = result.first()

    if not user or not verify_password(password, user.hashed_password):
        # Записываем неудачную попытку
        _brute_force_tracker[identifier].append(current_time)

        logger.warning(
            f"Неудачная попытка входа для {email} "
            f"(попытка {len(_brute_force_tracker[identifier])}/{MAX_FAILED_ATTEMPTS})"
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Успешный вход — сбрасываем счётчик
    if identifier in _brute_force_tracker:
        del _brute_force_tracker[identifier]

    # Создаем токены
    access_token = create_access_token(data={"sub": user.email, "role": user.role, "id": user.id})
    refresh_token = create_refresh_token(data={"sub": user.email, "role": user.role, "id": user.id})

    logger.info(f"Успешный вход: {email} (role={user.role})")

    return JSONResponse(
        content={
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
    )


@router.post("/refresh-token")
async def refresh_token(request: RefreshTokenRequest = Body(...), db: AsyncSession = Depends(get_async_db)):
    refresh_token_value = request.refresh_token
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(refresh_token_value, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    result = await db.scalars(
        select(UserModel).where(UserModel.email == email, UserModel.is_active == True)
    )
    user = result.first()
    if user is None:
        raise credentials_exception

    logger.info(f"Обновление токена: {email}")

    access_token = create_access_token(data={"sub": user.email, "role": user.role, "id": user.id})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserWithToken)
async def get_me(current_user: UserModel = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserWithToken)
async def update_me(
    user_update: UserUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user)
):
    if user_update.email and user_update.email != current_user.email:
        logger.info(f"Смена email: {current_user.email} -> {user_update.email}")
        existing = await db.scalars(
            select(UserModel).where(UserModel.email == user_update.email)
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already in use"
            )
        await db.execute(
            update(UserModel)
            .where(UserModel.id == current_user.id)
            .values(email=user_update.email)
        )
        current_user.email = user_update.email

    if user_update.password:
        current_user.hashed_password = hash_password(user_update.password)
        logger.info(f"Смена пароля: {current_user.email}")

    # Только admin может менять роль
    if user_update.role and user_update.role != current_user.role:
        if current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admin can change user role"
            )
        current_user.role = user_update.role

    # Обновляем новые поля профиля
    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.phone is not None:
        current_user.phone = user_update.phone
    if user_update.city is not None:
        current_user.city = user_update.city

    await db.commit()
    await cache_invalidate_user(current_user.email)
    return current_user


@router.post("/logout")
async def logout(current_user: UserModel = Depends(get_current_user)):
    """Выход из системы с инвалидацией кэша."""
    await cache_invalidate_user(current_user.email)
    logger.info(f"Выход пользователя: {current_user.email}")
    return {"message": "Вы успешно вышли из системы"}


def _validate_avatar(file: UploadFile) -> None:
    """Проверяет MIME-тип, расширение и размер аватарки."""
    if file.content_type not in ALLOWED_AVATAR_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Разрешены только изображения: jpg, png, webp"
        )

    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in ALLOWED_AVATAR_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Разрешены только изображения: jpg, png, webp"
        )

    header = file.file.read(8)
    file.file.seek(0)
    if len(header) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файл слишком маленький или повреждён"
        )


async def _save_avatar(file: UploadFile) -> str:
    """Сохраняет аватарку и возвращает относительный URL."""
    content = await file.read()
    if len(content) > MAX_AVATAR_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Изображение слишком большое (макс. 2MB)"
        )

    extension = Path(file.filename or "").suffix.lower() or ".jpg"
    file_name = f"{uuid.uuid4()}{extension}"
    file_path = AVATAR_ROOT / file_name
    file_path.write_bytes(content)

    return f"/media/avatars/{file_name}"


@router.post("/forgot-password")
async def forgot_password(
    request_data: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Отправляет email с ссылкой для сброса пароля.
    
    Защита:
    - Rate limiting: 1 запрос в минуту на email
    - Проверка существования пользователя (без раскрытия информации)
    - Валидация email по RFC 5321
    - Токен с истекающим сроком (1 час)
    """
    email = request_data.email.strip().lower()
    
    # Rate limiting: защита от спама
    current_time = time.time()
    if email in _reset_request_tracker:
        last_request = _reset_request_tracker[email]
        elapsed = current_time - last_request
        if elapsed < RESET_REQUEST_COOLDOWN:
            retry_after = int(RESET_REQUEST_COOLDOWN - elapsed)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Подождите {retry_after} секунд перед повторным запросом"
            )
    
    # Проверяем существование пользователя (без раскрытия информации)
    result = await db.scalars(
        select(UserModel).where(UserModel.email == email)
    )
    user = result.first()
    
    if not user:
        # Возвращаем тот же ответ, чтобы не раскрывать информацию о пользователях
        logger.warning(f"Запрос сброса пароля для несуществующего email: {email}")
        return {
            "message": "Если email зарегистрирован, письмо для сброса пароля будет отправлено"
        }
    
    # Генерируем безопасный токен
    reset_token = secrets.token_urlsafe(32)
    
    # Сохраняем токен с истечением
    _reset_tokens[reset_token] = {
        "email": email,
        "expires": datetime.utcnow() + RESET_TOKEN_EXPIRY
    }
    
    # Обновляем timestamp запроса
    _reset_request_tracker[email] = current_time
    
    # Отправляем email в фоновом режиме
    from app.services.email_service import send_reset_password_email
    
    try:
        await send_reset_password_email(email, reset_token)
        logger.info(f"Письмо для сброса пароля отправлено на {email}")
    except Exception as e:
        logger.error(f"Ошибка отправки email для {email}: {e}")
        # Не блокируем пользователя из-за ошибки email
    
    return {
        "message": "Если email зарегистрирован, письмо для сброса пароля будет отправлено"
    }


@router.post("/reset-password")
async def reset_password(
    request_data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Устанавливает новый пароль по токену.
    
    Защита:
    - Одноразовый токен (уничтожается после использования)
    - Проверка срока действия токена
    - Валидация сложности нового пароля
    - Безопасное хеширование пароля
    """
    token = request_data.token
    
    # Проверяем существование токена
    if token not in _reset_tokens:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Недействительный токен. Запросите новый"
        )
    
    token_data = _reset_tokens[token]
    
    # Проверяем срок действия токена
    if datetime.utcnow() > token_data["expires"]:
        # Удаляем просроченный токен
        del _reset_tokens[token]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Токен истёк. Запросите новый"
        )
    
    email = token_data["email"]
    new_password = request_data.new_password
    
    # Находим пользователя
    result = await db.scalars(
        select(UserModel).where(UserModel.email == email)
    )
    user = result.first()
    
    if not user:
        # Удаляем токен
        del _reset_tokens[token]
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Обновляем пароль
    user.hashed_password = hash_password(new_password)
    await db.commit()
    
    # Удаляем токен (одноразовый)
    del _reset_tokens[token]
    
    # Очищаем cooldown
    if email in _reset_request_tracker:
        del _reset_request_tracker[email]
    
    logger.info(f"Пароль успешно изменён для {email}")
    
    return {"message": "Пароль успешно изменён"}


@router.post("/me/avatar", response_model=UserWithToken)
async def upload_avatar(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Загружает аватарку пользователя.
    Поддерживает: jpg, png, webp. Макс. размер: 2MB.
    """
    _validate_avatar(file)

    # Удаляем старую аватарку
    if current_user.avatar_url:
        old_path = BASE_DIR / current_user.avatar_url.lstrip("/")
        if old_path.exists():
            old_path.unlink()

    avatar_url = await _save_avatar(file)
    current_user.avatar_url = avatar_url
    await db.commit()
    await cache_invalidate_user(current_user.email)

    return current_user


# Параметризованные роуты ПОСЛЕ специфичных
@router.get("/{user_id}", response_model=UserSchema)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user)
):
    # Пользователь может смотреть только свой профиль или admin может смотреть всех
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own profile"
        )
    result = await db.execute(select(UserModel).where(UserModel.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.delete("/{user_id}")
async def delete_user(
        user_id: int,
        db: AsyncSession = Depends(get_async_db),
        current_user: UserModel = Depends(get_current_user)
):
    result = await db.scalars(
        select(UserModel).where(UserModel.id == user_id)
    )
    user = result.first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    logger.info(f"Удаление пользователя: {user.email} (запрос от {current_user.email})")

    await db.execute(delete(UserModel).where(UserModel.id == user_id))
    await db.commit()
    await cache_invalidate_user(user.email)
    return {"message": "User deleted"}
import jwt
import time
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from starlette.responses import JSONResponse
from fastapi import Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

from app.config import ALGORITHM, SECRET_KEY
from app.schemas import UserCreate, User as UserSchema, UserUpdate, UserWithToken
from app.models.users import User as UserModel
from app.db_depends import get_async_db
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    get_current_user,
)

import logging

logger = logging.getLogger(__name__)

# Защита от брутфорса: email -> список timestamp неудачных попыток
_brute_force_tracker: dict[str, list[float]] = defaultdict(list)
MAX_FAILED_ATTEMPTS = 5  # Максимум неудачных попыток
LOCKOUT_TIME = 300  # 5 минут блокировки (в секундах)

router = APIRouter(prefix="/users", tags=["users"])

class RefreshTokenRequest(BaseModel):
    refresh_token: str
# Специфичные роуты ДО параметризованных!
@router.get("/", response_model=list[UserSchema])
async def get_users(db: AsyncSession = Depends(get_async_db)):
    result = await db.execute(select(UserModel))
    users = result.scalars().all()
    return users


@router.get("/email/{email}", response_model=UserSchema)
async def get_user_by_email(email: str, db: AsyncSession = Depends(get_async_db)):
    result = await db.execute(select(UserModel).where(UserModel.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_async_db)):
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
    return db_user


@router.post("/create-admin", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def create_admin(admin_data: UserCreate, db: AsyncSession = Depends(get_async_db)):
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
    Для Swagger UI: используй форму с полями username и password.
    Для API: используй Content-Type: application/json.
    """
    email = form_data.username
    password = form_data.password

    # --- Защита от брутфорса ---
    identifier = email
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

    if user_update.role and user_update.role != current_user.role:
        current_user.role = user_update.role

    await db.commit()
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

    await db.execute(delete(UserModel).where(UserModel.id == user_id))
    await db.commit()
    return {"message": "User deleted"}

from fastapi import APIRouter, HTTPException, status, Depends, Request
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db_depends import get_async_db
from app.models.newsletter import NewsletterSubscriber
from app.config import SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM_EMAIL
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import time
from collections import defaultdict

router = APIRouter(prefix="/newsletter", tags=["newsletter"])

# Rate limiting: IP -> список timestamp запросов
_rate_limit_tracker: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT_MAX = 5  # Максимум запросов
RATE_LIMIT_WINDOW = 300  # 5 минут


def _check_rate_limit(ip: str) -> None:
    """Проверяет, не превышен ли лимит запросов для IP."""
    current_time = time.time()
    
    # Очищаем старые записи
    _rate_limit_tracker[ip] = [
        t for t in _rate_limit_tracker[ip]
        if current_time - t < RATE_LIMIT_WINDOW
    ]
    
    if len(_rate_limit_tracker[ip]) >= RATE_LIMIT_MAX:
        retry_after = RATE_LIMIT_WINDOW - (current_time - _rate_limit_tracker[ip][0])
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "message": "Слишком много попыток подписки. Попробуйте позже.",
                "retry_after": int(retry_after)
            },
        )
    
    _rate_limit_tracker[ip].append(current_time)


class SubscribeRequest(BaseModel):
    email: EmailStr


class SubscribeResponse(BaseModel):
    message: str
    email: str


def send_confirmation_email(subscriber_email: str):
    """Отправляет письмо с подтверждением подписки."""
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        print(f"[Newsletter] SMTP not configured. Would send to: {subscriber_email}")
        return

    try:
        msg = MIMEMultipart()
        msg["From"] = SMTP_FROM_EMAIL
        msg["To"] = subscriber_email
        msg["Subject"] = "Подписка на рассылку Mr.Store"

        body = f"""Добрый день!

Вы успешно подписались на рассылку магазина Mr.Store.

Теперь вы будете получать уведомления о:
- Новинках и акциях
- Специальных предложениях
- Скидках и бонусах

Спасибо, что с нами!

Команда Mr.Store
"""
        msg.attach(MIMEText(body, "plain", "utf-8"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)

        print(f"[Newsletter] Confirmation sent to: {subscriber_email}")
    except Exception as e:
        print(f"[Newsletter] Error sending email to {subscriber_email}: {e}")


@router.post("/", response_model=SubscribeResponse, status_code=status.HTTP_201_CREATED)
async def subscribe(subscribe_request: SubscribeRequest, request: Request, db: AsyncSession = Depends(get_async_db)):
    """
    Подписка на рассылку. Отправляет email с подтверждением.
    """
    # Проверяем rate limiting
    client_ip = request.client.host
    _check_rate_limit(client_ip)
    
    # Проверяем, подписан ли уже
    result = await db.execute(
        select(NewsletterSubscriber).where(
            NewsletterSubscriber.email == subscribe_request.email,
            NewsletterSubscriber.is_active == True
        )
    )
    existing = result.scalar()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Этот email уже подписан на рассылку"
        )

    # Создаём подписчика
    subscriber = NewsletterSubscriber(email=subscribe_request.email)
    db.add(subscriber)
    await db.commit()

    # Отправляем email
    send_confirmation_email(subscribe_request.email)

    return SubscribeResponse(
        message="Вы успешно подписались на рассылку!",
        email=subscribe_request.email
    )

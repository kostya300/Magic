from decimal import Decimal
from typing import Any
from uuid import uuid4

from httpx import Client, Timeout

from app.config import (
    YOOKASSA_RETURN_URL,
    YOOKASSA_SECRET_KEY,
    YOOKASSA_SHOP_ID,
)


async def create_yookassa_payment(
    *,
    order_id: int,
    amount: Decimal,
    user_email: str,
    description: str,
) -> dict[str, Any]:
    """Создаёт платёж в ЮKassa."""

    if not YOOKASSA_SHOP_ID or not YOOKASSA_SECRET_KEY:
        raise RuntimeError("Задайте YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY в .env")

    payload = {
        "amount": {
            "value": f"{amount:.2f}",
            "currency": "RUB",
        },
        "confirmation": {
            "type": "redirect",
            "return_url": YOOKASSA_RETURN_URL,
        },
        "capture": True,
        "description": description,
        "metadata": {
            "order_id": order_id,
        },
        "receipt": {
            "customer": {"email": user_email},
            "items": [
                {
                    "description": description[:128],
                    "quantity": "1.00",
                    "amount": {"value": f"{amount:.2f}", "currency": "RUB"},
                    "vat_code": 1,
                    "payment_mode": "full_prepayment",
                    "payment_subject": "commodity",
                },
            ],
        },
    }

    import base64
    credentials = f"{YOOKASSA_SHOP_ID}:{YOOKASSA_SECRET_KEY}"
    auth_token = base64.b64encode(credentials.encode()).decode()

    headers = {
        "Content-Type": "application/json",
        "Idempotence-Key": str(uuid4()),
        "Authorization": f"Basic {auth_token}",
    }

    YOOKASSA_API_URL = "https://api.yookassa.ru/v3/payments"

    try:
        with Client(timeout=Timeout(connect=10.0, read=30.0, write=30.0, pool=10.0)) as client:
            resp = client.post(YOOKASSA_API_URL, json=payload, headers=headers)
    except Exception as exc:
        print(f"YooKassa connection error: {exc}")
        raise RuntimeError(f"Не удалось подключиться к ЮKassa: {exc}")

    if resp.status_code not in (200, 201):
        print(f"YooKassa error: {resp.status_code} - {resp.text}")
        raise RuntimeError(f"ЮKassa API error: {resp.status_code}")

    result = resp.json()

    return {
        "id": result["id"],
        "status": result["status"],
        "confirmation_url": result["confirmation"].get("confirmation_url"),
    }

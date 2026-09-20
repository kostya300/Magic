from celery import Celery
from fastapi import FastAPI, status
from fastapi import WebSocket
from app.routers import categories, products, users, reviews,cart,orders,payments,newsletter,favorites
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from fastapi.staticfiles import StaticFiles
from app.config import FRONTEND_URL, DEBUG, ALLOWED_HOSTS,SESSIONMIDDLEWARE
from starlette.middleware.sessions import SessionMiddleware
import app.logger  # noqa: F401 - инициализация логирования
celery = Celery(
    __name__,
    broker='redis://127.0.0.1:6379/0',
    backend='redis://127.0.0.1:6379/0',
    broker_connection_retry_on_startup=True,

)
celery.conf.update(
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    imports=('app.routers.tasks',),
)
app = FastAPI(
    title="FastAPI Интернет-магазин",
    version="1.0.0",
    description="API v1 - Интернет-магазин Mr.Store",
)


# Middleware для логирования HTTP запросов
class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        from loguru import logger

        logger.info(f"{request.method} {request.url.path}")
        response = await call_next(request)
        logger.info(f"{request.method} {request.url.path} - Status: {response.status_code}")
        return response


app.add_middleware(LoggingMiddleware)
app.add_middleware(SessionMiddleware, secret_key=SESSIONMIDDLEWARE)
app.add_middleware(GZipMiddleware, minimum_size=1000)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL] if not DEBUG else [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
app.include_router(categories.router)
app.include_router(products.router)

app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(users.router)
app.include_router(reviews.router)
app.include_router(payments.router)
app.include_router(newsletter.router)
app.include_router(favorites.router)

app.mount("/media", StaticFiles(directory="media"), name="media")

# Защита от Host Header Attacks (используем встроенный middleware Starlette)
allowed_hosts = ["localhost", "127.0.0.1", "0.0.0.0"] + ALLOWED_HOSTS
app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)

# Заголовки безопасности
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Не устанавливаем CSP для Swagger UI
        if "/docs" not in request.url.path and "/openapi.json" not in request.url.path:
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https: http://localhost:8000 http://127.0.0.1:8000; "
                "font-src 'self'; "
                "connect-src 'self' http://localhost:3000 http://127.0.0.1:3000 http://localhost:8000 http://127.0.0.1:8000; "
                "upgrade-insecure-requests; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self'"
            )
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response


app.add_middleware(SecurityHeadersMiddleware)


@app.get("/")
async def root():
    """
    Корневой маршрут, подтверждающий, что API работает.
    """
    from loguru import logger

    logger.info("Root endpoint accessed")
    return {"message": "Добро пожаловать в API интернет-магазина!"}


@app.websocket("/ws/notifications/{email}")
async def websocket_notification(websocket: WebSocket, email: str):
    """
    WebSocket эндпоинт для отправки уведомлений пользователю.
    URL: ws://localhost:8000/ws/notifications/user@email.com
    """
    from app.websocket import websocket_manager

    await websocket_manager.connect(websocket, email)
    try:
        while True:
            # Держим соединение открытым
            await websocket.receive_text()
    except Exception:
        websocket_manager.disconnect(websocket, email)


from app.cache import close_redis
import asyncio


@app.on_event("shutdown")
async def shutdown_event():
    await close_redis()
"""Тесты для checkout endpoint (POST /orders/checkout).

TSVECTOR — PostgreSQL-only, поэтому используем PostgreSQL через docker.
Запуск: docker run --rm -p 5432:5432 -e POSTGRES_USER=test -e POSTGRES_PASSWORD=test -e POSTGRES_DB=test_db postgres:15
Затем: pytest app/tests/test_checkout.py -v --tb=short
"""
import os
import pytest
from fastapi import status
from fastapi.testclient import TestClient
from decimal import Decimal

from app.main import app
from app.models.users import User as UserModel
from app.models.cart_items import CartItem as CartItemModel
from app.models.orders import Order as OrderModel, OrderItem as OrderItemModel
from app.models.categories import Category as CategoryModel
from app.db_depends import get_async_db
from app.auth import create_access_token
from sqlalchemy import MetaData
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://test:test:test_db@localhost:5432/test_db",
)


# ======================== Фикстуры =========================

@pytest.fixture(scope="session")
def event_loop():
    import asyncio
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def db_session():
    """Создаёт тестовую БД (PostgreSQL)."""
    test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)

    # Подключаем Base.metadata, но исключаем products (TSVECTOR = PG-only)
    from app.database import Base
    from app.models.users import User
    from app.models.cart_items import CartItem
    from app.models.orders import Order, OrderItem
    from app.models.categories import Category
    from app.models.reviews import Review

    # Создаём таблицу products вручную без TSVECTOR
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with test_engine.connect() as conn:
        async with test_engine.begin() as tx:
            async with sessionmaker(conn, class_=AsyncSession, expire_on_commit=False)() as session:
                # User — Seller
                seller = UserModel(
                    id=1,
                    email="seller@example.com",
                    hashed_password="hashed_password",
                    role="seller",
                    is_active=True,
                )
                session.add(seller)

                # User — Buyer
                buyer = UserModel(
                    id=2,
                    email="buyer@example.com",
                    hashed_password="hashed_password",
                    role="buyer",
                    is_active=True,
                )
                session.add(buyer)

                # Category
                category = CategoryModel(id=1, name="Тестовая категория", is_active=True)
                session.add(category)

                await session.commit()

                yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


@pytest.fixture(scope="function")
def client(db_session):
    """TestClient с подменой БД."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_async_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


# ======================== Тесты ============================

@pytest.mark.asyncio
async def test_checkout_success(client, db_session):
    """POST /orders/checkout — успешное создание заказа."""
    # Создаём продукт и корзину через прямой SQL
    from sqlalchemy import text

    await db_session.execute(text(
        "INSERT INTO products (id, name, description, price, stock, is_active, category_id, seller_id, rating) "
        "VALUES (1, 'Товар 1', 'Описание', 1000.00, 50, true, 1, 1, 0.0)"
    ))
    await db_session.execute(text(
        "INSERT INTO products (id, name, description, price, stock, is_active, category_id, seller_id, rating) "
        "VALUES (2, 'Товар 2', 'Описание 2', 500.00, 20, true, 1, 1, 0.0)"
    ))

    await db_session.execute(text(
        "INSERT INTO cart_items (user_id, product_id, quantity) VALUES (2, 1, 2)"
    ))
    await db_session.execute(text(
        "INSERT INTO cart_items (user_id, product_id, quantity) VALUES (2, 2, 1)"
    ))
    await db_session.commit()

    # Выполняем checkout
    token = create_access_token(data={
        "sub": "buyer@example.com",
        "role": "buyer",
        "id": 2,
    })
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post("/orders/checkout", headers=headers)
    assert response.status_code == status.HTTP_201_CREATED, response.text

    data = response.json()
    assert "order" in data
    order = data["order"]

    assert order["user_id"] == 2
    assert order["status"] == "pending"
    assert "total_amount" in order
    assert len(order["items"]) == 2

    # Проверяем, что корзина очищена
    cart_count = await db_session.execute(text(
        "SELECT COUNT(*) FROM cart_items WHERE user_id = 2"
    ))
    assert cart_count.scalar() == 0, "Корзина должна быть очищена"

    # Проверяем, что заказ создан
    order_count = await db_session.execute(text(
        "SELECT COUNT(*) FROM orders WHERE user_id = 2"
    ))
    assert order_count.scalar() >= 1, "Заказ должен быть создан"


@pytest.mark.asyncio
async def test_checkout_empty_cart(client, db_session):
    """POST /orders/checkout — пустая корзина возвращает 400."""
    token = create_access_token(data={
        "sub": "buyer@example.com",
        "role": "buyer",
        "id": 2,
    })
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post("/orders/checkout", headers=headers)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Cart is empty" in response.json()["detail"]


@pytest.mark.asyncio
async def test_checkout_no_token(client):
    """POST /orders/checkout без токена — 401."""
    response = client.post("/orders/checkout")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
async def test_checkout_bad_token(client):
    """POST /orders/checkout с неверным токеном — 401."""
    headers = {"Authorization": "Bearer invalid_token"}
    response = client.post("/orders/checkout", headers=headers)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

# app/tests/test_products.py
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.products import Product as ProductModel
from app.models.categories import Category as CategoryModel
from app.models.users import User as UserModel
from app.db_depends import get_async_db
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.auth import create_access_token
from contextlib import asynccontextmanager

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestingSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="function")
async def db_session():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        # Вставляем данные
        seller = UserModel(
            id=4,
            email="seller2@example.com",
            hashed_password="hashed_password",
            role="seller",
            is_active=True
        )
        session.add(seller)

        category = CategoryModel(
            id=2,
            name="Электроника",
            is_active=True
        )
        session.add(category)

        await session.commit()
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="function")
def client(db_session):
    # ✅ ПРАВИЛЬНО: async генератор
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_async_db] = override_get_db
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_create_product_201_success(client):
    # Генерируем токен
    token = create_access_token(data={
        "sub": "seller2@example.com",
        "role": "buyer",
        "id": 4
    })
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post("/products/", json={
        "name": "Test Laptop",
        "description": "A great laptop123",
        "price": 999.99,
        "image_url": "http://example.com/image.jpg",
        "stock": 10,
        "category_id": 2
    }, headers=headers)

    assert response.status_code == 201, f"Expected 201, got {response.status_code}"
    data = response.json()
    assert data["id"] == 1
    assert data["name"] == "Test Laptop"
    assert data["seller_id"] == 4
    assert data["category_id"] == 2
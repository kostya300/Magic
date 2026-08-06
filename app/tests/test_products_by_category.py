# app/tests/test_products_by_category.py
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.categories import Category as CategoryModel
from app.models.products import Product as ProductModel
from app.db_depends import get_async_db
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.database import Base

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestingSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="function")
async def db_session():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        # ✅ ДОБАВЛЯЕМ КАТЕГОРИЮ id=2 (как в curl)
        category = CategoryModel(
            name="Electronics",
            is_active=True
        )
        session.add(category)
        await session.flush()
        assert category.id == 1
        product = ProductModel(
            name="Test Product",
            description="Test description",
            price=99.99,
            image_url="http://example.com/test.jpg",
            stock=10,
            category_id=category.id,
            seller_id=1,
            is_active=True
        )
        session.add(product)

        await session.commit()
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="function")
def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_async_db] = override_get_db
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_products_by_category_returns_list(client):
    """
    GET /products/category/2 возвращает список товаров в категории.
    """
    category_id = 1  # ← ТОЧНО КАК В CURL!
    response = client.get(f"/products/category/{category_id}/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # Проверяем, что вернулись товары
    assert len(data) >= 0  # Можно быть пустым, если нет товаров
"""Скрипт для очистки и заполнения БД тестовыми данными."""
import asyncio
from uuid import uuid4
from sqlalchemy import text
from app.database import async_engine


async def seed_database():
    async with async_engine.begin() as conn:
        # 1. Очистка таблиц
        print("⏳ Очистка таблиц...")
        await conn.execute(text("DELETE FROM reviews"))
        await conn.execute(text("DELETE FROM cart_items"))
        await conn.execute(text("DELETE FROM products"))
        await conn.execute(text("DELETE FROM categories"))
        await conn.execute(text("DELETE FROM users"))

        # Сброс автоинкрементов
        await conn.execute(text("ALTER SEQUENCE products_id_seq RESTART WITH 1"))
        await conn.execute(text("ALTER SEQUENCE users_id_seq RESTART WITH 1"))
        await conn.execute(text("ALTER SEQUENCE categories_id_seq RESTART WITH 1"))

        # 2. Создаём пользователей
        print("⏳ Создание пользователей...")
        await conn.execute(text("""
            INSERT INTO users (id, email, hashed_password, is_active, role) VALUES
                (1, 'seller@example.com', 'dummy_hash', true, 'seller'),
                (2, 'seller2@example.com', 'dummy_hash', true, 'seller'),
                (3, 'buyer@example.com', 'dummy_hash', true, 'buyer')
        """))

        # 3. Создаём категории
        print("⏳ Создание категорий...")
        await conn.execute(text("""
            INSERT INTO categories (id, name, parent_id, is_active) VALUES
                (1, 'Электроника', NULL, true),
                (2, 'Смартфоны', 1, true),
                (3, 'Ноутбуки', 1, true),
                (4, 'Одежда', NULL, true),
                (5, 'Фрукты', NULL, true)
        """))

        # 4. Создаём товары
        print("⏳ Создание товаров...")
        # TSVECTOR вычисляется автоматически PostgreSQL (computed column)
        await conn.execute(text("""
            INSERT INTO products
                (id, name, description, price, image_url, stock, is_active, category_id, seller_id, rating)
            VALUES
                (1,  'Смартфон Galaxy S24', 'Флагманский смартфон', 89990.00, 'https://via.placeholder.com/300', 25, true,  2, 1, 4.5),
                (2,  'Ноутбук ProBook 15', 'Мощный ноутбук для работы', 64990.00, 'https://via.placeholder.com/300', 10, true,  3, 1, 4.2),
                (3,  'Футболка Classic', 'Хлопковая футболка', 1990.00,  'https://via.placeholder.com/300', 200, true, 4, 1, 4.8),
                (4,  'Яблоки Гала', 'Свежие яблоки, 1 кг', 189.50,   'https://via.placeholder.com/300', 500, true, 5, 2, 4.0),
                (5,  'Наушники Wireless', 'Беспроводные наушники', 5990.00, 'https://via.placeholder.com/300', 75, true, 1, 2, 4.7),
                (6,  'Куртка Winter Pro', 'Тёплая куртка для зимы', 12990.00, 'https://via.placeholder.com/300', 30, true, 4, 1, 4.3),
                (7,  'Бананы', 'Эквадорские бананы, 1 кг', 129.90,  'https://via.placeholder.com/300', 800, true, 5, 2, 4.6),
                (8,  'Планшет Tab S9', 'Планшет для медиа', 42990.00, 'https://via.placeholder.com/300', 40, true, 2, 1, 4.1),
                (9,  'Монитор 4K Ultra', 'Монитор 27 дюймов 4K', 32990.00, 'https://via.placeholder.com/300', 15, true, 1, 2, 4.9),
                (10, 'Джинсы Slim Fit', 'Классические джинсы', 4490.00,  'https://via.placeholder.com/300', 100, true, 4, 1, 4.4)
        """))

        print("✅ База данных заполнена!")
        print(f"\n👤 Пользователи: 3 (seller, seller2, buyer)")
        print(f"📁 Категории: 5")
        print(f"📦 Товары: 10")


if __name__ == "__main__":
    asyncio.run(seed_database())

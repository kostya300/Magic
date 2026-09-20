from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_current_user
from app.db_depends import get_async_db
from app.models.favorites import Favorite
from app.models.products import Product
from app.models.users import User as UserModel
from app.schemas import Product as ProductSchema

router = APIRouter(
    prefix="/favorites",
    tags=["favorites"],
)


@router.get("/")
async def get_favorites(
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user),
):
    """
    Возвращает список избранных товаров текущего пользователя.
    """
    result = await db.execute(
        select(Product)
        .join(Favorite)
        .where(Favorite.user_id == current_user.id)
        .options(selectinload(Product.category))
        .order_by(Favorite.id.desc())
    )
    products = result.scalars().all()
    return products


@router.post("/{product_id}")
async def add_to_favorites(
    product_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user),
):
    """
    Добавляет товар в избранное.
    """
    # Проверяем, существует ли товар
    product_result = await db.execute(select(Product).where(Product.id == product_id))
    product = product_result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Товар не найден")

    # Проверяем, не добавлен ли уже товар
    existing = await db.execute(
        select(Favorite).where(
            Favorite.user_id == current_user.id,
            Favorite.product_id == product_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Товар уже в избранном"
        )

    # Добавляем в избранное
    favorite = Favorite(user_id=current_user.id, product_id=product_id)
    db.add(favorite)
    await db.commit()

    return {"message": "Товар добавлен в избранное"}


@router.delete("/{product_id}")
async def remove_from_favorites(
    product_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user),
):
    """
    Удаляет товар из избранного.
    """
    result = await db.execute(
        select(Favorite).where(
            Favorite.user_id == current_user.id,
            Favorite.product_id == product_id
        )
    )
    favorite = result.scalar_one_or_none()
    if not favorite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Товар не найден в избранном")

    await db.delete(favorite)
    await db.commit()

    return {"message": "Товар удалён из избранного"}


@router.get("/check/{product_id}")
async def check_favorite(
    product_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user),
):
    """
    Проверяет, находится ли товар в избранном.
    """
    result = await db.execute(
        select(Favorite).where(
            Favorite.user_id == current_user.id,
            Favorite.product_id == product_id
        )
    )
    is_favorite = result.scalar_one_or_none() is not None
    return {"is_favorite": is_favorite}

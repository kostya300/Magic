from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_current_user
from app.db_depends import get_async_db
from app.models.cart_items import CartItem as CartItemModel
from app.models.products import Product as ProductModel
from app.models.users import User as UserModel
from app.schemas import (
Cart as CartSchema,
CartItem as CartItemSchema,
CartItemCreate,
CartItemUpdate,
)
router = APIRouter(prefix="/cart", tags=["cart"])

async def _ensure_product_available(db: AsyncSession, product_id: int) -> None:
    result = await db.scalars(select(ProductModel).where(ProductModel.id == product_id,ProductModel.is_active == True))
    product = result.first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found or inactive")

async def _get_cart_item(db: AsyncSession, user_id: int, product_id: int) -> CartItemModel | None:
    result = await db.scalars(select(CartItemModel)
        .options(selectinload(CartItemModel.product))
        .where(
            CartItemModel.user_id == user_id,
            CartItemModel.product_id == product_id,
        ))
    return result.first()

@router.get("/",response_model=CartSchema)
async def get_cart(db: AsyncSession = Depends(get_async_db), current_user: UserModel = Depends(get_current_user)):
    result = await db.scalars(select(CartItemModel).where(CartItemModel.user_id == current_user.id).order_by(CartItemModel.id))
    items = result.all()
    total_quantity = sum(item.quantity for item in items)
    price_items = (
        Decimal(item.quantity) *
        (item.product.price if item.product.price is not None else Decimal(0))
        for item in items
    )
    total_price_decimal = sum(price_items, Decimal(0))
    return CartSchema(
        user_id=current_user.id,
        items=items,
        total_quantity=total_quantity,
        total_price=total_price_decimal,
    )
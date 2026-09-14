from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_current_user
from app.db_depends import get_async_db
from app.models.cart_items import CartItem as CartItemModel
from app.models.orders import Order as OrderModel, OrderItem as OrderItemModel
from app.models.users import User as UserModel
from app.schemas import Order as OrderSchema, OrderList, OrderCheckoutResponse, OrderStatusResponse
from app.payments import create_yookassa_payment

router = APIRouter(
    prefix="/orders",
    tags=["orders"],
)

async def _load_order_with_items(db: AsyncSession, order_id: int) -> OrderModel | None:
    result = await db.execute(
        select(OrderModel)
        .options(
            selectinload(OrderModel.items).selectinload(OrderItemModel.product),
        )
        .where(OrderModel.id == order_id)
    )
    return result.scalar_one_or_none()


@router.post(
    "/checkout",
    response_model=OrderCheckoutResponse,
    status_code=status.HTTP_201_CREATED,
)
async def checkout_order(
        db: AsyncSession = Depends(get_async_db),
        current_user: UserModel = Depends(get_current_user),
):
    """
    Создаёт заказ на основе текущей корзины пользователя.
    """
    try:
        cart_result = await db.execute(
            select(CartItemModel)
                .options(selectinload(CartItemModel.product))
                .join(CartItemModel.product)
                .where(CartItemModel.user_id == current_user.id)
                .order_by(CartItemModel.id)
        )
        cart_items = list(cart_result.scalars().all())
        print(f"[checkout] Loaded {len(cart_items)} cart items")
        if not cart_items:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")

        order = OrderModel(user_id=current_user.id)
        total_amount = Decimal("0")

        for cart_item in cart_items:
            product = cart_item.product
            if not product or not product.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product {cart_item.product_id} is unavailable",
                )
            if product.stock < cart_item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Not enough stock for product {product.name}",
                )

            unit_price = product.price
            if unit_price is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product {product.name} has no price set",
                )
            total_price = unit_price * cart_item.quantity
            total_amount += total_price

            order_item = OrderItemModel(
                product_id=cart_item.product_id,
                quantity=cart_item.quantity,
                unit_price=unit_price,
                total_price=total_price,
            )
            order.items.append(order_item)

            product.stock -= cart_item.quantity

        order.total_amount = total_amount
        order.status = "pending"
        db.add(order)

        await db.execute(delete(CartItemModel).where(CartItemModel.user_id == current_user.id))
        await db.commit()

        created_order = await _load_order_with_items(db, order.id)
        if not created_order:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to load created order",
            )
        
        print(f"[checkout] Order created: {created_order.id}, total: {created_order.total_amount}")
        return OrderCheckoutResponse(order=created_order)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        import traceback
        import sys
        exc_type, exc_value, exc_tb = sys.exc_info()
        error_details = ''.join(traceback.format_exception(exc_type, exc_value, exc_tb))
        print(f"[checkout ERROR] {error_details}", file=sys.stderr)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal error: {str(e)} | {error_details[:200]}",
        )


@router.post("/{order_id}/pay")
async def pay_order(
    order_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user),
):
    """
    Создаёт платёж в ЮKassa для заказа.
    """
    order = await _load_order_with_items(db, order_id)
    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    
    if order.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Заказ не может быть оплачен",
        )
    
    try:
        payment_info = await create_yookassa_payment(
            order_id=order.id,
            amount=order.total_amount,
            user_email=current_user.email,
            description=f"Оплата заказа #{order.id}",
        )
        
        order.payment_id = payment_info.get("id")
        order.status = "awaiting_payment"
        await db.commit()
        
        return {
            "payment_url": payment_info.get("confirmation_url"),
            "order_id": order.id,
        }
    except RuntimeError as exc:
        await db.rollback()
        print(f"YooKassa RuntimeError: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        await db.rollback()
        print(f"YooKassa error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Не удалось подключиться к ЮKassa",
        ) from exc


@router.get("/{order_id}/status", response_model=OrderStatusResponse)
async def get_order_status(
    order_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user),
):
    """
    Возвращает текущий статус заказа для текущего пользователя.
    """
    result = await db.execute(
        select(OrderModel).where(OrderModel.id == order_id)
    )
    order = result.scalar_one_or_none()

    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    status_messages: dict[str, str] = {
        "paid": f"Спасибо! Заказ #{order_id} оплачен. Ожидайте доставку.",
        "canceled": "Оплата не прошла. Попробуйте ещё раз.",
        "failed": "Оплата не прошла. Попробуйте ещё раз.",
        "pending": "Оплата в процессе...",
        "awaiting_payment": "Ожидает оплаты",
    }

    message = status_messages.get(order.status, "Неизвестный статус заказа")

    return OrderStatusResponse(
        order_id=order.id,
        status=order.status,
        paid_at=order.paid_at,
        message=message,
    )


@router.get("/", response_model=OrderList)
async def list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user),
):
    """
    Возвращает заказы текущего пользователя с простой пагинацией.
    """
    total = await db.scalar(
        select(func.count(OrderModel.id)).where(OrderModel.user_id == current_user.id)
    )
    result = await db.scalars(
        select(OrderModel)
        .options(selectinload(OrderModel.items).selectinload(OrderItemModel.product))
        .where(OrderModel.user_id == current_user.id)
        .order_by(OrderModel.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    orders = result.all()
    return OrderList(items=orders, total=total or 0, page=page, page_size=page_size)


@router.get("/{order_id}", response_model=OrderSchema)
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user),
):
    """
    Возвращает детальную информацию по заказу.
    """
    order = await _load_order_with_items(db, order_id)
    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@router.put("/{order_id}/cancel", response_model=OrderSchema)
async def cancel_order(
    order_id: int,
    reason: str = Query(..., description="Причина отмены заказа"),
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user),
):
    """
    Отменяет заказ с указанием причины.
    """
    order = await _load_order_with_items(db, order_id)
    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Заказ уже отменён",
        )
    order.status = "cancelled"
    order.cancellation_reason = reason
    await db.commit()
    await db.refresh(order)
    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(
    order_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user),
):
    """
    Удаляет заказ, если он принадлежит текущему пользователю.
    """
    order = await _load_order_with_items(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нет прав для удаления этого заказа")
    if order.status not in ("pending", "cancelled"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Можно удалить только отменённые или ожидающие заказы")
    await db.delete(order)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/admin/cancelled", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cancelled_orders(
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user),
):
    """
    Удаляет все отменённые заказы (только для администратора).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ только для администратора")
    
    result = await db.execute(
        delete(OrderModel).where(OrderModel.status == "cancelled")
    )
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

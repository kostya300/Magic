# app/routers/reviews.py
from sqlalchemy.ext.asyncio import AsyncSession
from app.db_depends import get_async_db
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, update, and_, func
from typing import Optional, List
from app.models.reviews import Review as ReviewModel
from app.models.users import User as UserModel
from app.models.products import Product as ProductModel
from app.schemas import ReviewInDB, ReviewCreate, ReviewUpdate
from app.auth import get_current_user

router = APIRouter(
    prefix="/reviews",
    tags=["reviews"],
)


async def update_product_rating(db: AsyncSession, product_id: int) -> float:
    result = await db.execute(
        select(func.avg(ReviewModel.grade)).where(
            ReviewModel.product_id == product_id,
            ReviewModel.is_active == True
        )
    )
    avg_rating = result.scalar() or 0.0
    product = await db.get(ProductModel, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found when updating rating")
    product.rating = avg_rating
    await db.flush()
    return avg_rating


# 1. GET /reviews/ - получить все активные отзывы
@router.get("/", response_model=List[ReviewInDB], status_code=status.HTTP_200_OK)
async def get_all_reviews(
        product_id: Optional[int] = Query(None, description="Фильтр по ID товара"),
        user_id: Optional[int] = Query(None, description="Фильтр по ID пользователя"),
        min_grade: Optional[int] = Query(None, ge=1, le=5, description="Минимальная оценка"),
        max_grade: Optional[int] = Query(None, ge=1, le=5, description="Максимальная оценка"),
        limit: int = Query(100, ge=1, le=1000, description="Количество записей"),
        offset: int = Query(0, ge=0, description="Смещение для пагинации"),
        db: AsyncSession = Depends(get_async_db)
):
    """
    Возвращает список всех активных отзывов.
    """
    stmt = select(ReviewModel).where(ReviewModel.is_active == True)

    if product_id:
        stmt = stmt.where(ReviewModel.product_id == product_id)
    if user_id:
        stmt = stmt.where(ReviewModel.user_id == user_id)
    if min_grade:
        stmt = stmt.where(ReviewModel.grade >= min_grade)
    if max_grade:
        stmt = stmt.where(ReviewModel.grade <= max_grade)

    stmt = stmt.order_by(ReviewModel.comment_date.desc()).offset(offset).limit(limit)

    result = await db.scalars(stmt)
    reviews = result.all()
    return reviews

# 2. GET /products/{product_id}/reviews/ - получить отзывы о конкретном товаре
@router.get("/products/{product_id}/reviews/", response_model=List[ReviewInDB], status_code=status.HTTP_200_OK)
async def get_product_reviews(
        product_id: int,
        limit: int = Query(100, ge=1, le=1000, description="Количество записей"),
        offset: int = Query(0, ge=0, description="Смещение для пагинации"),
        db: AsyncSession = Depends(get_async_db)
):
    """
    Возвращает список активных отзывов для указанного товара.
    """
    product_result = await db.scalars(
        select(ProductModel).where(
            and_(ProductModel.id == product_id, ProductModel.is_active == True)
        )
    )
    product = product_result.first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or inactive"
        )

    stmt = select(ReviewModel).where(
        and_(
            ReviewModel.product_id == product_id,
            ReviewModel.is_active == True
        )
    ).order_by(ReviewModel.comment_date.desc()).offset(offset).limit(limit)
    result = await db.scalars(stmt)
    reviews = result.all()
    return reviews


# 3. POST /reviews/ - создать отзыв
@router.post("/", response_model=ReviewInDB, status_code=status.HTTP_201_CREATED)
async def create_review(
        review: ReviewCreate,
        db: AsyncSession = Depends(get_async_db),
        current_user: UserModel = Depends(get_current_user)
):
    """
    Создаёт новый отзыв (только для 'buyer').
    """
    if current_user.role != "buyer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only buyers can create reviews"
        )

    product_result = await db.scalars(
        select(ProductModel).where(
            and_(ProductModel.id == review.product_id, ProductModel.is_active == True)
        )
    )
    if not product_result.first():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or inactive"
        )

    existing_review_result = await db.scalars(
        select(ReviewModel).where(
            and_(
                ReviewModel.user_id == current_user.id,
                ReviewModel.product_id == review.product_id,
                ReviewModel.is_active == True
            )
        )
    )
    if existing_review_result.first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reviewed this product"
        )

    if not (1 <= review.grade <= 5):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Grade must be between 1 and 5"
        )
    db_review = ReviewModel(
        **review.model_dump(),
        user_id=current_user.id,
        is_active=True
    )

    db.add(db_review)
    await db.flush()
    await db.refresh(db_review)
    await update_product_rating(db, review.product_id)
    await db.commit()

    return db_review


# 4. DELETE /reviews/{review_id} - мягкое удаление отзыва (только admin)
@router.delete("/{review_id}", status_code=status.HTTP_200_OK)
async def delete_review(
        review_id: int,
        db: AsyncSession = Depends(get_async_db),
        current_user: UserModel = Depends(get_current_user)
):
    """
    Выполняет мягкое удаление отзыва (только для администратора).
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authenticated"
        )
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can delete reviews"
        )

    result = await db.scalars(
        select(ReviewModel).where(
            and_(ReviewModel.id == review_id, ReviewModel.is_active == True)
        )
    )
    review = result.first()

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found or already inactive"
        )


    product_id = review.product_id
    await db.execute(
        update(ReviewModel)
        .where(ReviewModel.id == review_id)
        .values(is_active=False)
    )
    await db.flush()
    await update_product_rating(db, product_id)
    await db.commit()
    return {"message": "Review deleted"}
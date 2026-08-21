# app/routers/products.py
from sqlalchemy.ext.asyncio import AsyncSession
from app.db_depends import get_async_db
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy import update
from app.models.products import Product as ProductModel
from app.models.categories import Category as CategoryModel
from app.schemas import Product as ProductSchema, ProductCreate, ProductList
from app.models.users import User as UserModel
from app.auth import get_current_seller
from sqlalchemy import select, func, desc, and_
from pathlib import Path
import uuid
from fastapi import UploadFile, File, Form


router = APIRouter(
    prefix="/products",
    tags=["products"],
)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
MEDIA_ROOT = BASE_DIR / "media" / "products"
MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
MAX_IMAGE_SIZE = 2 * 1024 * 1024  # 2MB


def validate_image(file: UploadFile) -> None:
    """Проверяет MIME-тип, расширение и размер изображения."""
    # Проверяем MIME-тип
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Разрешены только изображения: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Проверяем расширение файла
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Разрешены только изображения: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Проверяем размер (читаем первые 8KB для проверки заголовка)
    header = file.file.read(8)
    file.file.seek(0)
    if len(header) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файл слишком маленький или повреждён"
        )


async def save_product_image(file: UploadFile | None) -> str | None:
    """
    Сохраняет изображение товара и возвращает относительный URL.
    """
    if file is None:
        return None

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only JPG, PNG or WebP images are allowed")

    content = await file.read()
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image is too large")

    extension = Path(file.filename or "").suffix.lower() or ".jpg"
    file_name = f"{uuid.uuid4()}{extension}"
    file_path = MEDIA_ROOT / file_name
    file_path.write_bytes(content)

    return f"/media/products/{file_name}"

def remove_product_image(url: str | None) -> None:
    """
    Удаляет файл изображения, если он существует.
    """
    if not url:
        return
    relative_path = url.lstrip("/")
    file_path = BASE_DIR / relative_path
    if file_path.exists():
        file_path.unlink()
@router.post("/{product_id}/image", response_model=dict)
async def upload_product_image(
        product_id: int,
        file: UploadFile = File(...),
        db: AsyncSession = Depends(get_async_db),
        current_user: UserModel = Depends(get_current_seller),
):
    """
    Загружает изображение для товара. Поддерживает: jpg, png, webp.
    """
    # 1. Проверяем существование товара
    result = await db.scalars(
        select(ProductModel).where(ProductModel.id == product_id)
    )
    db_product = result.first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Товар не найден")

    if db_product.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет прав для этого товара")

    # 2. Валидируем изображение
    validate_image(file)

    # 3. Обновляем product
    image_url = await save_product_image(file)
    db_product.image_url = image_url
    await db.commit()

    return {"message": "Изображение загружено", "image_url": image_url}





# 1. GET /products/ - получить все товары
@router.get("/", response_model=ProductList)
async def get_all_products(
        page: int = Query(1, ge=1),
        page_size: int = Query(10, ge=1, le=100),
        category_id: int | None = Query(
            None, description="ID категории для фильтрации"),
        search: str | None = Query(None, min_length=1, description="Поиск по названию товара"),
        min_price: float | None = Query(
            None, ge=0, description="Минимальная цена товара"),
        max_price: float | None = Query(
            None, ge=0, description="Максимальная цена товара"),
        in_stock: bool | None = Query(
            None, description="true — только товары в наличии, false — только без остатка"),
        seller_id: int | None = Query(
            None, description="ID продавца для фильтрации"),
        db: AsyncSession = Depends(get_async_db),
):
    """
    Возвращает список всех активных товаров с поддержкой фильтров.
    """
    # Проверка логики min_price <= max_price
    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="min_price не может быть больше max_price",
        )

    # Формируем список фильтров
    filters = [ProductModel.is_active == True]

    if category_id is not None:
        filters.append(ProductModel.category_id == category_id)

    if min_price is not None:
        filters.append(ProductModel.price >= min_price)
    if max_price is not None:
        filters.append(ProductModel.price <= max_price)
    if in_stock is not None:
        filters.append(ProductModel.stock > 0 if in_stock else ProductModel.stock == 0)
    if seller_id is not None:
        filters.append(ProductModel.seller_id == seller_id)

    # Подсчёт общего количества с учётом фильтров
    total_stmt = select(func.count()).select_from(ProductModel).where(*filters)
    rank_col = None
    if search:
        search_value = search.strip()
        if search_value:
            ts_query = func.websearch_to_tsquery('english',search_value)
            filters.append(ProductModel.tsv.op('@@')(ts_query))
            rank_col = func.ts_rank_cd(ProductModel.tsv,ts_query).label('rank')
            total_stmt = select(func.count()).select_from(ProductModel).where(*filters)
    total = await db.scalar(total_stmt) or 0

    # Выборка товаров с фильтрами и пагинацией
    if rank_col is not None:
        products_stmt = (
            select(ProductModel, rank_col)
            .where(*filters)
            .order_by(desc(rank_col), ProductModel.id)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await db.execute(products_stmt)
        rows = result.all()
        items = [row[0] for row in rows]
    else:
        products_stmt = (
            select(ProductModel)
            .where(*filters)
            .order_by(ProductModel.id)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        items = (await db.scalars(products_stmt)).all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# 2. POST /products/ - создать товар
@router.post("/", response_model=ProductSchema, status_code=status.HTTP_201_CREATED)
async def create_product(
        product: ProductCreate = Depends(ProductCreate.as_form),
        image: UploadFile | None = File(None),
        db: AsyncSession = Depends(get_async_db),
        current_user: UserModel = Depends(get_current_seller)
):
    print(f"ProductCreate data: {product.model_dump()}")
    print(f"Current user: {current_user.email}, role={current_user.role}")

    # 1. Проверка категории
    category_stmt = select(CategoryModel).where(
        CategoryModel.id == product.category_id,
        CategoryModel.is_active == True
    )
    category_result = await db.scalars(category_stmt)
    category = category_result.first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category not found or inactive"
        )

    image_url = await save_product_image(image) if image else None

    db_product = ProductModel(
        **product.model_dump(),
        seller_id=current_user.id,
        is_active=True,
        image_url=image_url,
    )

    db.add(db_product)
    await db.flush()
    await db.refresh(db_product)
    await db.commit()

    return db_product


# 3. GET /products/category/{category_id} - товары по категории
@router.get("/category/{category_id}", response_model=list[ProductSchema], status_code=status.HTTP_200_OK)
async def get_products_by_category(
        category_id: int,
        db: AsyncSession = Depends(get_async_db)
):
    """
    Возвращает список товаров в указанной категории по её ID.
    """
    # Проверяем категорию
    category_stmt = select(CategoryModel).where(
        CategoryModel.id == category_id,
        CategoryModel.is_active == True
    )
    category_result = await db.scalars(category_stmt)
    category = category_result.first()

    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")

    # Получаем товары в категории
    products_stmt = select(ProductModel).where(
        ProductModel.is_active == True,
        ProductModel.category_id == category_id
    )
    products_result = await db.scalars(products_stmt)
    products = products_result.all()
    return products


# 4. GET /products/{product_id} - получить товар по ID
@router.get("/{product_id}", response_model=ProductSchema, status_code=status.HTTP_200_OK)
async def get_product(
        product_id: int,
        db: AsyncSession = Depends(get_async_db)
):
    """
    Возвращает детальную информацию о товаре по его ID.
    """
    stmt = select(ProductModel).where(
        ProductModel.id == product_id,
        ProductModel.is_active == True
    )
    product_result = await db.scalars(stmt)
    product = product_result.first()

    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# 5. PUT /products/{product_id} - обновить товар
@router.put("/{product_id}", response_model=ProductSchema)
async def update_product(
        product_id: int,
        product: ProductCreate = Depends(ProductCreate.as_form),
        image: UploadFile | None = File(None),
        db: AsyncSession = Depends(get_async_db),
        current_user: UserModel = Depends(get_current_seller)
):
    """
    Обновляет товар, если он принадлежит текущему продавцу (только для 'seller').
    """
    result = await db.scalars(
        select(ProductModel).where(ProductModel.id == product_id)
    )
    db_product = result.first()

    if not db_product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    if db_product.seller_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="You can only update your own products")

    category_result = await db.scalars(
        select(CategoryModel).where(CategoryModel.id == product.category_id,
                                    CategoryModel.is_active == True)
    )
    if not category_result.first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category not found or inactive"
        )

    await db.execute(
        update(ProductModel)
        .where(ProductModel.id == product_id)
        .values(**product.model_dump())
    )
    if image:
        remove_product_image(db_product.image_url)
        db_product.image_url = await save_product_image(image)

    await db.commit()
    await db.refresh(db_product)
    return db_product


# 6. DELETE /products/{product_id} - удалить товар
@router.delete("/{product_id}", response_model=ProductSchema)
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_seller)
):
    """
    Выполняет мягкое удаление товара, если он принадлежит текущему продавцу (только для 'seller').
    """
    result = await db.scalars(
        select(ProductModel).where(
            ProductModel.id == product_id,
            ProductModel.is_active == True
        )
    )
    product = result.first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or inactive"
        )

    if product.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own products"
        )

    await db.execute(
        update(ProductModel)
        .where(ProductModel.id == product_id)
        .values(is_active=False)
    )
    remove_product_image(product.image_url)
    await db.commit()
    await db.refresh(product)
    return product

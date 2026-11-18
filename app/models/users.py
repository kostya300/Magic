from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey

from app.database import Base


class User(Base):
    __tablename__ = "users"
    cart_items: Mapped[list["CartItem"]] = relationship("CartItem", back_populates="user", cascade="all, delete-orphan")
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    role: Mapped[str] = mapped_column(String, default="buyer")  # "buyer" or "seller"
    name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(200), nullable=True)
    reviews: Mapped[list["Review"]] = relationship(
        "Review", back_populates="user", cascade="all, delete-orphan"
    )
    products: Mapped[list["Product"]] = relationship(
        "Product", back_populates="seller", cascade="all, delete-orphan"
    )
    orders: Mapped[list["Order"]] = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    favorites: Mapped[list["Favorite"]] = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
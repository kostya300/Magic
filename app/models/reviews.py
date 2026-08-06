# app/models/reviews.py
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column,relationship
from sqlalchemy.sql import func
from app.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    comment = Column(Text, nullable=True)
    comment_date = Column(DateTime, default=func.now())
    grade = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)
    __table_args__ = (
        CheckConstraint('grade >= 1 AND grade <= 5', name='check_grade_range'),
    )
    user = relationship("User", back_populates="reviews")
    product = relationship("Product", back_populates="reviews")

    def __repr__(self):
        return f"<Review(id={self.id}, user_id={self.user_id}, product_id={self.product_id}, grade={self.grade})>"
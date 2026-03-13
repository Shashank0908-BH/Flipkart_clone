from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    phone = Column(String(15), unique=True, nullable=True)
    email = Column(String(255), unique=True, nullable=True)
    name = Column(String(255), default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=func.now())

    wishlist_items = relationship("WishlistItem", back_populates="user")
    addresses = relationship("Address", back_populates="user")


class OTP(Base):
    __tablename__ = "otps"

    id = Column(Integer, primary_key=True, autoincrement=True)
    phone_or_email = Column(String(255), nullable=False, index=True)
    otp_code = Column(String(6), nullable=False)
    created_at = Column(DateTime(timezone=True), default=func.now())
    is_used = Column(Boolean, default=False)


class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(String(50), nullable=False)  # e.g. "prod-79"
    added_at = Column(DateTime(timezone=True), default=func.now())

    user = relationship("User", back_populates="wishlist_items")


class Address(Base):
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    full_name = Column(String(255))
    phone = Column(String(15))
    address_line_1 = Column(Text)
    address_line_2 = Column(Text, nullable=True)
    city = Column(String(100))
    state = Column(String(100))
    pincode = Column(String(10))
    is_default = Column(Boolean, default=False)

    user = relationship("User", back_populates="addresses")

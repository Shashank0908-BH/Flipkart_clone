from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base
import uuid

class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, index=True, default=lambda: f"ord-{uuid.uuid4().hex[:8]}")
    user_id = Column(String, index=True, nullable=False)
    status = Column(String, default="PENDING") # PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
    total_amount = Column(Float, nullable=False)
    shipping_address = Column(JSON, nullable=False) # Store address snapshot
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="order", uselist=False)


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    product_id = Column(String, nullable=False)
    title = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False) # Price at time of order
    thumbnail = Column(String)

    order = relationship("Order", back_populates="items")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True, index=True, default=lambda: f"pay-{uuid.uuid4().hex[:8]}")
    order_id = Column(String, ForeignKey("orders.id"), nullable=False, unique=True)
    amount = Column(Float, nullable=False)
    method = Column(String, nullable=False) # UPI, CARD, NET_BANKING, COD
    status = Column(String, default="SUCCESS") # mocked success
    transaction_id = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order", back_populates="payment")

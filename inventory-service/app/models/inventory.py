from sqlalchemy import Column, String, Integer, Float, DateTime
from sqlalchemy.sql import func
from app.db.session import Base

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(String, primary_key=True, index=True) # SKU or Product ID e.g. "prod-1"
    stock_quantity = Column(Integer, default=0)
    reserved_quantity = Column(Integer, default=0) # Stock reserved in people's carts
    status = Column(String, default="In Stock") # Active, Grab or Gone, Out of Stock
    last_updated = Column(DateTime(timezone=True), onupdate=func.now(), default=func.now())

"""
Sync inventory records from the seeded Elasticsearch product catalog.

Usage:
  source venv/bin/activate && python sync_inventory.py
"""

import httpx
from urllib.parse import urlencode
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import SessionLocal, engine, Base
from app.models.inventory import InventoryItem

INDEX_NAME = "products"

print("Recreating tables...")
Base.metadata.create_all(bind=engine)


def fetch_seeded_products() -> list:
    query = urlencode({"size": 500, "_source": "id,stock,availability_status"})
    with httpx.Client(timeout=30.0) as client:
        response = client.get(
            f"{settings.ELASTICSEARCH_URL}/{INDEX_NAME}/_search?{query}"
        )
        response.raise_for_status()
        payload = response.json()
    hits = payload.get("hits", {}).get("hits", [])
    return [hit.get("_source", {}) for hit in hits]


def determine_status(stock: int) -> str:
    if stock <= 0:
        return "Out of Stock"
    if stock <= 5:
        return "Grab or Gone"
    return "In Stock"


def sync_inventory():
    products = fetch_seeded_products()
    db: Session = SessionLocal()

    try:
        for product in products:
            item_id = product["id"]
            stock_qty = int(product.get("stock", 12))
            status = determine_status(stock_qty)

            existing_item = (
                db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
            )

            if existing_item:
                existing_item.stock_quantity = stock_qty
                existing_item.status = status
            else:
                db.add(
                    InventoryItem(
                        id=item_id,
                        stock_quantity=stock_qty,
                        reserved_quantity=0,
                        status=status,
                    )
                )

        db.commit()
        print(f"Inventory sync complete. Total items: {len(products)}")
    except Exception as exc:
        print(f"Error syncing inventory: {exc}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    sync_inventory()

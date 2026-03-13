from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.inventory import InventoryItem

router = APIRouter()


class ReserveInventoryItem(BaseModel):
    item_id: str
    quantity: int


class ReserveInventoryBatch(BaseModel):
    items: list[ReserveInventoryItem]


def _update_inventory_status(item: InventoryItem):
    remaining_stock = item.stock_quantity - item.reserved_quantity
    if remaining_stock <= 0:
        item.status = "Out of Stock"
    elif remaining_stock < 5:
        item.status = "Grab or Gone"
    else:
        item.status = "In Stock"


@router.get("/{item_id}")
def get_inventory(item_id: str, db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    # Calculate available stock
    available_stock = item.stock_quantity - item.reserved_quantity
    
    return {
        "id": item.id,
        "available_stock": available_stock,
        "total_stock": item.stock_quantity,
        "status": item.status,
        "last_updated": item.last_updated
    }

@router.put("/{item_id}/reserve")
def reserve_inventory(item_id: str, quantity: int = 1, db: Session = Depends(get_db)):
    item = (
        db.query(InventoryItem)
        .filter(InventoryItem.id == item_id)
        .with_for_update()
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
        
    available_stock = item.stock_quantity - item.reserved_quantity
    if available_stock < quantity:
        raise HTTPException(status_code=400, detail="Not enough stock available")
        
    item.reserved_quantity += quantity
    _update_inventory_status(item)
        
    db.commit()
    db.refresh(item)
    return {"message": f"Reserved {quantity} items", "status": item.status}


@router.post("/reserve-batch")
def reserve_inventory_batch(
    payload: ReserveInventoryBatch,
    db: Session = Depends(get_db),
):
    items_by_id = {
        item.id: item
        for item in db.query(InventoryItem)
        .filter(InventoryItem.id.in_([entry.item_id for entry in payload.items]))
        .with_for_update()
        .all()
    }

    for entry in payload.items:
        inventory_item = items_by_id.get(entry.item_id)
        if not inventory_item:
            raise HTTPException(
                status_code=404,
                detail=f"Inventory item {entry.item_id} not found",
            )

        available_stock = (
            inventory_item.stock_quantity - inventory_item.reserved_quantity
        )
        if available_stock < entry.quantity:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Not enough stock for {entry.item_id}. "
                    f"Only {available_stock} available."
                ),
            )

    for entry in payload.items:
        inventory_item = items_by_id[entry.item_id]
        inventory_item.reserved_quantity += entry.quantity
        _update_inventory_status(inventory_item)

    db.commit()
    return {"message": "Inventory reserved", "count": len(payload.items)}


@router.post("/release-batch")
def release_inventory_batch(
    payload: ReserveInventoryBatch,
    db: Session = Depends(get_db),
):
    items_by_id = {
        item.id: item
        for item in db.query(InventoryItem)
        .filter(InventoryItem.id.in_([entry.item_id for entry in payload.items]))
        .with_for_update()
        .all()
    }

    for entry in payload.items:
        inventory_item = items_by_id.get(entry.item_id)
        if not inventory_item:
            raise HTTPException(
                status_code=404,
                detail=f"Inventory item {entry.item_id} not found",
            )

        inventory_item.reserved_quantity = max(
            0,
            inventory_item.reserved_quantity - entry.quantity,
        )
        _update_inventory_status(inventory_item)

    db.commit()
    return {"message": "Inventory released", "count": len(payload.items)}

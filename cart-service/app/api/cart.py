from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.services.cart_service import get_cart, add_item, update_item, remove_item, clear_cart

router = APIRouter()

# For the MVP, we use a default user. Auth service will replace this later.
DEFAULT_USER = "user-default"


@router.get("/")
async def get_user_cart(user_id: str = Query(DEFAULT_USER, description="User ID")):
    """Get the full shopping cart for a user."""
    return await get_cart(user_id)


@router.post("/items")
async def add_cart_item(
    product_id: str,
    quantity: int = 1,
    user_id: str = Query(DEFAULT_USER, description="User ID"),
):
    """Add an item to the cart. Validates stock before adding."""
    result = await add_item(user_id, product_id, quantity)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.put("/items/{product_id}")
async def update_cart_item(
    product_id: str,
    quantity: int,
    user_id: str = Query(DEFAULT_USER, description="User ID"),
):
    """Update the quantity of an item in the cart. Set to 0 to remove."""
    result = await update_item(user_id, product_id, quantity)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.delete("/items/{product_id}")
async def delete_cart_item(
    product_id: str,
    user_id: str = Query(DEFAULT_USER, description="User ID"),
):
    """Remove an item from the cart."""
    return await remove_item(user_id, product_id)


@router.delete("/")
async def clear_user_cart(
    user_id: str = Query(DEFAULT_USER, description="User ID"),
):
    """Clear all items from the cart."""
    return await clear_cart(user_id)

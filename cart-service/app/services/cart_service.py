"""
Cart Service - Business logic for managing shopping carts in Redis.

Cart structure in Redis (Hash per user):
  Key: "cart:{user_id}"
  Field: product_id
  Value: JSON string with product and quantity details
"""

import json
import httpx
from app.core.config import settings
from app.core.redis import get_redis


def _cart_key(user_id: str) -> str:
    return f"cart:{user_id}"


async def _fetch_product(product_id: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.PRODUCT_CATALOG_URL}/api/v1/products/{product_id}"
        )

    if response.status_code != 200:
        return {}

    return response.json()


async def _fetch_inventory(product_id: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.INVENTORY_SERVICE_URL}/api/v1/inventory/{product_id}"
        )

    if response.status_code != 200:
        return {}

    return response.json()


async def _validate_stock(product_id: str, quantity: int) -> str | None:
    inventory = await _fetch_inventory(product_id)
    if not inventory:
        return None

    available_stock = inventory.get("available_stock", 0)
    if available_stock < quantity:
        return f"Not enough stock. Only {available_stock} available."

    return None


async def get_cart(user_id: str) -> dict:
    """Get the full cart for a user."""
    redis_client = await get_redis()
    cart_key = _cart_key(user_id)
    raw_cart = await redis_client.hgetall(cart_key)

    items = []
    subtotal = 0.0
    item_count = 0

    for product_id, item_json in raw_cart.items():
        item = json.loads(item_json)
        item["product_id"] = product_id
        line_total = item["price"] * item["quantity"]
        item["line_total"] = round(line_total, 2)
        items.append(item)
        subtotal += line_total
        item_count += item["quantity"]

    return {
        "user_id": user_id,
        "items": items,
        "item_count": item_count,
        "subtotal": round(subtotal, 2),
        "total": round(subtotal, 2),
    }


async def add_item(user_id: str, product_id: str, quantity: int = 1) -> dict:
    """Add an item to the cart and validate the final quantity against stock."""
    product = await _fetch_product(product_id)
    if not product:
        return {"error": f"Product {product_id} not found in catalog."}

    redis_client = await get_redis()
    cart_key = _cart_key(user_id)
    existing = await redis_client.hget(cart_key, product_id)
    next_quantity = quantity

    if existing:
        next_quantity = json.loads(existing)["quantity"] + quantity

    stock_error = await _validate_stock(product_id, next_quantity)
    if stock_error:
        return {"error": stock_error}

    if existing:
        existing_item = json.loads(existing)
        existing_item["quantity"] = next_quantity
        await redis_client.hset(cart_key, product_id, json.dumps(existing_item))
    else:
        cart_item = {
            "quantity": quantity,
            "title": product.get("title", ""),
            "price": product.get("price", 0),
            "slashed_price": product.get("slashed_price"),
            "thumbnail": product.get("thumbnail", ""),
            "discount_percentage": product.get("discount_percentage", 0),
            "brand": product.get("brand", ""),
        }
        await redis_client.hset(cart_key, product_id, json.dumps(cart_item))

    await redis_client.expire(cart_key, 7 * 24 * 3600)
    return await get_cart(user_id)


async def update_item(user_id: str, product_id: str, quantity: int) -> dict:
    """Update the quantity of an item in the cart."""
    redis_client = await get_redis()
    cart_key = _cart_key(user_id)
    existing = await redis_client.hget(cart_key, product_id)

    if not existing:
        return {"error": f"Item {product_id} not found in cart."}

    if quantity <= 0:
        await redis_client.hdel(cart_key, product_id)
        return await get_cart(user_id)

    stock_error = await _validate_stock(product_id, quantity)
    if stock_error:
        return {"error": stock_error}

    item = json.loads(existing)
    item["quantity"] = quantity
    await redis_client.hset(cart_key, product_id, json.dumps(item))

    return await get_cart(user_id)


async def remove_item(user_id: str, product_id: str) -> dict:
    """Remove an item from the cart."""
    redis_client = await get_redis()
    await redis_client.hdel(_cart_key(user_id), product_id)
    return await get_cart(user_id)


async def clear_cart(user_id: str) -> dict:
    """Clear all items from the cart."""
    redis_client = await get_redis()
    await redis_client.delete(_cart_key(user_id))
    return {"message": "Cart cleared", "user_id": user_id}

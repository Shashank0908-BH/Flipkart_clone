from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.order import Order, OrderItem, Payment
from app.core.config import settings
from app.services.notifications import send_order_confirmation_email
import httpx
import logging
import uuid

router = APIRouter()
logger = logging.getLogger(__name__)


async def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Unauthorized")

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.AUTH_SERVICE_URL}/api/v1/users/me",
            headers={"Authorization": authorization},
        )

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid token")

    return response.json()


def serialize_order(order: Order) -> dict:
    return {
        "id": order.id,
        "status": order.status,
        "total_amount": order.total_amount,
        "created_at": order.created_at,
        "shipping_address": order.shipping_address,
        "items": [
            {
                "product_id": item.product_id,
                "title": item.title,
                "quantity": item.quantity,
                "price": item.price,
                "thumbnail": item.thumbnail,
            }
            for item in order.items
        ],
    }


async def fetch_cart(cart_user_id: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.CART_SERVICE_URL}/api/v1/cart/?user_id={cart_user_id}"
        )

    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch cart")

    return response.json()


async def validate_inventory(items: list[dict]):
    async with httpx.AsyncClient() as client:
        for item in items:
            response = await client.get(
                f"{settings.INVENTORY_SERVICE_URL}/api/v1/inventory/{item['product_id']}"
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=400,
                    detail=f"Inventory unavailable for {item['title']}",
                )

            inventory = response.json()
            if inventory.get("available_stock", 0) < item["quantity"]:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Only {inventory.get('available_stock', 0)} units left "
                        f"for {item['title']}"
                    ),
                )


def build_inventory_payload(items: list[dict]) -> dict:
    return {
        "items": [
            {"item_id": item["product_id"], "quantity": item["quantity"]}
            for item in items
        ]
    }


async def reserve_inventory(items: list[dict]):
    payload = build_inventory_payload(items)

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.INVENTORY_SERVICE_URL}/api/v1/inventory/reserve-batch",
            json=payload,
        )

    if response.status_code != 200:
        detail = response.json().get("detail", "Failed to reserve inventory")
        raise HTTPException(status_code=400, detail=detail)


async def release_inventory(items: list[dict]):
    payload = build_inventory_payload(items)

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.INVENTORY_SERVICE_URL}/api/v1/inventory/release-batch",
            json=payload,
        )

    if response.status_code != 200:
        detail = response.json().get("detail", "Failed to release inventory")
        raise RuntimeError(detail)


async def clear_cart_after_checkout(cart_user_id: str):
    async with httpx.AsyncClient() as client:
        response = await client.delete(
            f"{settings.CART_SERVICE_URL}/api/v1/cart/?user_id={cart_user_id}"
        )

    if response.status_code != 200:
        detail = response.json().get("detail", "Failed to clear cart")
        raise RuntimeError(detail)


async def compensate_inventory_reservation(items: list[dict]):
    try:
        await release_inventory(items)
    except Exception:
        logger.exception("Failed to release reserved inventory during checkout compensation")


@router.post("/checkout")
async def process_checkout(
    shipping_address: dict,
    payment_method: str = "UPI",
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cart_user_id = shipping_address.get("cart_user_id") or user.get(
        "cart_user_id",
        f"user-{user['id']}",
    )
    address_snapshot = {
        key: value
        for key, value in shipping_address.items()
        if key != "cart_user_id"
    }

    cart = await fetch_cart(cart_user_id)
    if not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")

    items = cart["items"]
    await validate_inventory(items)

    total_amount = cart["total"] + 7
    order_id = f"ord-{uuid.uuid4().hex[:8]}"
    inventory_reserved = False

    try:
        # The order database write stays atomic inside this service, and
        # inventory gets compensated if the local transaction fails.
        await reserve_inventory(items)
        inventory_reserved = True

        new_order = Order(
            id=order_id,
            user_id=str(user["id"]),
            status="CONFIRMED",
            total_amount=total_amount,
            shipping_address=address_snapshot,
        )
        db.add(new_order)
        db.flush()

        for item in items:
            db.add(
                OrderItem(
                    order_id=new_order.id,
                    product_id=item["product_id"],
                    title=item["title"],
                    quantity=item["quantity"],
                    price=item["price"],
                    thumbnail=item.get("thumbnail", ""),
                )
            )

        payment = Payment(
            id=f"pay-{uuid.uuid4().hex[:8]}",
            order_id=new_order.id,
            amount=total_amount,
            method=payment_method,
            status="SUCCESS",
            transaction_id=f"txn_{uuid.uuid4().hex[:12]}",
        )
        db.add(payment)
        db.commit()
        db.refresh(new_order)
    except HTTPException:
        db.rollback()
        if inventory_reserved:
            await compensate_inventory_reservation(items)
        raise
    except Exception as exc:
        db.rollback()
        if inventory_reserved:
            await compensate_inventory_reservation(items)
        logger.exception("Checkout failed before order confirmation")
        raise HTTPException(status_code=500, detail="Failed to place order") from exc

    cart_result = {"status": "cleared", "reason": None}
    try:
        await clear_cart_after_checkout(cart_user_id)
    except Exception as exc:
        logger.warning("Order %s committed but cart clear failed: %s", new_order.id, exc)
        cart_result = {"status": "failed", "reason": str(exc)}

    try:
        notification_result = await send_order_confirmation_email(
            user=user,
            order_id=new_order.id,
            total_amount=new_order.total_amount,
            payment_method=payment_method,
            shipping_address=address_snapshot,
            items=items,
        )
    except Exception as exc:
        notification_result = {
            "status": "failed",
            "reason": str(exc),
        }

    return {
        "message": "Order placed successfully",
        "order_id": new_order.id,
        "payment_status": payment.status,
        "total_amount": new_order.total_amount,
        "transaction_id": payment.transaction_id,
        "cart_status": cart_result.get("status"),
        "cart_reason": cart_result.get("reason"),
        "notification_status": notification_result.get("status"),
        "notification_recipient": notification_result.get("recipient"),
        "notification_reason": notification_result.get("reason"),
    }


@router.get("/")
async def get_orders(
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    orders = (
        db.query(Order)
        .filter(Order.user_id == str(user["id"]))
        .order_by(Order.created_at.desc())
        .all()
    )
    return [serialize_order(order) for order in orders]


@router.get("/{order_id}")
async def get_order(
    order_id: str,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.user_id == str(user["id"]))
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return serialize_order(order)

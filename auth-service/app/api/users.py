"""
User profile & wishlist endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User, WishlistItem, Address
from app.core.security import decode_access_token
from app.core.validation import validate_email_address, validate_phone_number

router = APIRouter()

DEFAULT_USER_EMAIL = "default@flipkart.local"


def get_cart_user_id(user: User) -> str:
    if user.email == DEFAULT_USER_EMAIL:
        return "user-default"
    return f"user-{user.id}"


def get_current_user(authorization: str = Header(...), db: Session = Depends(get_db)) -> User:
    """Extract user from JWT Bearer token."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/me")
def get_profile(user: User = Depends(get_current_user)):
    """Get the current user's profile."""
    return {
        "id": user.id,
        "phone": user.phone,
        "email": user.email,
        "name": user.name,
        "is_active": user.is_active,
        "cart_user_id": get_cart_user_id(user),
    }


@router.put("/me")
def update_profile(
    name: str = None,
    email: str = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update user profile info."""
    if name:
        user.name = name
    if email:
        user.email = validate_email_address(email)
    db.commit()
    db.refresh(user)
    return {"message": "Profile updated", "name": user.name, "email": user.email}


# ---- Wishlist ----

@router.get("/wishlist")
def get_wishlist(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all wishlist items for the current user."""
    items = db.query(WishlistItem).filter(WishlistItem.user_id == user.id).all()
    return [{"id": i.id, "product_id": i.product_id, "added_at": i.added_at} for i in items]


@router.post("/wishlist")
def add_to_wishlist(
    product_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a product to the wishlist."""
    existing = (
        db.query(WishlistItem)
        .filter(WishlistItem.user_id == user.id, WishlistItem.product_id == product_id)
        .first()
    )
    if existing:
        return {"message": "Already in wishlist"}

    item = WishlistItem(user_id=user.id, product_id=product_id)
    db.add(item)
    db.commit()
    return {"message": f"Added {product_id} to wishlist"}


@router.delete("/wishlist/{product_id}")
def remove_from_wishlist(
    product_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a product from the wishlist."""
    item = (
        db.query(WishlistItem)
        .filter(WishlistItem.user_id == user.id, WishlistItem.product_id == product_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not in wishlist")
    db.delete(item)
    db.commit()
    return {"message": f"Removed {product_id} from wishlist"}


# ---- Addresses ----

@router.get("/addresses")
def get_addresses(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all saved addresses for the current user."""
    addrs = db.query(Address).filter(Address.user_id == user.id).all()
    return [
        {
            "id": a.id,
            "full_name": a.full_name,
            "phone": a.phone,
            "address_line_1": a.address_line_1,
            "address_line_2": a.address_line_2,
            "city": a.city,
            "state": a.state,
            "pincode": a.pincode,
            "is_default": a.is_default,
        }
        for a in addrs
    ]


@router.post("/addresses")
def add_address(
    full_name: str,
    phone: str,
    address_line_1: str,
    city: str,
    state: str,
    pincode: str,
    address_line_2: str = "",
    is_default: bool = False,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a new shipping address."""
    addr = Address(
        user_id=user.id,
        full_name=full_name,
        phone=validate_phone_number(phone, "phone number"),
        address_line_1=address_line_1,
        address_line_2=address_line_2,
        city=city,
        state=state,
        pincode=pincode,
        is_default=is_default,
    )
    db.add(addr)
    db.commit()
    return {"message": "Address added", "address_id": addr.id}

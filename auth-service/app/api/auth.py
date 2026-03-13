"""
Auth API endpoints - OTP login flow.
Flipkart-style: Send OTP → Verify OTP → Get JWT token.
"""

import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User, OTP
from app.core.security import create_access_token
from app.core.validation import normalize_phone_or_email

router = APIRouter()

DEFAULT_USER_EMAIL = "default@flipkart.local"
DEFAULT_USER_NAME = "Flipkart Shopper"


def get_cart_user_id(user: User) -> str:
    if user.email == DEFAULT_USER_EMAIL:
        return "user-default"
    return f"user-{user.id}"


def serialize_session(user: User) -> dict:
    token = create_access_token(
        {
            "sub": str(user.id),
            "phone": user.phone,
            "email": user.email,
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "phone": user.phone,
            "email": user.email,
            "name": user.name,
            "cart_user_id": get_cart_user_id(user),
        },
    }


@router.post("/send-otp")
def send_otp(phone_or_email: str, db: Session = Depends(get_db)):
    """
    Send an OTP to the given phone number or email.
    In production, this would integrate with an SMS/Email gateway.
    For this clone, we generate and store the OTP and return it in the response.
    """
    normalized_phone_or_email = normalize_phone_or_email(phone_or_email)
    otp_code = str(random.randint(100000, 999999))

    otp_record = OTP(
        phone_or_email=normalized_phone_or_email,
        otp_code=otp_code,
    )
    db.add(otp_record)
    db.commit()

    return {
        "message": f"OTP sent to {normalized_phone_or_email}",
        "otp": otp_code,  # In production, NEVER return this. Using for dev/testing.
    }


@router.post("/verify-otp")
def verify_otp(phone_or_email: str, otp_code: str, db: Session = Depends(get_db)):
    """
    Verify OTP and return a JWT token.
    Creates the user if they don't exist (auto-signup on first login like Flipkart).
    """
    normalized_phone_or_email = normalize_phone_or_email(phone_or_email)
    otp_record = (
        db.query(OTP)
        .filter(
            OTP.phone_or_email == normalized_phone_or_email,
            OTP.otp_code == otp_code,
            OTP.is_used == False,
        )
        .order_by(OTP.created_at.desc())
        .first()
    )

    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP.")

    # Mark OTP as used
    otp_record.is_used = True
    db.commit()

    # Find or create user
    is_email = "@" in normalized_phone_or_email
    if is_email:
        user = db.query(User).filter(User.email == normalized_phone_or_email).first()
        if not user:
            user = User(email=normalized_phone_or_email)
            db.add(user)
            db.commit()
            db.refresh(user)
    else:
        user = db.query(User).filter(User.phone == normalized_phone_or_email).first()
        if not user:
            user = User(phone=normalized_phone_or_email)
            db.add(user)
            db.commit()
            db.refresh(user)

    return serialize_session(user)


@router.post("/default-session")
def create_default_session(db: Session = Depends(get_db)):
    """
    Creates a stable default shopper session so checkout works without
    requiring manual authentication during the assignment flow.
    """
    user = db.query(User).filter(User.email == DEFAULT_USER_EMAIL).first()

    if not user:
        user = User(
            email=DEFAULT_USER_EMAIL,
            name=DEFAULT_USER_NAME,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return serialize_session(user)

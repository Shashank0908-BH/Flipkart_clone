import re

from fastapi import HTTPException

PHONE_NUMBER_REGEX = re.compile(r"^\d{10}$")
EMAIL_FORMAT_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$", re.IGNORECASE)


def validate_phone_number(value: str, field_name: str = "mobile number") -> str:
    normalized = re.sub(r"\D", "", (value or "").strip())
    if not PHONE_NUMBER_REGEX.fullmatch(normalized):
        raise HTTPException(status_code=400, detail=f"Enter a valid 10-digit {field_name}.")

    return normalized


def validate_email_address(value: str, field_name: str = "email address") -> str:
    normalized = (value or "").strip().lower()
    if not EMAIL_FORMAT_REGEX.fullmatch(normalized):
        raise HTTPException(status_code=400, detail=f"Enter a valid {field_name}.")

    return normalized


def normalize_phone_or_email(value: str) -> str:
    candidate = (value or "").strip()
    if not candidate:
        raise HTTPException(
            status_code=400,
            detail="Enter a 10-digit mobile number or a valid email address.",
        )

    if "@" in candidate:
        return validate_email_address(candidate)

    return validate_phone_number(candidate)

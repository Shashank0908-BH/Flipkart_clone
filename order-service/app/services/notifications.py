from __future__ import annotations

import asyncio
import smtplib
import ssl
from email.message import EmailMessage
from typing import Any

import httpx

from app.core.config import settings

DEFAULT_GUEST_EMAIL = "default@flipkart.local"


def _format_currency(amount: float) -> str:
    return f"Rs {amount:.2f}"


def _resolve_recipient_email(user: dict[str, Any]) -> str | None:
    user_email = str(user.get("email") or "").strip()
    if user_email and user_email.lower() != DEFAULT_GUEST_EMAIL:
        return user_email

    fallback_email = str(settings.ORDER_NOTIFICATION_TO_EMAIL or "").strip()
    return fallback_email or None


def _build_subject(order_id: str) -> str:
    return f"Flipkart Clone order confirmed - {order_id}"


def _build_line_items(items: list[dict[str, Any]]) -> list[str]:
    return [
        f"- {item['title']} x {item['quantity']} ({_format_currency(float(item['price']))})"
        for item in items
    ]


def _build_text_body(
    order_id: str,
    total_amount: float,
    payment_method: str,
    shipping_address: dict[str, Any],
    items: list[dict[str, Any]],
    customer_name: str,
) -> str:
    address_lines = [
        shipping_address.get("full_name") or customer_name,
        shipping_address.get("address_line_1"),
        shipping_address.get("address_line_2"),
        " ".join(
            part
            for part in [
                shipping_address.get("locality"),
                shipping_address.get("city"),
                shipping_address.get("state"),
                shipping_address.get("pincode"),
            ]
            if part
        ),
        shipping_address.get("phone"),
    ]

    cleaned_address = [line for line in address_lines if line]
    cart_lines = "\n".join(_build_line_items(items))

    return (
        f"Hi {customer_name},\n\n"
        f"Your Flipkart Clone order has been confirmed.\n\n"
        f"Order ID: {order_id}\n"
        f"Payment method: {payment_method}\n"
        f"Total paid: {_format_currency(total_amount)}\n\n"
        "Items:\n"
        f"{cart_lines}\n\n"
        "Delivery address:\n"
        f"{chr(10).join(cleaned_address)}\n\n"
        "Thank you for shopping with us."
    )


def _build_html_body(
    order_id: str,
    total_amount: float,
    payment_method: str,
    shipping_address: dict[str, Any],
    items: list[dict[str, Any]],
    customer_name: str,
) -> str:
    address_lines = [
        shipping_address.get("full_name") or customer_name,
        shipping_address.get("address_line_1"),
        shipping_address.get("address_line_2"),
        ", ".join(
            part
            for part in [
                shipping_address.get("locality"),
                shipping_address.get("city"),
                shipping_address.get("state"),
                shipping_address.get("pincode"),
            ]
            if part
        ),
        shipping_address.get("phone"),
    ]
    cleaned_address = [line for line in address_lines if line]
    items_markup = "".join(
        (
            "<li>"
            f"{item['title']} x {item['quantity']} - "
            f"{_format_currency(float(item['price']))}"
            "</li>"
        )
        for item in items
    )
    address_markup = "".join(f"<div>{line}</div>" for line in cleaned_address)

    return (
        "<div style=\"font-family: Arial, sans-serif; color: #172337; line-height: 1.6;\">"
        f"<h2 style=\"margin-bottom: 12px;\">Hi {customer_name}, your order is confirmed.</h2>"
        f"<p><strong>Order ID:</strong> {order_id}<br />"
        f"<strong>Payment method:</strong> {payment_method}<br />"
        f"<strong>Total paid:</strong> {_format_currency(total_amount)}</p>"
        "<h3 style=\"margin-bottom: 8px;\">Items</h3>"
        f"<ul>{items_markup}</ul>"
        "<h3 style=\"margin-bottom: 8px;\">Delivery address</h3>"
        f"{address_markup}"
        "<p style=\"margin-top: 20px;\">Thank you for shopping with Flipkart Clone.</p>"
        "</div>"
    )


async def _send_via_resend(
    recipient: str,
    subject: str,
    text_body: str,
    html_body: str,
) -> dict[str, Any]:
    headers = {
        "Authorization": f"Bearer {settings.RESEND_API_KEY}",
        "Content-Type": "application/json",
    }
    payload: dict[str, Any] = {
        "from": settings.ORDER_EMAIL_FROM,
        "to": [recipient],
        "subject": subject,
        "text": text_body,
        "html": html_body,
    }

    if settings.ORDER_EMAIL_REPLY_TO:
        payload["reply_to"] = settings.ORDER_EMAIL_REPLY_TO

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            "https://api.resend.com/emails",
            headers=headers,
            json=payload,
        )

    if response.status_code >= 400:
        detail = response.text
        try:
            data = response.json()
            if isinstance(data, dict) and "message" in data:
                detail = str(data["message"])
        except ValueError:
            pass

        return {
            "status": "failed",
            "provider": "resend",
            "recipient": recipient,
            "reason": detail,
        }

    data = response.json()
    return {
        "status": "sent",
        "provider": "resend",
        "recipient": recipient,
        "message_id": data.get("id"),
    }


def _send_via_smtp(
    recipient: str,
    subject: str,
    text_body: str,
    html_body: str,
) -> dict[str, Any]:
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.ORDER_EMAIL_FROM or ""
    message["To"] = recipient
    if settings.ORDER_EMAIL_REPLY_TO:
        message["Reply-To"] = settings.ORDER_EMAIL_REPLY_TO
    message.set_content(text_body)
    message.add_alternative(html_body, subtype="html")

    if settings.SMTP_USE_TLS:
        context = ssl.create_default_context()
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.starttls(context=context)
            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(message)
    else:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(message)

    return {
        "status": "sent",
        "provider": "smtp",
        "recipient": recipient,
    }


async def send_order_confirmation_email(
    user: dict[str, Any],
    order_id: str,
    total_amount: float,
    payment_method: str,
    shipping_address: dict[str, Any],
    items: list[dict[str, Any]],
) -> dict[str, Any]:
    recipient = _resolve_recipient_email(user)
    if not recipient:
        return {
            "status": "skipped",
            "reason": "No recipient email available for this order",
        }

    if not settings.ORDER_EMAIL_FROM:
        return {
            "status": "skipped",
            "recipient": recipient,
            "reason": "ORDER_EMAIL_FROM is not configured",
        }

    customer_name = (
        str(user.get("name") or "").strip()
        or str(shipping_address.get("full_name") or "").strip()
        or "shopper"
    )
    subject = _build_subject(order_id)
    text_body = _build_text_body(
        order_id=order_id,
        total_amount=total_amount,
        payment_method=payment_method,
        shipping_address=shipping_address,
        items=items,
        customer_name=customer_name,
    )
    html_body = _build_html_body(
        order_id=order_id,
        total_amount=total_amount,
        payment_method=payment_method,
        shipping_address=shipping_address,
        items=items,
        customer_name=customer_name,
    )

    provider = (settings.EMAIL_PROVIDER or "auto").strip().lower()
    try:
        if provider in {"auto", "resend"} and settings.RESEND_API_KEY:
            return await _send_via_resend(recipient, subject, text_body, html_body)

        if provider in {"auto", "smtp"} and settings.SMTP_HOST:
            return await asyncio.to_thread(
                _send_via_smtp,
                recipient,
                subject,
                text_body,
                html_body,
            )
    except Exception as exc:
        provider_name = "resend" if settings.RESEND_API_KEY else "smtp"
        return {
            "status": "failed",
            "provider": provider_name,
            "recipient": recipient,
            "reason": str(exc),
        }

    if provider == "resend":
        return {
            "status": "skipped",
            "recipient": recipient,
            "reason": "RESEND_API_KEY is not configured",
        }

    if provider == "smtp":
        return {
            "status": "skipped",
            "recipient": recipient,
            "reason": "SMTP_HOST is not configured",
        }

    return {
        "status": "skipped",
        "recipient": recipient,
        "reason": "No email provider is configured",
    }

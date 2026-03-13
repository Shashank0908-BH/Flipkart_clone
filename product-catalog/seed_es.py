"""
Seed products into Elasticsearch with Flipkart-style merchandising data.

Usage:
  source venv/bin/activate && python seed_es.py
"""

import asyncio
import os
import json
from urllib.parse import quote
import httpx
from seed_custom import CUSTOM_PRODUCTS

ES_URL = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")
INDEX_NAME = "products"
DUMMYJSON_BASE = "https://dummyjson.com"

CATEGORY_MULTIPLIERS = {
    "beauty": 68,
    "fragrances": 78,
    "furniture": 82,
    "groceries": 46,
    "home-decoration": 74,
    "kitchen-accessories": 72,
    "laptops": 88,
    "mens-shirts": 76,
    "mens-shoes": 84,
    "mens-watches": 95,
    "mobile-accessories": 65,
    "motorcycle": 90,
    "skin-care": 64,
    "smartphones": 92,
    "sports-accessories": 70,
    "sunglasses": 69,
    "tablets": 86,
    "tops": 72,
    "vehicle": 93,
    "womens-bags": 78,
    "womens-dresses": 76,
    "womens-jewellery": 80,
    "womens-shoes": 82,
    "womens-watches": 92,
}

CATEGORY_FLOORS = {
    "groceries": 149,
    "beauty": 249,
    "fragrances": 399,
    "skin-care": 299,
    "mobile-accessories": 199,
    "mens-shirts": 699,
    "tops": 649,
    "womens-dresses": 899,
    "womens-bags": 999,
    "mens-shoes": 1199,
    "womens-shoes": 1099,
    "mens-watches": 1299,
    "womens-watches": 1299,
    "sunglasses": 499,
    "kitchen-accessories": 399,
    "home-decoration": 699,
    "furniture": 2499,
    "smartphones": 7999,
    "tablets": 10999,
    "laptops": 32999,
    "sports-accessories": 499,
    "motorcycle": 79999,
    "vehicle": 399999,
}

SUPPORTED_CATEGORIES = set(CATEGORY_MULTIPLIERS)


def round_price(value: float) -> int:
    if value < 500:
        step, suffix = 10, 9
    elif value < 5000:
        step, suffix = 50, 49
    else:
        step, suffix = 100, 99

    rounded = int(value / step) * step + suffix
    if rounded < value:
        rounded += step
    return rounded


def normalize_price(product: dict) -> int:
    category = product["category"]
    converted = product["price"] * CATEGORY_MULTIPLIERS[category]
    logical_floor = CATEGORY_FLOORS.get(category, 499)
    return max(logical_floor, round_price(converted))


def assign_badges(product: dict) -> list[str]:
    badges = []
    if product.get("rating", 0) >= 4.5:
        badges.append("Top Rated")
    if product.get("discountPercentage", 0) >= 18:
        badges.append("Hot Deal")
    if product.get("stock", 0) <= 5:
        badges.append("Grab or Gone")
    if product.get("brand"):
        badges.append("Flipkart Assured")
    if not badges:
        badges.append("Best Seller")
    return badges


def make_slide(
    product: dict,
    title: str,
    subtitle: str,
    accent: str,
    chip: str,
) -> str:
    svg = f"""
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800'>
      <defs>
        <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='{accent}' />
          <stop offset='100%' stop-color='#0f172a' />
        </linearGradient>
      </defs>
      <rect width='800' height='800' rx='48' fill='url(#bg)' />
      <rect x='48' y='48' width='240' height='70' rx='24' fill='#ffffff22' />
      <text x='88' y='94' font-family='Arial, sans-serif' font-size='34' fill='white' font-weight='700'>{chip}</text>
      <text x='64' y='190' font-family='Arial, sans-serif' font-size='36' fill='#e2e8f0'>{product.get('brand') or 'Flipkart Pick'}</text>
      <text x='64' y='270' font-family='Arial, sans-serif' font-size='56' fill='white' font-weight='700'>{title}</text>
      <text x='64' y='336' font-family='Arial, sans-serif' font-size='34' fill='#e2e8f0'>{subtitle}</text>
      <text x='64' y='430' font-family='Arial, sans-serif' font-size='40' fill='#bbf7d0' font-weight='700'>₹{product['price']}</text>
      <text x='170' y='430' font-family='Arial, sans-serif' font-size='28' fill='#e2e8f0'>MRP ₹{product['slashed_price']}</text>
      <text x='64' y='510' font-family='Arial, sans-serif' font-size='28' fill='#fef08a'>Flipkart-style product carousel frame</text>
      <circle cx='610' cy='252' r='124' fill='#ffffff18' />
      <circle cx='690' cy='160' r='88' fill='#ffffff12' />
      <rect x='64' y='594' width='672' height='116' rx='30' fill='#ffffff12' />
      <text x='92' y='652' font-family='Arial, sans-serif' font-size='34' fill='white'>{product['title'][:32]}</text>
      <text x='92' y='690' font-family='Arial, sans-serif' font-size='24' fill='#e2e8f0'>{product.get('availability_status', 'In Stock')}</text>
    </svg>
    """
    return f"data:image/svg+xml;charset=UTF-8,{quote(svg)}"


def ensure_image_carousel(product: dict) -> list[str]:
    images = list(dict.fromkeys(product.get("images", [])))
    if product.get("thumbnail"):
        images = [product["thumbnail"], *[img for img in images if img != product["thumbnail"]]]

    slides = [
        make_slide(
            product,
            "Flipkart Value Pick",
            f"Save {round(product['discount_percentage'])}% on this deal",
            "#1d4ed8",
            "WOW DEAL",
        ),
        make_slide(
            product,
            "Grab this offer",
            product.get("shipping_info", "Fast delivery available"),
            "#dc2626",
            "LIMITED STOCK",
        ),
    ]

    for slide in slides:
        if len(images) >= 4:
            break
        images.append(slide)

    if len(images) < 4:
        images.extend([images[-1]] * (4 - len(images)))

    return images[:4]


def transform_product(product: dict) -> dict:
    price = normalize_price(product)
    discount = max(float(product.get("discountPercentage", 0)), 8.0)
    slashed_price = round_price(price / (1 - min(discount, 75.0) / 100))

    transformed = {
        "id": f"prod-{product['id']}",
        "title": product["title"],
        "short_description": (
            product["description"][:88]
            if len(product["description"]) > 88
            else product["description"]
        ),
        "description": product["description"],
        "category": product["category"],
        "subcategory": product["category"],
        "price": price,
        "slashed_price": slashed_price,
        "discount_percentage": round(((slashed_price - price) / slashed_price) * 100, 2),
        "images": product.get("images", []),
        "thumbnail": product.get("thumbnail", ""),
        "tags": product.get("tags", []),
        "badges": assign_badges(product),
        "customer_rating": product.get("rating", 0),
        "review_count": len(product.get("reviews", [])),
        "brand": product.get("brand", ""),
        "sku": product.get("sku", ""),
        "stock": product.get("stock", 12),
        "availability_status": product.get("availabilityStatus", "In Stock"),
        "return_policy": product.get("returnPolicy", "7 Days Replacement Policy"),
        "shipping_info": product.get("shippingInformation", "Free delivery by tomorrow"),
        "warranty_info": product.get("warrantyInformation", "1 Year Manufacturer Warranty"),
        "metadata": {
            "weight": product.get("weight"),
            "dimensions": product.get("dimensions"),
            "barcode": product.get("meta", {}).get("barcode", ""),
            "seller": "RetailNet",
        },
    }
    transformed["images"] = ensure_image_carousel(transformed)
    transformed["thumbnail"] = transformed["images"][0]
    return transformed


def transform_custom_product(product: dict) -> dict:
    custom_product = {**product}
    custom_product["images"] = ensure_image_carousel(custom_product)
    custom_product["thumbnail"] = custom_product["images"][0]
    return custom_product


async def fetch_all_products() -> list:
    all_products = []
    skip = 0
    limit = 30

    async with httpx.AsyncClient(timeout=30.0) as client:
        while True:
            response = await client.get(
                f"{DUMMYJSON_BASE}/products",
                params={"limit": limit, "skip": skip},
            )
            response.raise_for_status()
            data = response.json()
            products = [
                product
                for product in data.get("products", [])
                if product.get("category") in SUPPORTED_CATEGORIES
            ]
            if not products:
                break

            all_products.extend(products)
            skip += limit
            if skip >= data.get("total", 0):
                break

    return all_products


async def seed_data():
    raw_products = await fetch_all_products()
    transformed = [transform_product(product) for product in raw_products]
    transformed.extend(transform_custom_product(product) for product in CUSTOM_PRODUCTS)

    mapping = {
        "mappings": {
            "properties": {
                "id": {"type": "keyword"},
                "title": {"type": "text", "analyzer": "english"},
                "short_description": {"type": "text"},
                "description": {"type": "text", "analyzer": "english"},
                "category": {"type": "keyword"},
                "subcategory": {"type": "keyword"},
                "price": {"type": "float"},
                "slashed_price": {"type": "float"},
                "discount_percentage": {"type": "float"},
                "images": {"type": "keyword"},
                "thumbnail": {"type": "keyword"},
                "tags": {"type": "keyword"},
                "badges": {"type": "keyword"},
                "customer_rating": {"type": "float"},
                "review_count": {"type": "integer"},
                "brand": {"type": "keyword"},
                "sku": {"type": "keyword"},
                "stock": {"type": "integer"},
                "availability_status": {"type": "keyword"},
                "return_policy": {"type": "text"},
                "shipping_info": {"type": "text"},
                "warranty_info": {"type": "text"},
                "metadata": {"type": "object"},
            }
        }
    }

    async with httpx.AsyncClient(base_url=ES_URL, timeout=30.0) as client:
        index_response = await client.head(f"/{INDEX_NAME}")
        if index_response.status_code != 404:
            await client.delete(f"/{INDEX_NAME}")

        create_response = await client.put(f"/{INDEX_NAME}", json=mapping)
        create_response.raise_for_status()

        bulk_lines = []
        for product in transformed:
            bulk_lines.append(
                json.dumps({"index": {"_index": INDEX_NAME, "_id": product["id"]}})
            )
            bulk_lines.append(json.dumps(product))

        bulk_payload = "\n".join(bulk_lines) + "\n"
        bulk_response = await client.post(
            "/_bulk",
            content=bulk_payload,
            headers={"Content-Type": "application/x-ndjson"},
        )
        bulk_response.raise_for_status()
        result = bulk_response.json()

    failed = [item for item in result.get("items", []) if item["index"].get("error")]
    print(f"Successfully seeded {len(transformed) - len(failed)} products.")
    if failed:
        print(f"Failed: {len(failed)}")


if __name__ == "__main__":
    asyncio.run(seed_data())

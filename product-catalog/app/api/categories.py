from fastapi import APIRouter, HTTPException
from typing import Any

router = APIRouter()

CATEGORIES: list[dict[str, Any]] = [
    {
        "slug": "groceries",
        "name": "Grocery & Essentials",
        "description": "Daily staples, instant food, beverages and home needs.",
        "group": "Grocery",
    },
    {
        "slug": "smartphones",
        "name": "Mobiles",
        "description": "Popular smartphones and premium handsets.",
        "group": "Electronics",
    },
    {
        "slug": "laptops",
        "name": "Laptops",
        "description": "Thin-and-light, creator and performance laptops.",
        "group": "Electronics",
    },
    {
        "slug": "tablets",
        "name": "Tablets",
        "description": "Tablets and e-readers for work and entertainment.",
        "group": "Electronics",
    },
    {
        "slug": "mobile-accessories",
        "name": "Mobile Accessories",
        "description": "Chargers, cases, audio gear and travel accessories.",
        "group": "Electronics",
    },
    {
        "slug": "mens-shirts",
        "name": "Men's Shirts",
        "description": "Casual and occasion wear shirts for men.",
        "group": "Fashion",
    },
    {
        "slug": "mens-shoes",
        "name": "Men's Shoes",
        "description": "Sneakers, slip-ons and formal footwear.",
        "group": "Fashion",
    },
    {
        "slug": "mens-watches",
        "name": "Men's Watches",
        "description": "Analog, digital and smart-inspired styles.",
        "group": "Fashion",
    },
    {
        "slug": "tops",
        "name": "Women's Tops",
        "description": "Everyday tops, fitted knits and contemporary silhouettes.",
        "group": "Fashion",
    },
    {
        "slug": "womens-dresses",
        "name": "Women's Dresses",
        "description": "Statement dresses for festive and daily wear.",
        "group": "Fashion",
    },
    {
        "slug": "womens-bags",
        "name": "Women's Bags",
        "description": "Totes, slings, office bags and fashion handbags.",
        "group": "Fashion",
    },
    {
        "slug": "womens-shoes",
        "name": "Women's Shoes",
        "description": "Comfort-first sandals, heels and flats.",
        "group": "Fashion",
    },
    {
        "slug": "womens-watches",
        "name": "Women's Watches",
        "description": "Minimal and fashion-forward timepieces.",
        "group": "Fashion",
    },
    {
        "slug": "womens-jewellery",
        "name": "Jewellery",
        "description": "Lightweight accessories and gifting picks.",
        "group": "Fashion",
    },
    {
        "slug": "sunglasses",
        "name": "Sunglasses",
        "description": "Lifestyle and travel-ready eye wear.",
        "group": "Fashion",
    },
    {
        "slug": "beauty",
        "name": "Beauty",
        "description": "Makeup, beauty kits and personal care favorites.",
        "group": "Beauty & Health",
    },
    {
        "slug": "fragrances",
        "name": "Fragrances",
        "description": "Perfumes and body mists across price points.",
        "group": "Beauty & Health",
    },
    {
        "slug": "skin-care",
        "name": "Skin Care",
        "description": "Serums, moisturizers and treatment essentials.",
        "group": "Beauty & Health",
    },
    {
        "slug": "home-decoration",
        "name": "Home Decor",
        "description": "Soft furnishings, decor and utility upgrades.",
        "group": "Home & Furniture",
    },
    {
        "slug": "kitchen-accessories",
        "name": "Kitchen & Cookware",
        "description": "Cookware, appliances and prep tools.",
        "group": "Home & Furniture",
    },
    {
        "slug": "furniture",
        "name": "Furniture",
        "description": "Beds, storage, seating and home utility furniture.",
        "group": "Home & Furniture",
    },
    {
        "slug": "sports-accessories",
        "name": "Sports Accessories",
        "description": "Fitness, outdoors and active lifestyle gear.",
        "group": "Sports",
    },
    {
        "slug": "motorcycle",
        "name": "Motorcycle",
        "description": "Riding products and automotive utility picks.",
        "group": "Automotive",
    },
    {
        "slug": "vehicle",
        "name": "Auto Accessories",
        "description": "Vehicle care and commute essentials.",
        "group": "Automotive",
    },
]

CATEGORY_GROUPS: dict[str, list[str]] = {}
for category in CATEGORIES:
    CATEGORY_GROUPS.setdefault(category["group"], []).append(category["slug"])


@router.get("/")
async def get_categories():
    return CATEGORIES


@router.get("/grouped")
async def get_grouped_categories():
    category_map = {category["slug"]: category for category in CATEGORIES}
    return {
        group_name: [category_map[slug] for slug in slugs]
        for group_name, slugs in CATEGORY_GROUPS.items()
    }


@router.get("/{category_slug}")
async def get_category(category_slug: str):
    for category in CATEGORIES:
        if category["slug"] == category_slug:
            return category

    raise HTTPException(status_code=404, detail="Category not found")

import asyncio
import json
import os
import httpx

CUSTOM_PRODUCTS = [
    {
        "id": "prod-custom-1",
        "title": "BAJAJ New Shakti 3HD HA Handi With IB 3 L Inner Lid Induction Bottom Pressure Cooker",
        "short_description": "3 L capacity, hard anodized handi cooker",
        "description": (
            "Designed for a delightful cooking experience with induction compatibility, "
            "sturdy bakelite handles and durable hard anodized construction."
        ),
        "category": "kitchen-accessories",
        "subcategory": "pressure-cookers",
        "price": 1359,
        "slashed_price": 2474,
        "discount_percentage": 45.0,
        "images": [
            "https://rukminim2.flixcart.com/image/832/832/xif0q/pressure-cooker/w/6/n/-original-imagpnhy5bzzngk3.jpeg?q=70&crop=false",
            "https://rukminim2.flixcart.com/image/832/832/xif0q/pressure-cooker/u/z/q/-original-imagpnhyyf9s82x4.jpeg?q=70&crop=false",
            "https://rukminim2.flixcart.com/image/832/832/xif0q/pressure-cooker/c/x/k/-original-imagpnhyzjhzr249.jpeg?q=70&crop=false",
            "https://rukminim2.flixcart.com/image/832/832/xif0q/pressure-cooker/z/v/g/-original-imagpnhyyy6mhdng.jpeg?q=70&crop=false",
        ],
        "thumbnail": "https://rukminim2.flixcart.com/image/832/832/xif0q/pressure-cooker/w/6/n/-original-imagpnhy5bzzngk3.jpeg?q=70&crop=false",
        "tags": ["pressure cooker", "bajaj", "induction", "cookware"],
        "badges": ["Bestseller", "Flipkart Assured", "Grab or Gone"],
        "customer_rating": 4.3,
        "review_count": 89069,
        "brand": "BAJAJ",
        "sku": "BAJAJ-SHAKTI-3L",
        "stock": 4,
        "availability_status": "Limited Stock",
        "return_policy": "7 Days Replacement Policy",
        "shipping_info": "Free delivery in 2 days",
        "warranty_info": "5 Years Warranty",
        "metadata": {
            "capacity": "3 L",
            "material": "Hard Anodized",
            "seller": "RetailNet",
        },
    },
    {
        "id": "prod-custom-2",
        "title": "Pigeon Special Combi 2 L, 3 L, 5 L Outer Lid Pressure Cooker Combo",
        "short_description": "Combo pressure cooker set in durable aluminium",
        "description": (
            "A versatile outer lid pressure cooker combo designed for daily family cooking "
            "with multiple capacities and induction-friendly utility."
        ),
        "category": "kitchen-accessories",
        "subcategory": "pressure-cookers",
        "price": 1499,
        "slashed_price": 3195,
        "discount_percentage": 53.0,
        "images": [
            "https://rukminim2.flixcart.com/image/832/832/xif0q/pressure-cooker/3/e/o/-original-imahfawzbqqtgb2n.jpeg?q=70&crop=false",
            "https://rukminim2.flixcart.com/image/832/832/xif0q/pressure-cooker/b/w/i/-original-imahfawzx4fgdxtq.jpeg?q=70&crop=false",
            "https://rukminim2.flixcart.com/image/832/832/xif0q/pressure-cooker/z/k/c/-original-imahfawzpzvzyyhz.jpeg?q=70&crop=false",
        ],
        "thumbnail": "https://rukminim2.flixcart.com/image/832/832/xif0q/pressure-cooker/3/e/o/-original-imahfawzbqqtgb2n.jpeg?q=70&crop=false",
        "tags": ["pigeon", "pressure cooker", "kitchen"],
        "badges": ["Flipkart Assured", "Hot Deal"],
        "customer_rating": 4.2,
        "review_count": 12500,
        "brand": "Pigeon",
        "sku": "PIGEON-COMBI-SET",
        "stock": 9,
        "availability_status": "In Stock",
        "return_policy": "7 Days Replacement Policy",
        "shipping_info": "Free delivery by tomorrow",
        "warranty_info": "1 Year Warranty",
        "metadata": {
            "capacity": "2 L, 3 L, 5 L",
            "material": "Aluminium",
            "seller": "RetailNet",
        },
    },
]


async def seed_custom_products():
    async with httpx.AsyncClient(
        base_url=os.getenv("ELASTICSEARCH_URL", "http://localhost:9200"),
        timeout=30.0,
    ) as client:
        bulk_lines = []
        for product in CUSTOM_PRODUCTS:
            bulk_lines.append(
                '{"index":{"_index":"products","_id":"%s"}}' % product["id"]
            )
            bulk_lines.append(json.dumps(product))
            print(f"Indexed {product['title']}")

        response = await client.post(
            "/_bulk",
            content="\n".join(bulk_lines) + "\n",
            headers={"Content-Type": "application/x-ndjson"},
        )
        response.raise_for_status()


if __name__ == "__main__":
    asyncio.run(seed_custom_products())

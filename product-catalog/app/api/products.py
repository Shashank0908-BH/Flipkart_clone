from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any, Optional
from app.services.search_service import SearchService

router = APIRouter()
search_service = SearchService()

@router.get("/search", response_model=List[Dict[str, Any]])
async def search_products(
    q: Optional[str] = Query(None, description="Search query string"),
    category: Optional[str] = Query(None, description="Filter by Category"),
    min_price: Optional[float] = Query(None, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, description="Maximum price filter"),
    min_rating: Optional[float] = Query(None, description="Minimum customer rating override"),
    limit: int = Query(120, ge=1, le=240, description="Maximum products to return"),
):
    """
    Search and filter products using Elasticsearch.
    """
    try:
        results = await search_service.search_products(
            query=q,
            category=category,
            min_price=min_price,
            max_price=max_price,
            min_rating=min_rating,
            limit=limit,
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{product_id}", response_model=Dict[str, Any])
async def get_product(product_id: str):
    """
    Get a specific product by ID directly from Elasticsearch.
    """
    try:
        product = await search_service.get_product(product_id)
        if product:
            return product
        raise HTTPException(status_code=404, detail="Product not found")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=404, detail="Product not found")

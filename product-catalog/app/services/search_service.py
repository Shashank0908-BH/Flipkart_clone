import httpx
from app.core.es import es_client

class SearchService:
    def __init__(self):
        self.index_name = "products"

    @property
    def client(self) -> httpx.AsyncClient:
        return es_client.get_client()

    async def create_index(self):
        # A basic product mapping with some nested structures for detailed product data
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
                    "images": {"type": "keyword"}, # Array of URLs
                    "tags": {"type": "keyword"},
                    "badges": {"type": "keyword"}, # e.g. "Flipkart Assured", "Hot Deal"
                    "customer_rating": {"type": "float"},
                    "review_count": {"type": "integer"},
                    "metadata": {"type": "object"} # Custom key-value pairs
                }
            }
        }
        response = await self.client.head(f"/{self.index_name}")
        if response.status_code == 404:
            await self.client.put(f"/{self.index_name}", json=mapping)

    async def search_products(
        self,
        query: str,
        category: str = None,
        min_price: float = None,
        max_price: float = None,
        min_rating: float = None,
        limit: int = 120,
    ):
        must_clauses = [{"multi_match": {"query": query, "fields": ["title^3", "short_description^2", "description", "category"]}}] if query else [{"match_all": {}}]
        filter_clauses = []
        
        if category:
            filter_clauses.append({"term": {"category": category}})
        
        if min_price is not None or max_price is not None:
            price_range = {}
            if min_price is not None:
                price_range["gte"] = min_price
            if max_price is not None:
                price_range["lte"] = max_price
            filter_clauses.append({"range": {"price": price_range}})
            
        if min_rating:
            filter_clauses.append({"range": {"customer_rating": {"gte": min_rating}}})

        search_body = {
            "size": limit,
            "query": {
                "bool": {
                    "must": must_clauses,
                    "filter": filter_clauses
                }
            }
        }

        response = await self.client.post(
            f"/{self.index_name}/_search",
            json=search_body,
        )
        response.raise_for_status()
        payload = response.json()
        return [hit["_source"] for hit in payload.get("hits", {}).get("hits", [])]

    async def get_product(self, product_id: str):
        response = await self.client.get(f"/{self.index_name}/_doc/{product_id}")
        if response.status_code == 404:
            return None

        response.raise_for_status()
        payload = response.json()
        if not payload.get("found"):
            return None
        return payload.get("_source")

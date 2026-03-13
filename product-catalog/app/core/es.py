import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

class ElasticSearchClient:
    def __init__(self):
        self.client = None

    async def connect(self):
        if not self.client:
            self.client = httpx.AsyncClient(
                base_url=settings.ELASTICSEARCH_URL,
                timeout=10.0,
            )

    async def disconnect(self):
        if self.client:
            await self.client.aclose()
            logger.info("Disconnected from Elasticsearch.")

    def get_client(self) -> httpx.AsyncClient:
        return self.client

es_client = ElasticSearchClient()

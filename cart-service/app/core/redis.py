import asyncio
import redis.asyncio as aioredis
from app.core.config import settings

redis_client: aioredis.Redis | None = None
memory_store: dict[str, dict[str, str]] = {}


class InMemoryRedis:
    async def hgetall(self, key: str):
        return dict(memory_store.get(key, {}))

    async def hget(self, key: str, field: str):
        return memory_store.get(key, {}).get(field)

    async def hset(self, key: str, field: str, value: str):
        memory_store.setdefault(key, {})[field] = value

    async def hdel(self, key: str, field: str):
        if key in memory_store:
            memory_store[key].pop(field, None)
            if not memory_store[key]:
                memory_store.pop(key, None)

    async def delete(self, key: str):
        memory_store.pop(key, None)

    async def expire(self, key: str, seconds: int):
        return True

    async def ping(self):
        return True

    async def close(self):
        return None


async def get_redis() -> aioredis.Redis | InMemoryRedis:
    global redis_client
    if redis_client is None:
        try:
            if settings.REDIS_URL:
                redis_client = aioredis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                )
            else:
                redis_client = aioredis.Redis(
                    host=settings.REDIS_HOST,
                    port=settings.REDIS_PORT,
                    decode_responses=True,
                )

            await asyncio.wait_for(redis_client.ping(), timeout=2)
        except Exception:
            redis_client = InMemoryRedis()
    return redis_client


async def close_redis():
    global redis_client
    if redis_client:
        await redis_client.close()
        redis_client = None

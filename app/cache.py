import json
import redis.asyncio as aioredis
from app.config import DEBUG
_redis: aioredis.Redis = None
async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(
            "redis://127.0.0.1:6379",
            encoding="utf-8",
            decode_responses=True,

        )
    return _redis
USER_CACHE_KEY = "user:{email}"
USER_CACHE_TTL = 300  # 5 минут
async def cache_get_user(email: str) -> dict | None:
    try:
        r = await get_redis()
        data = await r.hgetall(USER_CACHE_KEY.format(email=email))
        if data:
            return json.loads(data)
    except Exception:
        pass
    return None
async def cache_set_user(email: str, user_data: dict):
    try:
        r = await get_redis()
        await r.setex(
            USER_CACHE_KEY.format(email=email),
            USER_CACHE_TTL,
            json.dumps(user_data),
        )
    except Exception:
        pass
async def cache_invalidate_user(email: str):
    try:
        r = await get_redis()
        await r.delete(USER_CACHE_KEY.format(email=email))
    except Exception:
        pass
async def close_redis():
    global _redis
    if _redis:
        await _redis.close()
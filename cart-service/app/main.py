from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings


def create_app() -> FastAPI:
    app = FastAPI(title=settings.PROJECT_NAME)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health_check():
        return {"status": "ok", "service": "cart"}

    @app.on_event("startup")
    async def startup():
        from app.core.redis import get_redis
        await get_redis()

    @app.on_event("shutdown")
    async def shutdown():
        from app.core.redis import close_redis
        await close_redis()

    from app.api import cart
    app.include_router(cart.router, prefix="/api/v1/cart", tags=["cart"])

    return app


app = create_app()

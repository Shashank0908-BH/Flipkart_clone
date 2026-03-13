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
        return {"status": "ok", "service": "product-catalog"}
        
    @app.on_event("startup")
    async def startup_event():
        from app.core.es import es_client
        await es_client.connect()

    @app.on_event("shutdown")
    async def shutdown_event():
        from app.core.es import es_client
        await es_client.disconnect()

    from app.api import categories, products
    app.include_router(categories.router, prefix="/api/v1/categories", tags=["categories"])
    app.include_router(products.router, prefix="/api/v1/products", tags=["products"])

    return app

app = create_app()

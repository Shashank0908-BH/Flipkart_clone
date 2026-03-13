from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine, Base
from app.models import inventory # Import to ensure schema is known

def create_app() -> FastAPI:
    # Create tables
    Base.metadata.create_all(bind=engine)

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
        return {"status": "ok", "service": "inventory"}

    from app.api import inventory
    app.include_router(inventory.router, prefix="/api/v1/inventory", tags=["inventory"])

    return app

app = create_app()

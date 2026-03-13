from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import engine, Base
from app.models import order as order_models
from app.api.orders import router as orders_router

def create_tables():
    Base.metadata.create_all(bind=engine)

app = FastAPI(title="Order & Payment Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_tables()

app.include_router(orders_router, prefix="/api/v1/orders", tags=["Orders"])

@app.get("/health")
def health_check():
    return {"status": "healthy"}

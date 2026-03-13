from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Flipkart Clone - Shopping Cart Service"
    REDIS_URL: str | None = None
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    INVENTORY_SERVICE_URL: str = "http://127.0.0.1:8001"
    PRODUCT_CATALOG_URL: str = "http://127.0.0.1:8000"

    class Config:
        env_file = ".env"


settings = Settings()

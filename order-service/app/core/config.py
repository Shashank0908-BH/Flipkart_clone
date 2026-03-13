from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Flipkart Clone - Order & Payment Service"
    DATABASE_URL: str | None = None
    POSTGRES_USER: str | None = None
    POSTGRES_PASSWORD: str | None = None
    POSTGRES_SERVER: str | None = None
    POSTGRES_PORT: str | None = None
    POSTGRES_DB: str | None = None
    CART_SERVICE_URL: str = "http://127.0.0.1:8002"
    AUTH_SERVICE_URL: str = "http://127.0.0.1:8003"
    INVENTORY_SERVICE_URL: str = "http://127.0.0.1:8001"
    EMAIL_PROVIDER: str = "auto"
    ORDER_EMAIL_FROM: str | None = None
    ORDER_EMAIL_REPLY_TO: str | None = None
    ORDER_NOTIFICATION_TO_EMAIL: str | None = None
    RESEND_API_KEY: str | None = None
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_USE_TLS: bool = True

    @property
    def DATABASE_URI(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    class Config:
        env_file = ".env"

settings = Settings()

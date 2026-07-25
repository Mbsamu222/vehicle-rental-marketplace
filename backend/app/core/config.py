from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    node_env: str = "development"
    port: int = 4000

    database_url: str

    firebase_service_account_b64: str

    cors_origin: str = "http://localhost:5173"

    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_pass: str = ""
    smtp_from: str = "Vehicle Rental Marketplace <no-reply@example.com>"

    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""

    storage_provider: str = "s3"
    s3_bucket: str = ""
    s3_region: str = ""
    s3_access_key_id: str = ""
    s3_secret_access_key: str = ""
    s3_endpoint: str = ""

    google_maps_api_key: str = ""

    @property
    def is_production(self) -> bool:
        return self.node_env == "production"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origin.split(",") if origin.strip()]

    @property
    def async_database_url(self) -> str:
        """SQLAlchemy async engine URL — same DATABASE_URL, asyncpg driver scheme."""
        url = self.database_url
        if url.startswith("postgresql://"):
            url = "postgresql+asyncpg://" + url[len("postgresql://") :]
        elif url.startswith("postgres://"):
            url = "postgresql+asyncpg://" + url[len("postgres://") :]
        # asyncpg doesn't understand Prisma's ?schema= query param
        if "?schema=" in url:
            url = url.split("?schema=")[0]
        return url


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

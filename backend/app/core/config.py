from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    node_env: str = "development"
    port: int = 4000

    database_url: str

    # Base64 service-account JSON. Optional so the app can also run against the
    # Firebase Auth emulator, or on GCP via Application Default Credentials,
    # neither of which needs a key checked into an env file.
    firebase_service_account_b64: str = ""

    # Path to a service-account JSON on disk. Alternative to the base64 form —
    # preferred on hosts that mount secrets as files (Cloud Run, k8s).
    google_application_credentials: str = ""

    # e.g. "localhost:9099". When set, the Admin SDK talks to the local emulator
    # and no real credential is required at all.
    firebase_auth_emulator_host: str = ""

    # Only needed alongside the emulator, which requires *a* project id but
    # does not validate it.
    firebase_project_id: str = ""

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
    def firebase_credential_source(self) -> str:
        """Which Firebase credential mechanism is configured, in precedence order.

        Returns one of: "emulator", "file", "base64", "adc", "none".
        `verify_id_token` is meaningless without one of the first four, so this is
        checked at startup rather than on the first authenticated request.
        """
        if self.firebase_auth_emulator_host:
            return "emulator"
        if self.google_application_credentials:
            return "file"
        # `e30=` is base64 for `{}` — treat the documented placeholder as absent
        # so it can't masquerade as real configuration.
        if self.firebase_service_account_b64 and self.firebase_service_account_b64 != "e30=":
            return "base64"
        if self.is_production:
            # On GCP the metadata server supplies credentials implicitly.
            return "adc"
        return "none"

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

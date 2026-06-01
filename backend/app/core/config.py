from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:password@db:5432/inventory_db"
    SECRET_KEY: str = "changeme-in-production"
    APP_ENV: str = "development"
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:80"
    model_config = SettingsConfigDict(env_file=".env")

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]


@lru_cache()
def get_settings() -> Settings:
    return Settings()

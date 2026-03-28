from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    GROQ_API_KEY: str = ""
    VAPI_API_KEY: str = ""
    SKETCHFAB_API_TOKEN: str = ""
    DATABASE_URL: str = "sqlite:///./sql_app.db"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()

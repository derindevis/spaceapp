from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

env_path = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    app_name: str = "AI Space Intelligence Platform"
    app_env: str = "development"
    database_url: str = "sqlite:///./space_platform.db"
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    jwt_secret_key: str = "change-me-to-something-more-specific"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    nasa_api_key: str = "DEMO_KEY"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.5-flash"
    gemini_fallback_models: str = ""
    frontend_origin: str = "http://localhost:5173"
    # Comma-separated extra origins (e.g. Vercel preview URLs)
    frontend_origins: str = ""

    model_config = SettingsConfigDict(env_file=env_path, env_file_encoding="utf-8")


settings = Settings()

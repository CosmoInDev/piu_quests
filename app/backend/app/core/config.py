from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://localhost/piu_quests"
    supabase_url: str = ""
    supabase_service_key: str = ""
    google_client_id: str = ""
    gemini_api_key: str = ""
    cors_origins: str = "http://localhost:3000"
    nextauth_secret: str = ""


settings = Settings()

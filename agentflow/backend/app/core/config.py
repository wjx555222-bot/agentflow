from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openai_api_key: str = "sk-your-api-key-here"
    openai_base_url: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-4o-mini"
    database_url: str = "sqlite+aiosqlite:///./agentflow.db"
    secret_key: str = "change-me-to-a-random-secret-key"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

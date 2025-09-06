from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    database_url: str
    
    # CORS
    allowed_origins: str = "http://localhost:3000"
    
    # Optional integrations
    openai_api_key: str = ""
    log_level: str = "info"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

    @property
    def cors_origins(self) -> List[str]:
        """Convert comma-separated origins to list"""
        return [origin.strip() for origin in self.allowed_origins.split(',')]


# Create settings instance
settings = Settings()
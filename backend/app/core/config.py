import os
from typing import List
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "AI Resume Analyzer & ATS Checker")
    API_V1_STR: str = "/api/v1"
    
    # JWT & Security
    # In production, this MUST be a strong, randomly generated key
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecret_jwt_sign_key_change_me_in_production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")) # 24 hours
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./resume_analyzer.db")
    
    # Gemini AI
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # File Storage
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    
    # CORS Origins
    @property
    def BACKEND_CORS_ORIGINS(self) -> List[str]:
        origins_str = os.getenv("BACKEND_CORS_ORIGINS", "")
        if not origins_str:
            return ["*"]
        return [origin.strip() for origin in origins_str.split(",") if origin.strip()]

settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

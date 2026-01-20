from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""

    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True

    # Face Detection Settings
    MIN_DETECTION_CONFIDENCE: float = 0.5
    MIN_TRACKING_CONFIDENCE: float = 0.5
    FACE_CONFIDENCE_THRESHOLD: float = 0.5

    # Image Processing
    MAX_IMAGE_SIZE: int = 1024
    JPEG_QUALITY: int = 85

    # Logging
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"


# Create global settings instance
settings = Settings()

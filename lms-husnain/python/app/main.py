import logging
import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent))

from .api.routes import router
from .config.settings import settings

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Face Detection Service",
    description="MediaPipe-based face detection and recognition service for LMS",
    version="1.0.0",
    debug=settings.DEBUG,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="", tags=["face-detection"])


@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Face Detection Service starting up...")
    logger.info(f"📊 Settings: Debug={settings.DEBUG}, Log Level={settings.LOG_LEVEL}")
    logger.info(f"🎯 Face confidence threshold: {settings.FACE_CONFIDENCE_THRESHOLD}")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("👋 Face Detection Service shutting down...")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info",  # <--- CHANGED THIS to lowercase string
    )

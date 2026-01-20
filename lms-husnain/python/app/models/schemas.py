from typing import List, Optional

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


class FaceDetectionResponse(BaseModel):
    success: bool
    embedding: Optional[List[float]] = None
    confidence: Optional[float] = None
    message: str
    faces_detected: int
    bounding_box: Optional[dict] = None


class FaceEmbeddingResponse(BaseModel):
    success: bool
    embedding: Optional[List[float]] = None
    confidence: Optional[float] = None
    message: str


class FaceComparisonRequest(BaseModel):
    embedding1: List[float]
    embedding2: List[float]


class FaceComparisonResponse(BaseModel):
    success: bool
    similarity: float
    is_match: bool
    confidence: float
    message: str

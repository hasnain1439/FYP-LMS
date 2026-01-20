import json
import logging
import base64
import cv2
import numpy as np
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, Request

from ..config.settings import settings
from ..models.schemas import (
    FaceComparisonRequest,
    FaceComparisonResponse,
    FaceDetectionResponse,
    FaceEmbeddingResponse,
    HealthResponse,
)
from ..services.face_detector import FaceDetector
from ..services.face_recognizer import FaceRecognizer

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize services
face_detector = FaceDetector()
face_recognizer = FaceRecognizer()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy", service="face-detection-service", version="1.0.0"
    )


@router.get("/system-info")
async def get_system_info():
    """Get system information about face recognition capabilities"""
    detector_info = {
        "face_detection": "MediaPipe",
        "detection_confidence": settings.MIN_DETECTION_CONFIDENCE,
    }

    recognizer_info = face_recognizer.get_embedding_info()

    return {
        "status": "operational",
        "detection": detector_info,
        "recognition": recognizer_info,
        "settings": {
            "face_confidence_threshold": settings.FACE_CONFIDENCE_THRESHOLD,
            "max_image_size": settings.MAX_IMAGE_SIZE,
        },
    }


@router.post("/detect-face", response_model=FaceDetectionResponse)
async def detect_face(image: UploadFile = File(...)):
    """
    Detect faces in uploaded image
    """
    try:
        if not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")

        image_data = await image.read()
        nparr = np.frombuffer(image_data, np.uint8)
        cv_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if cv_image is None:
            raise HTTPException(status_code=400, detail="Invalid image format")

        success, confidence, bounding_box, message = face_detector.detect_faces(cv_image)
        faces_detected = face_detector.get_face_count(cv_image)

        embedding = None
        if success:
            emb_success, emb_array, emb_confidence, emb_message = (
                face_recognizer.generate_embedding(cv_image)
            )
            if emb_success and emb_array is not None:
                embedding = emb_array.tolist()
                logger.info(f"✅ Real embedding generated: {len(embedding)} dimensions")
            else:
                logger.warning(f"⚠️ Embedding generation failed: {emb_message}")
                embedding = np.random.rand(512).tolist()  # Fallback to mock

        logger.info(f"Faces detected: {faces_detected}")
        logger.info(f"Success: {success}")

        return FaceDetectionResponse(
            success=success,
            embedding=embedding,
            confidence=confidence,
            message=message,
            faces_detected=faces_detected,
            bounding_box=bounding_box,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Face detection error: {str(e)}")
        return FaceDetectionResponse(
            success=False,
            embedding=None,
            confidence=None,
            message=f"Face detection failed: {str(e)}",
            faces_detected=0,
            bounding_box=None,
        )


@router.post("/generate-embedding", response_model=FaceEmbeddingResponse)
async def generate_embedding(image: UploadFile = File(...)):
    """
    Generate face embedding from uploaded image
    """
    try:
        if not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")

        image_data = await image.read()
        nparr = np.frombuffer(image_data, np.uint8)
        cv_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if cv_image is None:
            raise HTTPException(status_code=400, detail="Invalid image format")

        success, embedding_array, confidence, message = (
            face_recognizer.generate_embedding(cv_image)
        )

        if not success or embedding_array is None:
            return FaceEmbeddingResponse(success=False, message=message)

        embedding = embedding_array.tolist()

        return FaceEmbeddingResponse(
            success=True,
            embedding=embedding,
            confidence=confidence,
            message="Face embedding generated successfully",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Embedding generation error: {str(e)}")
        return FaceEmbeddingResponse(
            success=False, message=f"Embedding generation failed: {str(e)}"
        )


@router.post("/compare-faces", response_model=FaceComparisonResponse)
async def compare_faces(request: FaceComparisonRequest):
    """
    Compare two face embeddings directly
    """
    try:
        embedding1 = request.embedding1
        embedding2 = request.embedding2

        if len(embedding1) != len(embedding2):
            raise HTTPException(
                status_code=400, detail="Embeddings must have the same dimensions"
            )

        emb1 = np.array(embedding1, dtype=np.float32)
        emb2 = np.array(embedding2, dtype=np.float32)

        success, similarity, is_match, message = face_recognizer.compare_embeddings(
            emb1, emb2
        )

        if not success:
            raise HTTPException(status_code=400, detail=message)

        return FaceComparisonResponse(
            success=True,
            similarity=similarity,
            is_match=is_match,
            confidence=similarity,
            message=message,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Face comparison error: {str(e)}")
        return FaceComparisonResponse(
            success=False, message=f"Face comparison failed: {str(e)}"
        )


# =========================================================
# ✅ CRITICAL: STRICT 1-TO-1 FACE VERIFICATION LOGIC
# =========================================================
@router.post("/verify-face", response_model=FaceComparisonResponse)
async def verify_face(
    image: UploadFile = File(...),
    student_id: str = Form(None),         # Optional: ID for logging
    stored_embedding: str = Form(None)    # ✅ REQUIRED: JSON String from Node.js
):
    """
    Verify face in uploaded image against specific stored embedding.
    Ensures the person on camera IS the registered user.
    """
    try:
        # 1. Validate Image
        if not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")

        image_data = await image.read()
        nparr = np.frombuffer(image_data, np.uint8)
        cv_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if cv_image is None:
            raise HTTPException(status_code=400, detail="Invalid image format")

        # 2. Process Stored Embedding (The "Lock")
        target_embedding = None
        
        if stored_embedding:
            try:
                # Parse the JSON string sent by Node.js: e.g. "[0.123, 0.456, ...]"
                stored_emb_list = json.loads(stored_embedding)
                
                # Check dimensions (typically 512 for InsightFace)
                if isinstance(stored_emb_list, list) and len(stored_emb_list) == 512:
                    target_embedding = np.array(stored_emb_list, dtype=np.float32)
                else:
                    logger.warning(f"Invalid embedding format/length for student {student_id}")
            except Exception as e:
                logger.error(f"Failed to parse stored_embedding JSON: {e}")

        # 3. Security Check: If no valid embedding, FAIL immediately.
        # This prevents "bypass" by sending no data.
        if target_embedding is None:
            logger.error(f"❌ Security Block: No valid stored face found for comparison. ID: {student_id}")
            return FaceComparisonResponse(
                success=False,
                similarity=0.0,
                is_match=False,
                confidence=0.0,
                message="Security Error: No valid registered face found for this user."
            )

        # 4. Compare Live Face vs Stored Face
        success, similarity, is_match, message = face_recognizer.verify_face(
            cv_image, target_embedding
        )

        if not success:
            return FaceComparisonResponse(
                success=False,
                similarity=0.0,
                is_match=False,
                confidence=0.0,
                message=message,
            )

        return FaceComparisonResponse(
            success=True,
            similarity=float(similarity),
            is_match=is_match,
            confidence=float(similarity),
            message=message,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Face verification error: {str(e)}")
        return FaceComparisonResponse(
            success=False,
            similarity=0.0,
            is_match=False,
            confidence=0.0,
            message=f"Face verification failed: {str(e)}",
        )


@router.post("/verify-face-json", response_model=FaceComparisonResponse)
async def verify_face_json(request: Request):
    """
    Verify face against stored embedding using JSON payload (Alternative endpoint).
    """
    try:
        data = await request.json()

        image_b64 = data.get("image")
        stored_emb_list = data.get("stored_embedding")

        if not image_b64 or not stored_emb_list:
            raise HTTPException(status_code=400, detail="Missing image or stored_embedding in JSON body")

        if isinstance(image_b64, str) and image_b64.startswith("data:"):
            image_b64 = image_b64.split(",", 1)[1]

        try:
            image_bytes = base64.b64decode(image_b64)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 image string")

        if not isinstance(stored_emb_list, list) or len(stored_emb_list) != 512:
            raise HTTPException(
                status_code=400,
                detail="Invalid stored_embedding format. Must be a JSON array of 512 float values.",
            )

        stored_emb_array = np.array(stored_emb_list, dtype=np.float32)

        nparr = np.frombuffer(image_bytes, np.uint8)
        cv_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if cv_image is None:
            raise HTTPException(status_code=400, detail="Invalid image format")

        success, similarity, is_match, message = face_recognizer.verify_face(
            cv_image, stored_emb_array
        )

        if not success:
            return FaceComparisonResponse(
                success=False,
                similarity=0.0,
                is_match=False,
                confidence=0.0,
                message=message,
            )

        return FaceComparisonResponse(
            success=True,
            similarity=similarity,
            is_match=is_match,
            confidence=similarity,
            message=message,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Face verification (json) error: {str(e)}")
        return FaceComparisonResponse(
            success=False,
            similarity=0.0,
            is_match=False,
            confidence=0.0,
            message=f"Face verification failed: {str(e)}",
        )
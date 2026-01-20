import logging
from typing import Optional, Tuple

import cv2
import mediapipe as mp
import numpy as np

from ..config.settings import settings
from ..utils.image_utils import resize_image, validate_image

logger = logging.getLogger(__name__)


class FaceDetector:
    def __init__(self):
        self.face_detection = None
        self._initialize_detector()

    def _initialize_detector(self):
        """Initialize MediaPipe face detector"""
        try:
            self.face_detection = mp.solutions.face_detection.FaceDetection(
                model_selection=0,  # 0 for short-range, 1 for full-range
                min_detection_confidence=settings.MIN_DETECTION_CONFIDENCE,
            )
            logger.info("✅ MediaPipe face detector initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize MediaPipe: {str(e)}")
            self.face_detection = None

    def detect_faces(
        self, image: np.ndarray
    ) -> Tuple[bool, Optional[float], Optional[dict], str]:
        """
        Detect faces in image using MediaPipe

        Returns:
            - success: bool
            - confidence: Optional[float] (highest confidence score)
            - bounding_box: Optional[dict] {x, y, width, height}
            - message: str
        """
        try:
            if not validate_image(image):
                return False, None, None, "Invalid image provided"

            # Resize if too large
            processed_image = resize_image(image, settings.MAX_IMAGE_SIZE)

            # Convert BGR to RGB for MediaPipe
            rgb_image = cv2.cvtColor(processed_image, cv2.COLOR_BGR2RGB)

            if self.face_detection is None:
                return False, None, None, "Face detector not available"

            # Detect faces
            results = self.face_detection.process(rgb_image)

            if not results.detections:
                return False, None, None, "No faces detected"

            # Get the detection with highest confidence
            best_detection = max(
                results.detections, key=lambda detection: detection.score[0]
            )
            confidence = float(best_detection.score[0])

            # Get bounding box
            bbox = best_detection.location_data.relative_bounding_box
            h, w, _ = processed_image.shape

            bounding_box = {
                "x": int(bbox.xmin * w),
                "y": int(bbox.ymin * h),
                "width": int(bbox.width * w),
                "height": int(bbox.height * h),
            }

            logger.info(
                f"✅ Face detected: confidence={confidence:.3f}, bbox={bounding_box}"
            )

            return True, confidence, bounding_box, "Face detected successfully"

        except Exception as e:
            logger.error(f"❌ Face detection error: {str(e)}")
            return False, None, None, f"Face detection failed: {str(e)}"

    def get_face_count(self, image: np.ndarray) -> int:
        """
        Count number of faces in image
        """
        try:
            if not validate_image(image) or self.face_detection is None:
                return 0

            # Resize if too large
            processed_image = resize_image(image, settings.MAX_IMAGE_SIZE)

            # Convert BGR to RGB for MediaPipe
            rgb_image = cv2.cvtColor(processed_image, cv2.COLOR_BGR2RGB)

            # Detect faces
            results = self.face_detection.process(rgb_image)

            if not results.detections:
                return 0

            face_count = len(results.detections)
            logger.info(f"🔍 Found {face_count} faces in image")

            return face_count

        except Exception as e:
            logger.error(f"❌ Face counting error: {str(e)}")
            return 0

    def get_detector_info(self) -> dict:
        """Get information about the face detection system"""
        return {
            "model": "MediaPipe",
            "available": self.face_detection is not None,
            "min_confidence": settings.MIN_DETECTION_CONFIDENCE,
        }

import logging
from typing import Optional, Tuple

import insightface
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from ..config.settings import settings
from ..utils.image_utils import convert_to_rgb, resize_image, validate_image

logger = logging.getLogger(__name__)


class FaceRecognizer:
    def __init__(self):
        self.app = None
        self.embedding_size = 512
        self._initialize_model()

    def _initialize_model(self):
        """Initialize InsightFace model"""
        try:
            # Initialize InsightFace app
            self.app = insightface.app.FaceAnalysis(
                providers=["CPUExecutionProvider"]  # Use CPU (GPU optional)
            )
            self.app.prepare(ctx_id=0, det_size=(640, 640))

            logger.info("✅ InsightFace model initialized successfully")

        except Exception as e:
            logger.error(f"❌ Failed to initialize InsightFace: {str(e)}")
            logger.warning("🔄 Falling back to mock embeddings")
            self.app = None

    def generate_embedding(
        self, image: np.ndarray
    ) -> Tuple[bool, Optional[np.ndarray], Optional[float], str]:
        """
        Generate face embedding from image

        Returns:
            - success: bool
            - embedding: Optional[np.ndarray]
            - confidence: Optional[float]
            - message: str
        """
        try:
            if not validate_image(image):
                return False, None, None, "Invalid image provided"

            # Resize if too large
            processed_image = resize_image(image, settings.MAX_IMAGE_SIZE)

            # Convert to RGB for InsightFace
            rgb_image = convert_to_rgb(processed_image)

            if self.app is None:
                # Fallback to mock embedding
                logger.warning("Using mock embedding - InsightFace not available")
                mock_embedding = np.random.rand(self.embedding_size).astype(np.float32)
                return (
                    True,
                    mock_embedding,
                    0.85,
                    "Mock embedding generated (InsightFace not available)",
                )

            # Detect and analyze faces
            faces = self.app.get(rgb_image)

            if not faces:
                return False, None, None, "No faces detected in image"

            if len(faces) > 1:
                logger.warning(
                    f"Multiple faces detected ({len(faces)}), using the largest one"
                )

            # Get the face with highest confidence (largest bounding box area)
            best_face = max(
                faces, key=lambda x: (x.bbox[2] - x.bbox[0]) * (x.bbox[3] - x.bbox[1])
            )

            # Extract embedding
            embedding = best_face.embedding
            confidence = float(best_face.det_score)

            # Validate embedding
            if embedding is None or len(embedding) == 0:
                return False, None, None, "Failed to extract face embedding"

            # Normalize embedding (important for consistent comparisons)
            embedding = embedding / np.linalg.norm(embedding)

            logger.info(
                f"✅ Face embedding generated: size={len(embedding)}, confidence={confidence:.3f}"
            )

            return True, embedding, confidence, "Face embedding generated successfully"

        except Exception as e:
            logger.error(f"❌ Embedding generation error: {str(e)}")
            return False, None, None, f"Embedding generation failed: {str(e)}"

    def compare_embeddings(
        self, embedding1: np.ndarray, embedding2: np.ndarray
    ) -> Tuple[bool, float, bool, str]:
        """
        Compare two face embeddings

        Returns:
            - success: bool
            - similarity: float (0-1)
            - is_match: bool
            - message: str
        """
        try:
            if embedding1 is None or embedding2 is None:
                return False, 0.0, False, "One or both embeddings are None"

            if len(embedding1) != len(embedding2):
                return (
                    False,
                    0.0,
                    False,
                    f"Embedding dimensions mismatch: {len(embedding1)} vs {len(embedding2)}",
                )

            # Ensure embeddings are normalized
            embedding1 = embedding1 / np.linalg.norm(embedding1)
            embedding2 = embedding2 / np.linalg.norm(embedding2)

            # Calculate cosine similarity
            similarity = float(cosine_similarity([embedding1], [embedding2])[0][0])

            # Determine if it's a match based on threshold
            threshold = settings.FACE_CONFIDENCE_THRESHOLD
            is_match = similarity >= threshold

            logger.info(
                f"🔍 Face comparison: similarity={similarity:.3f}, threshold={threshold}, match={is_match}"
            )

            message = (
                f"Similarity: {similarity:.3f}, Match: {'Yes' if is_match else 'No'}"
            )

            return True, similarity, is_match, message

        except Exception as e:
            logger.error(f"❌ Embedding comparison error: {str(e)}")
            return False, 0.0, False, f"Comparison failed: {str(e)}"

    def verify_face(
        self, image: np.ndarray, stored_embedding: np.ndarray
    ) -> Tuple[bool, Optional[float], Optional[bool], str]:
        """
        Verify face in image against stored embedding

        Returns:
            - success: bool
            - similarity: Optional[float]
            - is_match: Optional[bool]
            - message: str
        """
        try:
            # Generate embedding from new image
            success, new_embedding, confidence, message = self.generate_embedding(image)

            if not success or new_embedding is None:
                return False, None, None, message

            # Compare embeddings
            comp_success, similarity, is_match, comp_message = self.compare_embeddings(
                new_embedding, stored_embedding
            )

            if not comp_success:
                return False, None, None, comp_message

            return True, similarity, is_match, comp_message

        except Exception as e:
            logger.error(f"❌ Face verification error: {str(e)}")
            return False, None, None, f"Face verification failed: {str(e)}"

    def get_embedding_info(self) -> dict:
        """Get information about the face recognition system"""
        return {
            "model": "InsightFace" if self.app else "Mock",
            "embedding_size": self.embedding_size,
            "available": self.app is not None,
            "threshold": settings.FACE_CONFIDENCE_THRESHOLD,
        }

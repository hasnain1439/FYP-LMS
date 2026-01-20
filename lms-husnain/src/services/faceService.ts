import { FaceDetectionResponse, FaceVerificationResponse } from "../types/auth";

const FACE_SERVICE_URL =
  process.env.FACE_SERVICE_URL || "http://localhost:8000";

export class FaceService {
  
  // ✅ FIX: Increased timeout to 60 seconds (60000ms)
  // AI models often take 15-30s to load on the first request.
  static async detectFace(imageBuffer: Buffer): Promise<FaceDetectionResponse> {
    try {
      const formData = new FormData();
      const blob = new Blob([imageBuffer], { type: "image/jpeg" });
      formData.append("image", blob, "image.jpg");

      const response = await fetch(`${FACE_SERVICE_URL}/detect-face`, {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(60000), // <--- CHANGED FROM 10000 to 60000
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as FaceDetectionResponse;

      console.log("Python service response:", data);

      return {
        success: data.success,
        embedding: data.embedding,
        confidence: data.confidence,
        message: data.message,
      };
    } catch (error: any) { // Typed as any to access error properties safely
      console.error("Face detection error:", error);
      
      // Specific error message for timeouts
      if (error.name === 'TimeoutError') {
        return { success: false, message: "Face detection timed out. Server is busy." };
      }
      
      return { success: false, message: "Face detection failed" };
    }
  }

  static async compareFaces(
    embedding1: number[],
    embedding2: number[]
  ): Promise<FaceDetectionResponse> {
    try {
      const response = await fetch(`${FACE_SERVICE_URL}/compare-faces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embedding1, embedding2 }),
        signal: AbortSignal.timeout(30000), // <--- Increased to 30s
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as {
        similarity: number;
        message: string;
        confidence: number;
      };

      return {
        success: true,
        confidence: data.confidence,
        message: data.message,
      };
    } catch (error) {
      console.error("Face comparison error:", error);
      return { success: false, message: "Face comparison failed" };
    }
  }

  static async verifyFace(
    imageBuffer: Buffer,
    storedEmbedding: number[]
  ): Promise<FaceVerificationResponse> {
    try {
      const formData = new FormData();
      const blob = new Blob([imageBuffer], { type: "image/jpeg" });
      formData.append("image", blob, "image.jpg");

      // Send stored embedding as a file in form-data
      const embeddingBlob = new Blob([JSON.stringify(storedEmbedding)], {
        type: "application/json",
      });
      formData.append("stored_embedding", embeddingBlob, "embedding.json");

      console.log("Form data prepared with image and embedding");

      const response = await fetch(`${FACE_SERVICE_URL}/verify-face`, {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(60000), // <--- CHANGED FROM 10000 to 60000
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as FaceVerificationResponse;

      return {
        success: data.success,
        similarity: data.similarity,
        is_match: data.is_match,
        confidence: data.confidence,
        message: data.message,
      };
    } catch (error: any) {
      console.error("Face verification error:", error);
      
      if (error.name === 'TimeoutError') {
        return {
            success: false,
            similarity: 0,
            is_match: false,
            confidence: 0,
            message: "Verification timed out. Server is busy.",
        };
      }

      return {
        success: false,
        similarity: 0,
        is_match: false,
        confidence: 0,
        message: "Face verification failed",
      };
    }
  }
}
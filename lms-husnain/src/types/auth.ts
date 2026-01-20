export interface User {
  id: string;
  email: string;
  role: "student" | "teacher";
  firstName: string;
  lastName: string;
  rollNumber?: string;
  profilePicture?: string;
  faceEmbedding?: number[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: "student" | "teacher";
  firstName: string;
  lastName: string;
  faceImage?: File;
}

export interface LoginRequest {
  email: string;
  password: string;
  faceImage?: File;
}

export interface AuthResponse {
  user: Omit<User, "faceEmbedding">;
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "student" | "teacher";
}

export interface FaceDetectionResponse {
  success: boolean;
  embedding?: number[];
  confidence?: number;
  message?: string;
}

export interface FaceVerificationResponse {
  success: boolean;
  similarity: number;
  is_match: boolean;
  confidence: number;
  message: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseName: string;
  enrolledAt: string;
  status: "active" | "dropped" | "completed";
  progress: number;
}

export interface EnrollmentResponse {
  success: boolean;
  data: Enrollment[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
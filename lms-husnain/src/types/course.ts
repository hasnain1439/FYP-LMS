export interface CourseWithDetails {
  id: string;
  name: string;
  description?: string;

  categories: string[];
  courseCurriculum?: string;
  totalSessions: number;
  offeredByTeacherId: string;
  createdAt: Date;
  updatedAt: Date;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  schedules: CourseScheduleInfo[];
  enrollmentCount: number;
}

export interface CourseScheduleInfo {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface CreateCourseRequest {
  name: string;
  description?: string;
  categories: string[];
  courseCurriculum?: string;
  totalSessions: number;
  schedules: CreateScheduleRequest[];
}

export interface CreateScheduleRequest {
  dayOfWeek: number; // 1=Monday, 2=Tuesday, ..., 5=Friday
  startTime: string; // "09:30" format
  endTime: string; // "11:00" format
}

export interface UpdateCourseRequest {
  name?: string;
  description?: string;
  categories?: string[];
  courseCurriculum?: string;
  totalSessions?: number;
  schedules?: CreateScheduleRequest[];
}

export interface CourseFilterQuery {
  category?: string;
  teacherName?: string;
  dayOfWeek?: number;
  startTimeAfter?: string;
  endTimeBefore?: string;
  search?: string;
}

export interface EnrollmentRequest {
  courseId: string;
}

export interface EnrollmentResponse {
  success: boolean;
  message: string;
  enrollment?: {
    id: string;
    courseId: string;
    enrolledAt: Date;
    status: string;
  };
}

export interface QuizCreateRequest {
  title: string;
  courseId: string;
  timeLimitMinutes: number;
  marksPerQuestion: number;
  deadline: string;
  questions: QuizQuestionRequest[];
}

export interface QuizQuestionRequest {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
}

export interface QuizUpdateRequest {
  title?: string;
  timeLimitMinutes?: number;
  marksPerQuestion?: number;
  deadline?: string;
  status?: "draft" | "published" | "closed";
}

export interface QuizSubmissionRequest {
  answers: QuizAnswerRequest[];
}

export interface QuizAnswerRequest {
  questionId: string;
  selectedIndex: number;
}

export interface QuizResponse {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  teacherName: string;
  timeLimitMinutes: number;
  totalQuestions: number;
  marksPerQuestion: string;
  totalMarks: string;
  deadline: string;
  status: string;
  questions?: QuizQuestionResponse[];
  isSubmitted?: boolean;
  submissionScore?: string;
}

export interface QuizQuestionResponse {
  id: string;
  questionText: string;
  options: string[];
  orderIndex: number;
}

export interface QuizSubmissionResponse {
  id: string;
  score: string;
  totalMarks: string;
  percentage: number;
  submittedAt: string;
  answers: {
    questionId: string;
    selectedIndex: number;
    isCorrect: boolean;
    correctIndex: number;
  }[];
}

export interface QuizFilterQuery {
  courseId?: string;
  status?: string;
}

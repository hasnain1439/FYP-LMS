import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// ---- Auth Pages ----
import Registeration from "../page/auth/Registeration";
import Login from "../page/auth/Login";
import VerifyEmail from "../page/auth/VerifyEmail";
import ResendVerification from "../page/auth/ResendVerification";
import ForgotPassword from "../page/auth/ForgetPassword";
import ResetPassword from "../page/auth/ResetPassword";

// ---- Teacher Dashboard Pages ----
import TeacherDashboard from "../page/adminDashboard/dashboard";
import DashboardHome from "../page/adminDashboard/dashboard/feature/DashboardHome";
import CoursesPage from "../page/adminDashboard/courses";
import CourseDetail from "../page/adminDashboard/courses/feature/CourseDetail";
import QuizzesPage from "../page/adminDashboard/qizzes/index";
import CreateQuiz from "../page/adminDashboard/qizzes/feature/CreateQuiz";
import EditQuiz from "../page/adminDashboard/qizzes/feature/EditQuiz";
import EditQuestion from "../page/adminDashboard/qizzes/feature/EditQuestion";
import AddQuestion from "../page/adminDashboard/qizzes/feature/AddQuestion";
import QuizDetails from "../page/adminDashboard/qizzes/feature/QuizDetails";
import EnrollmentsPage from "../page/adminDashboard/enrollment/index.jsx";
import ProfilePage from "../page/adminDashboard/profile/feature/ProfilePage";
import UpdateProfile from "../page/adminDashboard/profile/feature/UpdateProfile";
import ChangePassword from "../page/adminDashboard/profile/feature/ChangePassword";
import TeacherAttendance from "../page/adminDashboard/teacherAttendance/TeacherAttendance.jsx"; // ✅ Import Teacher Attendance Page

// ---- Student Dashboard Pages ----
import StudentLayout from "../component/StudentLayout";
import StdDashboard from "../page/student/studentDashboard/index.jsx";
import MyCourses from "../page/student/myCourses/index.jsx";
import MyCourseDetails from "../page/student/studentDashboard/feature/MyCourseDetails.jsx";
import BrowseCourses from "../page/student/allCourses/index.jsx";
import CourseDetails from "../page/student/allCourses/feature/CourseDetails.jsx";
import StudentQuizzes from "../page/student/studentQuizzies/index.jsx";
import TakeQuiz from "../page/student/studentQuizzies/feture/TakeQuiz.jsx";
import QuizResult from "../page/student/studentQuizzies/feture/QuizResult.jsx";
import StudentAttendance from "../page/student/studentAttendance/StudentAttendance.jsx"; // ✅ Import Student Attendance Page

function FypRoutes() {
  const router = createBrowserRouter([
    // ---- Public Routes ----
    {
      path: "/",
      element: (
        <h1 className="text-center text-2xl font-bold mt-10">Home Page</h1>
      ),
    },
    { path: "/register", element: <Registeration /> },
    { path: "/login", element: <Login /> },
    { path: "/verify-email/:userId/:token", element: <VerifyEmail /> },
    { path: "/resend-verification", element: <ResendVerification /> },
    { path: "/forget-password", element: <ForgotPassword /> },
    { path: "/reset-password/:token", element: <ResetPassword /> },

    // ---- Teacher Dashboard Routes ----
    {
      path: "/teacher",
      element: <TeacherDashboard />,
      children: [
        { index: true, element: <DashboardHome /> },
        { path: "courses", element: <CoursesPage /> },
        { path: "course/:courseId", element: <CourseDetail /> },
        {
          path: "quizzes",
          children: [
            { index: true, element: <QuizzesPage /> },
            { path: "create-quizzes", element: <CreateQuiz /> },
            { path: "edit-quiz/:quizId", element: <EditQuiz /> },
            {
              path: "edit-quiz/:quizId/questions/:questionId",
              element: <EditQuestion />,
            },
            {
              path: "edit-quiz/:quizId/add-question",
              element: <AddQuestion />,
            },
            { path: "view-quiz/:quizId", element: <QuizDetails /> },
          ],
        },
        { path: "enrollments", element: <EnrollmentsPage /> },
        // ✅ Teacher Attendance Report Route
        { path: "attendance", element: <TeacherAttendance /> },
        { path: "profile", element: <ProfilePage /> },
        { path: "update-profile", element: <UpdateProfile /> },
        { path: "change-password", element: <ChangePassword /> },
      ],
    },

    // ---- Student Dashboard Routes ----
    {
      path: "/student",
      element: <StudentLayout />,
      children: [
        // 1. Dashboard Overview
        {
          index: true,
          element: <StdDashboard />,
          handle: { title: "Dashboard" },
        },
        // 2. My Learning (Enrolled Courses)
        {
          path: "my-courses",
          element: <MyCourses />,
          handle: { title: "My Courses" },
        },
        {
          path: "my-course/:courseId",
          element: <MyCourseDetails />,
          handle: { title: "My Course Detail" },
        },
        // 3. Catalog (Browse New Courses)
        {
          path: "catalog",
          element: <BrowseCourses />,
          handle: { title: "Browse Courses" },
        },
        // 4. Public Course Details
        {
          path: "course-details/:courseId",
          element: <CourseDetails />,
          handle: { title: "Course Details" },
        },
        // 5. Quizzes
        {
          path: "quizzes",
          element: <StudentQuizzes />,
          handle: { title: "My Quizzes" },
        },
        {
          path: "take-quiz/:quizId",
          element: <TakeQuiz />,
          handle: { title: "Attempt Quiz" },
        },
        {
          path: "quiz-result/:quizId",
          element: <QuizResult />,
          handle: { title: "Quiz Results" },
        },
        // 6. ✅ Student Attendance History Route
        {
          path: "attendance",
          element: <StudentAttendance />,
          handle: { title: "My Attendance" },
        },
        // 7. Profile
        {
          path: "profile",
          element: <ProfilePage />,
          handle: { title: "My Profile" },
        },
        { path: "update-profile", element: <UpdateProfile /> },
        { path: "change-password", element: <ChangePassword /> },
      ],
    },

    // ---- Fallback Route ----
    {
      path: "*",
      element: (
        <h1 className="text-center text-2xl font-bold mt-10 text-red-500">
          404 | Page Not Found
        </h1>
      ),
    },
  ]);

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <RouterProvider router={router} />
    </>
  );
}

export default FypRoutes;
import { useEffect, useState } from "react";
import { FaPlus, FaEdit, FaTrash, FaRegEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast"; // 🔔 1. Import Toast

// 👇 2. Import Standard Components
import LoadingSpinner from "../../../../component/LoadingSpinner";
import EmptyState from "../../../../component/EmptyState";

import { GetCourses } from "../../../../api/GetCourses"; 

// Helper for status styling
const getStatusStyles = (status) => {
  switch (status?.toLowerCase()) {
    case "published":
    case "active":
      return "bg-green-50 text-green-700 border border-green-200";
    case "draft":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "archived":
    case "closed":
      return "bg-red-50 text-red-700 border border-red-200";
    default:
      return "bg-gray-50 text-gray-600 border border-gray-200";
  }
};

export default function QuizzesSection() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchCoursesData = async () => {
      try {
        const data = await GetCourses();
        setCourses(data || []);
      } catch (err) {
        console.error("Failed to load courses:", err);
        toast.error("Failed to load courses list.");
      }
    };
    fetchCoursesData();
  }, []);

  // Fetch quizzes
  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      setError("");

      try {
        // ✅ FIX: Get Token
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        const res = await axios.get(
          "http://localhost:5000/api/quizzes/teacher-quizzes",
          {
            params: { courseId, status },
            headers: { Authorization: `Bearer ${token}` }, // ✅ ADDED HEADER
            withCredentials: true,
          }
        );
        setQuizzes(res.data.quizzes || []);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) {
          navigate("/login", { replace: true });
        } else {
          setError("Failed to load quizzes. Please check backend connection.");
          toast.error("Failed to load quizzes.");
          setQuizzes([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [courseId, status, navigate]);

  // Handle Delete
  const handleDelete = async (quizId) => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) return;
    try {
      const token = localStorage.getItem("token"); // ✅ GET TOKEN
      await axios.delete(`http://localhost:5000/api/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }, // ✅ ADD HEADER
        withCredentials: true,
      });
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
      toast.success("Quiz deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete quiz");
    }
  };

  return (
    <div className="w-full space-y-8 bg-gray-50 min-h-screen font-sans text-gray-800">
      
      {/* --- Top Bar --- */}
      <div className="bg-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row sm:justify-between items-center gap-4">
        
        {/* Filters Group */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Course Filter */}
          <div className="relative w-full sm:w-64">
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="block w-full px-4 py-2.5 bg-gray-50 border border-gray rounded-xl text-sm text-gray-700 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 cursor-pointer appearance-none"
            >
              <option value="">All Courses</option>
              {Array.isArray(courses) &&
                courses.map((course) => (
                  <option key={course.id || course._id} value={course.id || course._id}>
                    {course.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative w-full sm:w-48">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="block w-full px-4 py-2.5 bg-gray-50 border border-gray rounded-xl text-sm text-gray-700 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 cursor-pointer appearance-none"
            >
              <option value="">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Add Button */}
        <button
          onClick={() => navigate("create-quizzes")}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all duration-200 transform hover:-translate-y-0.5 font-medium text-sm"
        >
          <FaPlus size={14} /> 
          <span>Create Quiz</span>
        </button>
      </div>

      {/* --- Table Card --- */}
      <div className="bg-white rounded-3xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Quiz Title</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Course</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Questions</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Marks</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Attempts</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                // ✅ Standard Loading Spinner
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-red-500">{error}</td>
                </tr>
              ) : quizzes.length === 0 ? (
                // ✅ Standard Empty State
                <tr>
                  <td colSpan={7} className="py-12">
                    <EmptyState message="No quizzes found matching your criteria." />
                  </td>
                </tr>
              ) : (
                quizzes.map((q, i) => (
                  <tr key={q.id || q._id || i} className="hover:bg-gray-50/80 transition-colors duration-150 group">
                    <td className="py-4 px-6 font-semibold text-gray-900 text-sm whitespace-nowrap">
                      {(q.title || "Untitled Quiz").length>30 ? (q.title || "Untitled Quiz").slice(0,30)+ "..." : (q.title || "Untitled Quiz")}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      <span className="bg-gray-100 px-2 py-1 rounded-md whitespace-nowrap border border-gray-200 font-medium text-xs text-gray-700">
                        {(q.courseName.length>30 ? (q.courseName).slice(0,30) + "..." : (q.courseName))}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600 font-medium text-center">
                      {q.totalQuestions}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600 font-medium text-center">
                      {q.totalMarks}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600 text-center">
                      {q.submissionCount || 0}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusStyles(q.status)}`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => navigate(`view-quiz/${q.id}`)}
                          className="p-2 text-gray hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="View Details"
                        >
                          <FaRegEye size={16} />
                        </button>
                        <button
                          onClick={() => navigate(`edit-quiz/${q.id}`)}
                          className="p-2 text-gray hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <FaEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="p-2 text-gray hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <FaTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
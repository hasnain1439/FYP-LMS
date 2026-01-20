import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Calendar,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast"; // 🔔 Import Toast

// 👇 Import Standard Components
import LoadingSpinner from "../../../../component/LoadingSpinner";
import EmptyState from "../../../../component/EmptyState";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function StudentQuizzesSection() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();

  // --- Fetch Quizzes ---
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${BACKEND_URL}/api/quizzes/student-quizzes`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setQuizzes(response.data.quizzes || []);
      } catch (err) {
        console.error("Error fetching quizzes:", err);
        setError("Failed to load quizzes.");
        toast.error("Failed to load quizzes.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  // --- Filtering Logic ---
  const filteredQuizzes = quizzes.filter((quiz) => {
    const title = quiz.title || "";
    const courseName = quiz.courseName || "";
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch =
      title.toLowerCase().includes(searchLower) ||
      courseName.toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    if (filter === "todo") return !quiz.isSubmitted;
    if (filter === "completed") return quiz.isSubmitted;
    return true;
  });

  // --- Helper: Format Date ---
  const formatDate = (dateString) => {
    if (!dateString) return "No Date";
    return new Date(dateString).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // --- Helper: Get Status Badge ---
  const getStatusBadge = (quiz) => {
    const now = new Date();
    const deadline = new Date(quiz.deadline);

    if (quiz.isSubmitted) {
      return (
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
          <CheckCircle size={12} /> Completed
        </span>
      );
    }
    if (now > deadline) {
      return (
        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
          <AlertCircle size={12} /> Missed
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
        <Clock size={12} /> Pending
      </span>
    );
  };

  // --- Action Handler ---
  const handleQuizAction = (quiz) => {
    const now = new Date();
    const deadline = new Date(quiz.deadline);

    if (quiz.isSubmitted) {
      navigate(`/student/quiz-result/${quiz.id}`);
    } else if (now > deadline) {
      toast.error("This quiz is overdue and cannot be attempted.");
    } else {
      navigate(`/student/take-quiz/${quiz.id}`);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="text-blue-600" size={28} />
              My Quizzes
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Manage your upcoming assessments and view results.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search quizzes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex p-1 bg-white border border-gray-200 rounded-xl">
              {["all", "todo", "completed"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                    filter === f
                      ? "bg-blue-50 text-blue-600 shadow-sm"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {f === "todo" ? "To Do" : f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* --- Content Area --- */}
        {filteredQuizzes.length === 0 ? (
          // ✅ Standard Empty State
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12">
            <EmptyState message="No quizzes found matching your criteria." />
          </div>
        ) : filter === "completed" ? (
          /* --- Table View for Completed Quizzes --- */
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                    <th className="px-6 py-4">Quiz Name</th>
                    <th className="px-6 py-4">Course</th>
                    <th className="px-6 py-4 text-center">Score</th>
                    <th className="px-6 py-4 text-center">Percentage</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredQuizzes.map((quiz) => {
                    const percentage = Math.round(
                      (quiz.submissionScore / quiz.totalMarks) * 100,
                    );
                    const isPass = percentage >= 50;

                    return (
                      <tr
                        key={quiz.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {quiz.title}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {quiz.courseName}
                        </td>
                        <td className="px-6 py-4 text-center font-mono font-medium text-gray-700">
                          {quiz.submissionScore} / {quiz.totalMarks}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${isPass ? "bg-green-500" : "bg-red-500"}`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-bold text-gray-600">
                              {percentage}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-bold ${isPass ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                          >
                            {isPass ? "Pass" : "Fail"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleQuizAction(quiz)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-colors flex items-center justify-end gap-1 ml-auto"
                          >
                            <Eye size={16} />{" "}
                            <span className="text-xs font-bold">View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* --- Grid View for All/Todo Quizzes --- */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz) => {
              const isOverdue =
                new Date() > new Date(quiz.deadline) && !quiz.isSubmitted;

              return (
                <div
                  key={quiz.id}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-md transition-all flex flex-col"
                >
                  {/* Top Row: Course & Status */}
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wide">
                      {(quiz.courseName || "General").length > 15
                        ? (quiz.courseName || "General").slice(0, 15) + "..."
                        : ( quiz.courseName || "General")}
                    </span>
                    {getStatusBadge(quiz)}
                  </div>

                  {/* Title & Info */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                    {quiz.title || "Untitled Quiz"}
                  </h3>
                  <div className="text-sm text-gray-500 space-y-2 mb-6">
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span>
                        {quiz.timeLimitMinutes} Mins • {quiz.totalQuestions}{" "}
                        Questions
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span
                        className={isOverdue ? "text-red-500 font-medium" : ""}
                      >
                        Due: {formatDate(quiz.deadline)}
                      </span>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 block uppercase tracking-wider">
                        Total Marks
                      </span>
                      <span className="font-bold text-gray-900">
                        {quiz.totalMarks}
                      </span>
                    </div>

                    {quiz.isSubmitted ? (
                      <div className="text-right">
                        <span className="text-xs text-gray-400 block uppercase tracking-wider">
                          Your Score
                        </span>
                        <span className="font-bold text-green-600 text-lg">
                          {quiz.submissionScore ?? "Grading..."}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleQuizAction(quiz)}
                        disabled={isOverdue}
                        className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                          isOverdue
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200"
                        }`}
                      >
                        {isOverdue ? "Closed" : "Start Quiz"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

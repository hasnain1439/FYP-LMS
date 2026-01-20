import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft, Clock, Award, Calendar, BookOpen, 
  CheckCircle2, LayoutList, XCircle
} from "lucide-react";

// 👇 Import Standard Components
import LoadingSpinner from "../../../../component/LoadingSpinner";
import EmptyState from "../../../../component/EmptyState";

export default function QuizDetails() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQuizDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // Security Check
        if (!token) {
            navigate("/login");
            return;
        }

        const res = await axios.get(
          `http://localhost:5000/api/quizzes/${quizId}`,
          { 
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true 
          }
        );
        setQuiz(res.data.quiz);
      } catch (err) {
        console.error("Error fetching quiz details:", err);
        if (err.response?.status === 401) {
            navigate("/login");
        } else {
            setError("Failed to load quiz details.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (quizId) {
      fetchQuizDetails();
    }
  }, [quizId, navigate]);

  // ✅ Standard Loading
  if (loading) return <LoadingSpinner />;

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center max-w-sm w-full">
        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle size={24} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Error</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all w-full"
        >
          Go Back
        </button>
      </div>
    </div>
  );

  if (!quiz) return null;

  // Status Badge Color Helper
  const getStatusColor = (status) => {
    switch (status) {
      case "published": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "draft": return "bg-amber-50 text-amber-700 border-amber-200";
      case "closed": return "bg-rose-50 text-rose-700 border-rose-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-20">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* --- Header --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 bg-white rounded-xl hover:bg-gray-50 transition shadow-sm text-gray-600"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                {quiz.title}
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <span className="font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  {quiz.courseName}
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                <span>
                  Created on {new Date(quiz.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-2 ${getStatusColor(quiz.status)}`}>
            <span className={`w-2 h-2 rounded-full ${
                quiz.status === 'published' ? 'bg-emerald-500' : 
                quiz.status === 'draft' ? 'bg-amber-500' : 'bg-rose-500'
            }`}></span>
            {quiz.status}
          </div>
        </div>

        {/* --- Info Cards Grid --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Time Limit */}
          <div className="bg-white p-5 rounded-2xl shadow-md flex flex-col gap-3 transition-all hover:shadow-md">
            <div className="flex items-center gap-2 text-gray-500">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Clock size={18} /></div>
                <span className="text-xs font-bold uppercase tracking-wide">Time Limit</span>
            </div>
            <p className="text-xl font-bold text-gray-900 ml-1">
                {quiz.timeLimitMinutes} <span className="text-sm font-normal text-gray-500">min</span>
            </p>
          </div>

          {/* Total Marks */}
          <div className="bg-white p-5 rounded-2xl shadow-md flex flex-col gap-3 transition-all hover:shadow-md">
            <div className="flex items-center gap-2 text-gray-500">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl"><Award size={18} /></div>
                <span className="text-xs font-bold uppercase tracking-wide">Marks</span>
            </div>
            <p className="text-xl font-bold text-gray-900 ml-1">{quiz.totalMarks}</p>
          </div>

          {/* Questions Count */}
          <div className="bg-white p-5 rounded-2xl shadow-md flex flex-col gap-3 transition-all hover:shadow-md">
            <div className="flex items-center gap-2 text-gray-500">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-xl"><BookOpen size={18} /></div>
                <span className="text-xs font-bold uppercase tracking-wide">Questions</span>
            </div>
            <p className="text-xl font-bold text-gray-900 ml-1">{quiz.totalQuestions}</p>
          </div>

          {/* Deadline */}
          <div className="bg-white p-5 rounded-2xl shadow-md flex flex-col gap-3 transition-all hover:shadow-md">
            <div className="flex items-center gap-2 text-gray-500">
                <div className="p-2 bg-red-50 text-red-600 rounded-xl"><Calendar size={18} /></div>
                <span className="text-xs font-bold uppercase tracking-wide">Deadline</span>
            </div>
            <div>
                <p className="text-lg font-bold text-gray-900 leading-tight ml-1">
                    {new Date(quiz.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </p>
                <p className="text-xs text-gray-400 ml-1 font-medium">
                    {new Date(quiz.deadline).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
            </div>
          </div>
        </div>

        {/* --- Questions Preview --- */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-1">
            <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm text-blue-600">
              <LayoutList size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Quiz Preview</h2>
          </div>

          {quiz.questions && quiz.questions.length > 0 ? (
            quiz.questions.map((q, i) => (
              <div
                key={q.id}
                className="bg-white p-6 md:p-8 rounded-3xl shadow-md hover:shadow-md transition-shadow"
              >
                <div className="flex gap-5">
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-500 font-bold rounded-xl text-sm border border-gray-200">
                    {i + 1}
                  </div>
                  <div className="flex-1 space-y-6">
                    <h3 className="font-bold text-lg text-gray-900 leading-snug">
                      {q.questionText}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {q.options.map((opt, idx) => {
                        const isCorrect = idx === q.correctOptionIndex;
                        return (
                          <div
                            key={idx}
                            className={`text-sm px-5 py-3 rounded-xl border flex items-center gap-3 transition-colors ${
                              isCorrect
                                ? "bg-emerald-50/60 border-emerald-200 text-emerald-900 font-medium"
                                : "bg-white border-gray-100 text-gray-600"
                            }`}
                          >
                            {isCorrect ? (
                              <CheckCircle2
                                size={18}
                                className="text-emerald-500 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"></div>
                            )}
                            <span className="leading-relaxed">{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // ✅ Standard Empty State
            <EmptyState message="This quiz doesn't have any questions yet." />
          )}
        </div>
      </div>
    </div>
  );
}
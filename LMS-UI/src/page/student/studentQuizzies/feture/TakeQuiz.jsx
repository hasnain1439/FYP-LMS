import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Clock, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast"; // 🔔 Import Toast

// 👇 Import Standard Component
import LoadingSpinner from "../../../../component/LoadingSpinner";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function TakeQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); 
  const [answers, setAnswers] = useState({}); 
  const [error, setError] = useState("");

  // 1. Fetch Quiz Data
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BACKEND_URL}/api/quizzes/${quizId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuiz(res.data.quiz);
        setTimeLeft(res.data.quiz.timeLimitMinutes * 60);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load quiz");
        toast.error("Failed to load quiz.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  // 2. Timer Logic
  useEffect(() => {
    if (!timeLeft || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(); // Auto-submit when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format Time (MM:SS)
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // 3. Handle Selection
  const handleSelect = (questionId, optionIndex) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  // 4. Submit Quiz
  const handleSubmit = async () => {
    if (submitting) return;
    if (!window.confirm("Are you sure you want to submit?")) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      
      const formattedAnswers = quiz.questions.map(q => ({
        questionId: q.id,
        selectedIndex: answers[q.id] !== undefined ? answers[q.id] : -1 
      }));

      await axios.post(
        `${BACKEND_URL}/api/quizzes/${quizId}/submit`,
        { answers: formattedAnswers },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Quiz submitted successfully!");
      navigate(`/student/quiz-result/${quizId}`); // Go to Result Page
    } catch (err) {
      toast.error("Submission failed. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-800">
      
      {/* Sticky Header with Timer */}
      <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200 flex justify-between items-center px-6 py-4">
        <div>
          <h2 className="font-bold text-gray-900 text-lg line-clamp-1">{quiz.title}</h2>
          <p className="text-xs text-gray-500">{quiz.totalQuestions} Questions • {quiz.totalMarks} Marks</p>
        </div>
        <div className={`px-4 py-2 rounded-xl font-mono font-bold text-lg flex items-center gap-2 ${timeLeft < 300 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
          <Clock size={20} />
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-8 mt-8 px-4">
        {quiz.questions.map((q, i) => (
          <div key={q.id} className="bg-white p-6 rounded-3xl shadow-md border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex gap-3">
              <span className="flex-shrink-0 bg-gray-100 text-gray-600 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">{i + 1}</span>
              {q.questionText}
            </h3>

            <div className="grid gap-3">
              {q.options.map((opt, idx) => (
                <label 
                  key={idx} 
                  className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                    answers[q.id] === idx 
                      ? "bg-blue-50 border-blue-300 ring-1 ring-blue-300" 
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${answers[q.id] === idx ? "border-blue-600" : "border-gray-400"}`}>
                    {answers[q.id] === idx && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                  </div>
                  <input 
                    type="radio" 
                    name={`question-${q.id}`} 
                    className="hidden" 
                    onChange={() => handleSelect(q.id, idx)} 
                  />
                  <span className="text-gray-700">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-end pt-4 pb-8">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-200 transition-all flex items-center gap-2 disabled:opacity-70"
          >
            {submitting ? "Submitting..." : <><CheckCircle2 size={20} /> Submit Quiz</>}
          </button>
        </div>
      </div>
    </div>
  );
}
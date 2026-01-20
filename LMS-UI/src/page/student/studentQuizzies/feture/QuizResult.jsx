import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { CheckCircle2, XCircle, ArrowLeft, Trophy } from "lucide-react";

// 👇 Import Standard Component
import LoadingSpinner from "../../../../component/LoadingSpinner";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function QuizResult() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BACKEND_URL}/api/quizzes/${quizId}/result`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setResult(res.data.result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [quizId]);

  if (loading) return <LoadingSpinner />;
  if (!result) return <div className="p-10 text-center text-red-500">Result not found.</div>;

  // Calculate pass/fail color
  const percentage = result.percentage;
  const isPass = percentage >= 50;
  const gradeColor = isPass ? "text-green-600" : "text-red-600";
  const bgClass = isPass ? "bg-green-50" : "bg-red-50";

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-800">
      <div className="w-full space-y-8">
        
        {/* Header */}
        <button onClick={() => navigate("/student/quizzes")} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition">
          <ArrowLeft size={18} /> Back to Quizzes
        </button>

        {/* Score Card */}
        <div className="bg-white rounded-3xl shadow-md overflow-hidden text-center p-8">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${bgClass}`}>
            <Trophy size={40} className={gradeColor} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{percentage}%</h1>
          <p className="text-gray-500 text-lg">You scored <span className="font-bold text-gray-800">{result.score}</span> out of {result.totalMarks}</p>
          <div className="mt-6 inline-block px-6 py-2 rounded-full bg-gray-100 text-gray-600 font-medium text-sm">
            Submitted on {new Date(result.submittedAt).toLocaleDateString()}
          </div>
        </div>

        {/* Question Breakdown */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 px-2">Detailed Analysis</h2>
          
          {result.answers.map((ans, i) => (
            <div key={i} className={`bg-white p-6 rounded-2xl border shadow-sm ${ans.isCorrect ? 'border-green-200' : 'border-red-200'}`}>
              <div className="flex items-start gap-4 mb-4">
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold ${ans.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Question {i + 1}</h3> 
                  <div className="flex items-center gap-2 text-sm font-medium">
                      {ans.isCorrect ? (
                          <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={16}/> Correct</span>
                      ) : (
                          <span className="text-red-600 flex items-center gap-1"><XCircle size={16}/> Incorrect</span>
                      )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className={`p-4 rounded-xl border ${ans.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <span className="block text-xs font-bold uppercase tracking-wider opacity-70 mb-1">Your Answer</span>
                      <p className="font-semibold">Option {ans.selectedIndex + 1}</p>
                  </div>
                  {!ans.isCorrect && (
                      <div className="p-4 rounded-xl border bg-green-50 border-green-200">
                          <span className="block text-xs font-bold uppercase tracking-wider text-green-700 mb-1">Correct Answer</span>
                          <p className="font-semibold text-green-800">Option {ans.correctIndex + 1}</p>
                      </div>
                  )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
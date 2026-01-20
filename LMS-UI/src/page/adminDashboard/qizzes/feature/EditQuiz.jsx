import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast"; // 🔔 1. Import Toast
import {
  Save, ArrowLeft, Trash2, Edit2, Clock, Calendar, 
  Settings, AlertCircle, CheckCircle2, LayoutList, 
  Plus, BookOpen, Hash
} from "lucide-react";

// 👇 2. Import Standard Component
import LoadingSpinner from "../../../../component/LoadingSpinner";

// Helper: Format UTC date to Local ISO string
const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
};

// Validation Schema
const QuizSchema = Yup.object().shape({
  title: Yup.string().min(3, "Too short").required("Required"),
  timeLimit: Yup.number().min(1, "Min 1 min").required("Required"),
  marksPerQuestion: Yup.number().min(0.5, "Min 0.5").required("Required"),
  deadline: Yup.date().required("Required"),
  status: Yup.string().oneOf(["draft", "published", "closed"]).required(),
});

export default function EditQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);

  const [initialValues, setInitialValues] = useState({
    title: "",
    timeLimit: "",
    marksPerQuestion: "",
    deadline: "",
    status: "draft",
  });

  // 1. Fetch Quiz Data
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        const res = await axios.get(
          `http://localhost:5000/api/quizzes/${quizId}`,
          { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
        );

        const data = res.data.quiz;
        setQuestions(data.questions || []);

        setInitialValues({
          title: data.title || "",
          timeLimit: data.timeLimitMinutes || "",
          marksPerQuestion: data.marksPerQuestion || "",
          deadline: formatDateForInput(data.deadline),
          status: data.status || "draft",
        });
      } catch (err) {
        console.error("Failed to load quiz", err);
        toast.error("Failed to load quiz details.");
        if (err.response?.status === 401) navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId, navigate]);

  // 2. Formik Setup
  const formik = useFormik({
    initialValues: initialValues,
    enableReinitialize: true,
    validationSchema: QuizSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const token = localStorage.getItem("token");
        const totalQ = questions.length;
        const totalM = totalQ * Number(values.marksPerQuestion);

        await axios.put(
          `http://localhost:5000/api/quizzes/${quizId}`,
          {
            title: values.title,
            timeLimitMinutes: Number(values.timeLimit),
            marksPerQuestion: Number(values.marksPerQuestion),
            deadline: new Date(values.deadline).toISOString(),
            status: values.status,
            totalQuestions: totalQ, 
            totalMarks: totalM,
          },
          { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
        );
        
        toast.success("Quiz updated successfully!");
        window.scrollTo({ top: 0, behavior: "smooth" });

      } catch (err) {
        toast.error(err.response?.data?.error || "Failed to update quiz.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Handle Delete Question
  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/quizzes/${quizId}/questions/${questionId}`,
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      toast.success("Question deleted.");
    } catch (err) {
      toast.error("Failed to delete question.");
    }
  };

  // Helper Styles
  const getStatusColor = (status) => {
    switch (status) {
      case "published": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "draft": return "bg-amber-100 text-amber-700 border-amber-200";
      case "closed": return "bg-rose-100 text-rose-700 border-rose-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // ✅ Standard Loading
  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-20">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* --- Header --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2.5 bg-white rounded-xl hover:bg-gray-100 transition shadow-sm text-gray-600">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Edit Quiz</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <span>Configuration</span>
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                <span>{questions.length} Questions</span>
              </div>
            </div>
          </div>

          <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-2 ${getStatusColor(formik.values.status)}`}>
            <span className={`w-2 h-2 rounded-full ${formik.values.status === "published" ? "bg-emerald-500" : formik.values.status === "draft" ? "bg-amber-500" : "bg-rose-500"}`}></span>
            {formik.values.status}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* --- Settings Panel (Sticky) --- */}
          <div className="lg:col-span-4 lg:sticky lg:top-8">
            <div className="bg-white rounded-3xl shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                <Settings className="text-blue-600" size={18} />
                <h2 className="font-bold text-gray-900">Settings</h2>
              </div>

              <form onSubmit={formik.handleSubmit} className="p-6 space-y-5">
                
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Title</label>
                  <input
                    type="text"
                    {...formik.getFieldProps("title")}
                    className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none ${formik.touched.title && formik.errors.title ? "border-red-300 bg-red-50" : ""}`}
                  />
                  {formik.touched.title && formik.errors.title && <p className="text-red-500 text-xs mt-1">{formik.errors.title}</p>}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                  <select
                    {...formik.getFieldProps("status")}
                    className="w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="draft">Draft (Hidden)</option>
                    <option value="published">Published (Visible)</option>
                    <option value="closed">Closed (Ended)</option>
                  </select>
                </div>

                {/* Grid for Time/Marks */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Clock size={12} /> Time (min)
                    </label>
                    <input
                      type="number"
                      {...formik.getFieldProps("timeLimit")}
                      className="w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Hash size={12} /> Marks/Q
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      {...formik.getFieldProps("marksPerQuestion")}
                      className="w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Calendar size={12} /> Deadline
                  </label>
                  <input
                    type="datetime-local"
                    {...formik.getFieldProps("deadline")}
                    className="w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                  />
                  {formik.touched.deadline && formik.errors.deadline && <p className="text-red-500 text-xs mt-1">{formik.errors.deadline}</p>}
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={formik.isSubmitting}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {formik.isSubmitting ? "Saving..." : <><Save size={18} /> Update Settings</>}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* --- Questions List --- */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <LayoutList className="text-blue-600" size={24} /> Questions
              </h2>
              <button
                onClick={() => navigate(`add-question`)}
                className="bg-white border border-gray-200 hover:border-blue-300 hover:text-blue-600 text-gray-600 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-sm active:scale-95"
              >
                <Plus size={16} /> Add Question
              </button>
            </div>

            <div className="space-y-4">
              {questions.length === 0 ? (
                <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
                    <BookOpen size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">No questions yet</h3>
                  <p className="text-gray-500 mt-1">Start adding questions to build your quiz.</p>
                </div>
              ) : (
                questions.map((q, index) => (
                  <div key={q.id} className="group relative bg-white p-6 rounded-2xl shadow-md hover:shadow-md hover:border-blue-200 transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 font-bold rounded-lg text-sm">
                        {index + 1}
                      </span>
                      <div className="flex-grow">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">{q.questionText}</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {q.options.map((opt, i) => {
                            const isCorrect = i === q.correctOptionIndex;
                            return (
                              <div key={i} className={`text-sm px-4 py-3 rounded-xl border flex items-center gap-3 ${isCorrect ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-medium" : "bg-gray-50/50 border-gray-100 text-gray-600"}`}>
                                {isCorrect ? <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" /> : <div className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"></div>}
                                <span>{opt}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => navigate(`questions/${q.id}`)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { 
  Plus, Trash2, Save, LayoutList, BookOpen, 
  Clock, Calendar, CheckCircle2, AlertCircle, Hash, ArrowLeft 
} from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast"; // 🔔 1. Import Toast

// 👇 2. Import Standard Components
import LoadingSpinner from "../../../../component/LoadingSpinner";

// Helper function to create a fresh empty question
const createEmptyQuestion = () => ({
  questionText: "",
  options: ["", "", "", ""],
  correctOptionIndex: 0,
});

// Validation Schema
const QuizSchema = Yup.object().shape({
  title: Yup.string()
    .required("Quiz title is required.")
    .min(3, "Title must be at least 3 characters.")
    .max(255, "Title cannot exceed 255 characters."),
  courseId: Yup.string().required("Selecting a course is required."),
  timeLimitMinutes: Yup.number()
    .required("Time limit is required.")
    .min(1, "Must be at least 1 minute."),
  marksPerQuestion: Yup.number()
    .required("Marks per question is required.")
    .min(0.5, "Must be at least 0.5 marks."),
  deadline: Yup.string().required("A deadline is required."),
  questions: Yup.array()
    .of(
      Yup.object().shape({
        questionText: Yup.string().required("Question text is required."),
        options: Yup.array()
          .of(Yup.string().required("Option cannot be empty."))
          .min(2, "Must have at least two options."),
        correctOptionIndex: Yup.number().required(),
      })
    )
    .min(1, "You must create at least one question."),
});

export default function CreateQuiz() {
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const navigate = useNavigate();

  // 1. Fetch Courses (With Token)
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        const res = await axios.get(
          "http://localhost:5000/api/courses/getAllCourses",
          { 
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true 
          }
        );
        setCourses(res.data.courses || []);
      } catch (err) {
        console.error("Failed to fetch courses", err);
        if (err.response?.status === 401) {
          navigate("/login");
        }
        toast.error("Failed to load courses list.");
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, [navigate]);

  // 2. Formik Setup
  const formik = useFormik({
    initialValues: {
      title: "",
      courseId: "",
      timeLimitMinutes: "",
      marksPerQuestion: "",
      deadline: "",
      questions: [createEmptyQuestion()],
    },
    validationSchema: QuizSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      setSubmitting(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("You are logged out. Please login again.");
            navigate("/login");
            return;
        }

        const payload = {
          ...values,
          timeLimitMinutes: Number(values.timeLimitMinutes),
          marksPerQuestion: Number(values.marksPerQuestion),
          deadline: new Date(values.deadline).toISOString(),
        };

        await axios.post(
          "http://localhost:5000/api/quizzes/create-quiz",
          payload,
          { 
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }
        );
        
        toast.success("Quiz created successfully!");
        resetForm();
        navigate(-1); // Go back
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) {
          navigate("/login");
        } else {
          const msg = err.response?.data?.error || "Failed to create quiz";
          toast.error(msg);
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Handlers
  const handleAddQuestion = () => {
    const newQuestions = [...formik.values.questions, createEmptyQuestion()];
    formik.setFieldValue("questions", newQuestions);
  };

  const handleRemoveQuestion = (index) => {
    const newQuestions = formik.values.questions.filter((_, i) => i !== index);
    formik.setFieldValue("questions", newQuestions);
  };

  const handleQuestionChange = (qIndex, field, value) => {
    const newQuestions = [...formik.values.questions];
    if (field === "questionText") {
      newQuestions[qIndex].questionText = value;
    } else {
      newQuestions[qIndex].options[field] = value;
    }
    formik.setFieldValue("questions", newQuestions);
  };

  const handleCorrectOptionChange = (qIndex, optIndex) => {
    const newQuestions = [...formik.values.questions];
    newQuestions[qIndex].correctOptionIndex = optIndex;
    formik.setFieldValue("questions", newQuestions);
  };

  // ✅ Show loading spinner if courses aren't loaded yet
  if (loadingCourses) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-20">
      <form onSubmit={formik.handleSubmit} className="max-w-5xl mx-auto space-y-8">
        
        {/* --- Header --- */}
        <div className="flex items-center gap-4">
            <button 
                type="button"
                onClick={() => navigate(-1)} 
                className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition shadow-sm text-gray-600"
            >
                <ArrowLeft size={20} />
            </button>
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Create New Quiz</h1>
                <p className="text-gray-500 mt-1">Configure quiz settings and add questions below.</p>
            </div>
        </div>

        {/* --- Configuration Card --- */}
        <div className="bg-white rounded-3xl shadow-md overflow-hidden">
          <div className="bg-gray-50/50 px-8 py-4 border-b border-gray-100 flex items-center gap-2">
            <LayoutList className="text-blue-600" size={20} />
            <h2 className="font-bold text-gray-800">Quiz Details</h2>
          </div>
          
          <div className="p-8 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Quiz Title</label>
              <input
                type="text"
                name="title"
                {...formik.getFieldProps("title")}
                placeholder="e.g. Midterm Exam - Web Development"
                className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none ${
                  formik.touched.title && formik.errors.title ? "border-red-300 ring-4 ring-red-50" : ""
                }`}
              />
              {formik.touched.title && formik.errors.title && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={12}/> {formik.errors.title}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Course Select */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <BookOpen size={14} className="text-blue-500"/> Select Course
                </label>
                <div className="relative">
                  <select
                    name="courseId"
                    {...formik.getFieldProps("courseId")}
                    className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none appearance-none cursor-pointer ${
                      formik.touched.courseId && formik.errors.courseId ? "border-red-300" : ""
                    }`}
                  >
                    <option value="" disabled>Select course...</option>
                    {courses.map((c) => (
                      <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
                    ))}
                  </select>
                  {/* Custom Arrow */}
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
                {formik.touched.courseId && formik.errors.courseId && (
                  <p className="text-red-500 text-xs mt-1.5">{formik.errors.courseId}</p>
                )}
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Calendar size={14} className="text-green-500"/> Deadline
                </label>
                <input
                  type="datetime-local"
                  name="deadline"
                  {...formik.getFieldProps("deadline")}
                  className="w-full bg-gray-50 border rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                />
                {formik.touched.deadline && formik.errors.deadline && (
                  <p className="text-red-500 text-xs mt-1.5">{formik.errors.deadline}</p>
                )}
              </div>

              {/* Time Limit */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Clock size={14} className="text-orange-500"/> Time Limit (Minutes)
                </label>
                <input
                  type="number"
                  name="timeLimitMinutes"
                  {...formik.getFieldProps("timeLimitMinutes")}
                  placeholder="e.g. 60"
                  className="w-full bg-gray-50 border rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                />
                {formik.touched.timeLimitMinutes && formik.errors.timeLimitMinutes && (
                  <p className="text-red-500 text-xs mt-1.5">{formik.errors.timeLimitMinutes}</p>
                )}
              </div>

              {/* Marks */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Hash size={14} className="text-purple-500"/> Marks per Question
                </label>
                <input
                  type="number"
                  step="0.5"
                  name="marksPerQuestion"
                  {...formik.getFieldProps("marksPerQuestion")}
                  placeholder="e.g. 1.0"
                  className="w-full bg-gray-50 border rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                />
                {formik.touched.marksPerQuestion && formik.errors.marksPerQuestion && (
                  <p className="text-red-500 text-xs mt-1.5">{formik.errors.marksPerQuestion}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* --- Questions Section --- */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="bg-blue-600 text-white w-8 h-8 flex items-center justify-center rounded-lg text-sm">{formik.values.questions.length}</span>
              Questions
            </h2>
          </div>

          {formik.values.questions.map((q, i) => (
            <div key={i} className="bg-white p-6 md:p-8 rounded-3xl shadow-md relative group transition-all hover:shadow-md">
              
              {/* Remove Question Button */}
              {formik.values.questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(i)}
                  className="absolute top-6 right-6 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Remove Question"
                >
                  <Trash2 size={20} />
                </button>
              )}

              {/* Question Text Input */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Question {i + 1}</label>
                <input
                  type="text"
                  placeholder="Enter question text here..."
                  value={q.questionText}
                  onChange={(e) => handleQuestionChange(i, "questionText", e.target.value)}
                  className="w-full text-lg font-medium border-b-2 border-gray-100 py-2 focus:border-blue-500 outline-none transition-all placeholder-gray-300 bg-transparent"
                />
                {formik.errors.questions?.[i]?.questionText && (
                  <p className="text-red-500 text-xs mt-1">{formik.errors.questions[i].questionText}</p>
                )}
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {q.options.map((opt, idx) => (
                  <div 
                    key={idx} 
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      q.correctOptionIndex === idx 
                        ? 'border-emerald-400 bg-emerald-50 shadow-sm ring-1 ring-emerald-200' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    {/* Radio Button for Correct Answer */}
                    <div className="relative flex items-center">
                      <input
                        type="radio"
                        name={`correct-option-${i}`}
                        checked={q.correctOptionIndex === idx}
                        onChange={() => handleCorrectOptionChange(i, idx)}
                        className="w-5 h-5 text-emerald-600 border-gray-300 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                        title="Mark as correct"
                      />
                    </div>

                    {/* Option Text Input */}
                    <input
                      type="text"
                      value={opt}
                      placeholder={`Option ${idx + 1}`}
                      onChange={(e) => handleQuestionChange(i, idx, e.target.value)}
                      className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400 text-sm"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-gray-400 text-right italic flex justify-end items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-500"/> Select the radio button to mark correct answer
              </div>
            </div>
          ))}

          {/* Add Question Button */}
          <button
            type="button"
            onClick={handleAddQuestion}
            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-3xl text-gray-500 font-bold hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2 group"
          >
            <div className="bg-gray-200 group-hover:bg-blue-100 text-inherit w-8 h-8 rounded-full flex items-center justify-center transition-colors">
              <Plus size={18} />
            </div>
            Add Another Question
          </button>
        </div>

        {/* --- Submit Actions (Sticky Footer) --- */}
        <div className="sticky bottom-6 z-10 flex justify-end">
          <div className="bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-gray-200 flex gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formik.isSubmitting}
              className={`px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition flex items-center gap-2 transform active:scale-95 ${
                formik.isSubmitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {formik.isSubmitting ? (
                "Creating..."
              ) : (
                <>
                  <Save size={18} /> Create Quiz
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
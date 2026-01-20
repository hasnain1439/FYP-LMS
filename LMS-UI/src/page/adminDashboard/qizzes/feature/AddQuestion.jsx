import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast"; // 🔔 1. Import Toast
import { 
  Save, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  HelpCircle, 
  CheckCircle2 
} from "lucide-react";

export default function AddQuestion() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  
  // Initial State
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);

  // --- Handlers ---

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      
      // Adjust correct index if the removed option affects it
      if (correctOptionIndex === index) {
        setCorrectOptionIndex(0); 
      } else if (correctOptionIndex > index) {
        setCorrectOptionIndex(correctOptionIndex - 1);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    // Validation
    if (!questionText.trim()) {
      toast.error("Question text cannot be empty."); // 🔔 Error Toast
      setSaving(false);
      return;
    }
    if (options.some(opt => !opt.trim())) {
      toast.error("All answer options must be filled."); // 🔔 Error Toast
      setSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You are logged out. Please login again.");
        navigate("/login");
        return;
      }

      const payload = {
        questionText,
        options,
        correctOptionIndex
      };

      await axios.post(
        `http://localhost:5000/api/quizzes/${quizId}/add-question`,
        payload,
        { 
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true 
        }
      );

      // 🔔 Success Toast
      toast.success("Question added successfully!");
      
      // On success, go back
      navigate(-1); 
    } catch (err) {
      console.error("Add question error:", err);
      const msg = err.response?.data?.error || "Failed to add question.";
      
      if (err.response?.status === 401) {
        navigate("/login");
      }
      
      // 🔔 Error Toast
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center py-10 px-4 font-sans">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-lg overflow-hidden">
        
        {/* Header */}
        <div className="bg-gray-50/50 px-8 py-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition shadow-sm text-gray-600"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add Question</h2>
              <p className="text-sm text-gray-500">New multiple choice question</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* Question Text Section */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <HelpCircle size={14} className="text-blue-500" /> Question Text
            </label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full bg-gray-50 border rounded-xl p-4 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none resize-none min-h-[120px]"
              placeholder="e.g. What is the output of console.log(typeof null)?"
              autoFocus
            />
          </div>

          {/* Options Section */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-500" /> Answer Options
              </label>
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">
                Select Correct Answer
              </span>
            </div>

            <div className="space-y-3">
              {options.map((option, index) => (
                <div 
                  key={index} 
                  className={`flex items-center gap-3 p-1 rounded-xl transition-all ${
                    correctOptionIndex === index 
                      ? 'bg-green-50/50 ring-1 ring-green-100' 
                      : ''
                  }`}
                >
                  {/* Radio Button */}
                  <div className="relative flex items-center justify-center pl-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={correctOptionIndex === index}
                      onChange={() => setCorrectOptionIndex(index)}
                      className="w-5 h-5 text-green-600 border-gray-300 focus:ring-green-500 cursor-pointer accent-green-600"
                      title="Mark as correct answer"
                    />
                  </div>

                  {/* Option Input */}
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className={`flex-1 bg-white border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-gray-700 placeholder-gray-400 ${
                      correctOptionIndex === index 
                        ? 'border-green-300 ring-2 ring-green-50' 
                        : ''
                    }`}
                    placeholder={`Option ${index + 1}`}
                  />

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    disabled={options.length <= 2}
                    className={`p-2 rounded-lg transition ${
                      options.length <= 2 
                        ? "text-gray-300 cursor-not-allowed" 
                        : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                    }`}
                    title="Remove option"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Option Button */}
            {options.length < 6 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-4 text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-blue-50 transition"
              >
                <Plus size={16} /> Add Option
              </button>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={saving}
              className={`px-8 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200 transition disabled:opacity-70 flex items-center gap-2 ${
                saving ? "cursor-not-allowed" : ""
              }`}
            >
              {saving ? (
                "Saving..."
              ) : (
                <>
                  <Save size={18} /> Create Question
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
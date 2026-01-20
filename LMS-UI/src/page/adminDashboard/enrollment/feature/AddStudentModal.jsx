import React, { useState, useEffect } from "react";
import { FaTimes, FaUser, FaBook } from "react-icons/fa";
import toast from "react-hot-toast"; // 🔔 1. Import Toast

export default function AddStudentModal({ isOpen, onClose, onSubmitAPI, courses = [] }) {
  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset fields when modal opens
  useEffect(() => {
    if (isOpen) {
      setStudentId("");
      setCourseId("");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Pass an object to match the service expectation
      await onSubmitAPI({ studentId, courseId });
      
      // 🔔 Success Notification
      toast.success("Student enrolled successfully!");
      
      onClose();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data?.error;
      
      let errorMsg = "Failed to enroll. Please check the IDs.";
      
      if (err.response && err.response.status === 409) {
        errorMsg = "Student is already enrolled in this course.";
      } else if (msg) {
        errorMsg = msg;
      }

      setError(errorMsg);
      // 🔔 Error Notification
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Enroll Student</h3>
            <p className="text-sm text-gray-500 mt-1">Add a student to a course session.</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-red-500 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 animate-pulse">
              <span>⚠️</span> {error}
            </div>
          )}
          
          {/* Student ID Input */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Student ID (UUID)</label>
            <div className="relative group">
              <FaUser className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                required 
                type="text" 
                className="w-full bg-gray-50 border border-transparent rounded-xl py-3 pl-10 pr-4 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" 
                value={studentId} 
                onChange={(e) => setStudentId(e.target.value)} 
                placeholder="e.g. 550e8400..." 
              />
            </div>
          </div>

          {/* Course Selection (Dropdown or Input) */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Course</label>
            <div className="relative group">
              <FaBook className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              
              {courses && courses.length > 0 ? (
                // If courses prop is provided, show dropdown
                <select
                  required
                  className="w-full bg-gray-50 border border-transparent rounded-xl py-3 pl-10 pr-4 text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none appearance-none cursor-pointer"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                >
                  <option value="">-- Choose a Course --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                // Fallback to manual ID input
                <input 
                  required 
                  type="text" 
                  className="w-full bg-gray-50 border border-transparent rounded-xl py-3 pl-10 pr-4 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" 
                  value={courseId} 
                  onChange={(e) => setCourseId(e.target.value)} 
                  placeholder="e.g. 123e4567..." 
                />
              )}
              
              {/* Dropdown Arrow Icon (Only if select is used) */}
              {courses && courses.length > 0 && (
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Processing...
                </span>
              ) : (
                "Enroll Student"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
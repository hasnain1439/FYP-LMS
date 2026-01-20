import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaSync, FaExclamationCircle } from "react-icons/fa";
import toast from "react-hot-toast"; // 🔔 Import Toast

// 👇 Import Standard Components
import LoadingSpinner from "../../../../component/LoadingSpinner";
import EmptyState from "../../../../component/EmptyState";
import CourseCard from "./CourseCard"; 

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ActiveCoursesGrid = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchStudentCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("auth");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${BACKEND_URL}/api/courses/student/my-courses`, 
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setCourses(response.data.courses || []);

    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error("Failed to load courses.");
      
      if (err.response) {
        if (err.response.status === 401) setError("auth");
        else if (err.response.status === 404) setError("404");
        else setError("server");
      } else {
        setError("network");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentCourses();
  }, []);

  const handleContinue = (courseId) => {
    navigate(`/student/my-course/${courseId}`);
  };

  // --- RENDER STATES ---

  if (loading) return <LoadingSpinner />;

  // Auth Error (401)
  if (error === "auth") {
    return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <FaExclamationCircle className="text-3xl text-red-500 mx-auto mb-3" />
            <h3 className="text-red-800 font-bold">Session Expired</h3>
            <p className="text-gray-600 mb-4 text-sm">Please log in again to continue.</p>
            <button 
                onClick={() => navigate('/login')}
                className="bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-red-700"
            >
                Log In
            </button>
        </div>
    );
  }

  // Network/Server Error
  if (error) {
    return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <h3 className="text-yellow-800 font-bold mb-2">Something went wrong</h3>
            <p className="text-gray-600 mb-4 text-sm">Could not connect to the server.</p>
            <button 
                onClick={fetchStudentCourses}
                className="flex items-center justify-center gap-2 mx-auto bg-yellow-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-700"
            >
                <FaSync /> Retry
            </button>
        </div>
    );
  }

  // Empty State
  if (courses.length === 0) {
    return (
      <EmptyState 
        message="You haven't enrolled in any courses yet." 
      />
    );
  }

  // Success State (Grid)
  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">My Active Courses</h2>
        <button
          onClick={() => navigate("/student/my-courses")}
          className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
        >
          View All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.slice(0, 3).map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            type="student"
            onAction={handleContinue}
          />
        ))}
      </div>
    </section>
  );
};

export default ActiveCoursesGrid;
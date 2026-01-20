import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Library,
  AlertTriangle,
  WifiOff,
  RefreshCw
} from "lucide-react";
import toast from "react-hot-toast"; // 🔔 1. Import Toast

// 👇 2. Import Standard Components
import LoadingSpinner from "../../../../component/LoadingSpinner";
import EmptyState from "../../../../component/EmptyState";

// 👇 Ensure this path is correct for your project
import CourseCard from "../../studentDashboard/feature/CourseCard";

// ✅ 3. Use Environment Variable
const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function MyCoursesSection() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // 'auth', 'server', 'network'
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();

  // --- Fetch Logic ---
  const fetchCourses = async () => {
    setLoading(true);
    setError(null);

    try {
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
      toast.error("Failed to load your courses."); // 🔔 Error Toast

      if (!err.response) {
        setError("network");
      } else if (err.response.status === 401 || err.response.status === 403) {
        setError("auth");
      } else {
        setError("server");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Filter courses based on search
  const filteredCourses = courses.filter((course) =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Render Helpers ---

  // 1. Standard Loading
  if (loading) return <LoadingSpinner />;

  // 2. Auth Error View
  if (error === "auth") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50/50 p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center max-w-md">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-amber-500 w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Session Expired
          </h3>
          <p className="text-gray-500 mb-6">
            Your session has expired. Please log in again to access your
            learning dashboard.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-all shadow-md shadow-amber-200"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // 3. Network/Server Error View
  if (error === "network" || error === "server") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50/50 p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <WifiOff className="text-red-500 w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Connection Error
          </h3>
          <p className="text-gray-500 mb-6">
            {error === "network"
              ? "We couldn't reach the server. Please check your internet connection."
              : "Something went wrong on our end. Please try again later."}
          </p>
          <button
            onClick={fetchCourses}
            className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all shadow-md shadow-red-200 flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} /> Retry
          </button>
        </div>
      </div>
    );
  }

  // 4. Main Success View
  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-800">
      <div className="w-full space-y-8">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              <Library className="text-blue-600" size={28} />
              My Learning
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              You are currently enrolled in{" "}
              <span className="font-semibold text-gray-800">
                {courses.length}
              </span>{" "}
              courses
            </p>
          </div>

          <div className="relative w-full md:w-80 group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="Search my courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:bg-white outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* --- Content Grid or Empty State --- */}
        {courses.length === 0 ? (
          // ✅ Standard Empty State (No Courses Enrolled)
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12">
            <EmptyState 
                message="You haven't enrolled in any courses yet. Browse the catalog to start your learning journey!" 
            />
            <div className="text-center mt-6">
                <button
                onClick={() => navigate("/student/courses")}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-200 active:scale-95"
                >
                Browse Catalog
                </button>
            </div>
          </div>
        ) : (
          <>
            {filteredCourses.length === 0 ? (
              // ✅ Standard Empty State (Search No Results)
              <div className="bg-white rounded-2xl border border-gray-200 p-12">
                 <EmptyState message={`We couldn't find any courses matching "${searchTerm}"`} />
                 <div className="text-center mt-4">
                    <button
                        onClick={() => setSearchTerm("")}
                        className="text-blue-600 font-medium hover:underline"
                    >
                        Clear search
                    </button>
                 </div>
              </div>
            ) : (
              // ✅ Course Grid
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    type="student"
                    onAction={(id) => navigate(`/student/my-course/${id}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
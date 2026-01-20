import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Search, Filter, MonitorPlay, ChevronDown, 
} from "lucide-react";
import toast from "react-hot-toast"; // 🔔 1. Import Toast

// 👇 Import Standard Components
import LoadingSpinner from "../../../../component/LoadingSpinner";
import EmptyState from "../../../../component/EmptyState";

// 👇 Import the NEW card component
import PublicCourseCard from "./PublicCourseCard";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function BrowseCourses() {
  const [courses, setCourses] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  // Track which specific course ID is currently processing an action (join/leave)
  const [processingId, setProcessingId] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // --- 1. Fetch Data (Catalog AND Existing Enrollments) ---
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // A. Fetch the public catalog
      const catalogReq = axios.get(`${BACKEND_URL}/api/courses/getAllCourses`, {
        params: { search: searchTerm }
      });

      // B. Fetch student's existing enrollments (if logged in) to check status
      let enrolledReq = Promise.resolve({ data: { courses: [] } });
      if (token) {
        enrolledReq = axios.get(`${BACKEND_URL}/api/courses/student/my-courses`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      // Run both requests in parallel
      const [catalogRes, enrolledRes] = await Promise.all([catalogReq, enrolledReq]);

      setCourses(catalogRes.data.courses || []);

      // Create a Set of IDs for efficient lookup later: Set { 'course-id-1', 'course-id-2' }
      const myIds = new Set(enrolledRes.data.courses.map(c => c.id));
      setEnrolledCourseIds(myIds);

    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please check your connection.");
      toast.error("Failed to load courses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);


  // --- 2. Handlers (Join, Leave, View) ---

  const handleView = (courseId) => {
      navigate(`/student/course-details/${courseId}`);
  }

  const handleJoin = async (courseId, courseName) => {
    if (!token) { 
        toast.error("Please log in to join courses.");
        navigate("/login"); 
        return; 
    }
    
    if (!window.confirm(`Join "${courseName}"?`)) return;

    setProcessingId(courseId);
    try {
      await axios.post(
        `${BACKEND_URL}/api/courses/${courseId}/enroll`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`Successfully joined ${courseName}!`);
      
      // Update local state to reflect change immediately
      setEnrolledCourseIds(prev => new Set(prev).add(courseId));
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to join.";
      toast.error(msg);
    } finally {
      setProcessingId(null);
    }
  };

  const handleLeave = async (courseId, courseName) => {
    if (!token) return;
    
    const confirmStr = `Are you sure you want to LEAVE "${courseName}"?\n\nYou will lose progress and have to rejoin.`;
    if (!window.confirm(confirmStr)) return;

    setProcessingId(courseId);
    try {
      await axios.delete(
        `${BACKEND_URL}/api/courses/${courseId}/enroll`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`You have left ${courseName}.`);
      
       // Update local state by removing the ID
       setEnrolledCourseIds(prev => {
         const newSet = new Set(prev);
         newSet.delete(courseId);
         return newSet;
       });
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to leave course.";
      toast.error(msg);
    } finally {
      setProcessingId(null);
    }
  };


  // --- Filtering Logic ---
  const categories = ["All", ...new Set(courses.flatMap(c => c.categories || []))];
  const filteredCourses = selectedCategory === "All"
    ? courses
    : courses.filter(c => c.categories?.includes(selectedCategory));


  // --- Render ---
  
  // 1. Initial Loading
  if (loading && courses.length === 0) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-800">
      <div className="w-full space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col gap-6">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                <MonitorPlay className="text-blue-600" size={32} />
                Browse Courses
              </h1>
              <p className="text-gray-500 mt-2 text-base max-w-2xl">
                Explore our catalog. Join new courses or manage existing ones.
              </p>
            </div>
            {/* Search Bar */}
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:bg-white outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Filter Dropdown */}
          <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-200 shadow-sm w-full sm:w-auto self-start">
             <div className="flex items-center gap-2 text-gray-500 pl-2 text-sm font-medium">
              <Filter size={18} /> <span>Filter by:</span>
            </div>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium cursor-pointer hover:bg-gray-100 transition-colors min-w-[160px]"
              >
                {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-center text-red-700 font-medium">
             {error}
          </div>
        )}

        {/* Course Grid */}
        {filteredCourses.length === 0 && !loading ? (
          // ✅ Standard Empty State
          <div className="py-12">
             <EmptyState 
                message="No courses found matching your search." 
             />
             <div className="text-center mt-4">
                <button 
                    onClick={() => { setSearchTerm(""); setSelectedCategory("All"); }} 
                    className="text-blue-600 font-semibold hover:underline"
                >
                  Clear all filters
                </button>
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
               // Check enrollment status efficiently using the Set
               const isEnrolled = enrolledCourseIds.has(course.id);
               
               return (
                <PublicCourseCard
                  key={course.id}
                  course={course}
                  // Pass enrollment status down
                  isEnrolled={isEnrolled} 
                  // Pass handlers
                  onJoin={() => handleJoin(course.id, course.name)}
                  onLeave={() => handleLeave(course.id, course.name)}
                  onView={() => handleView(course.id)}
                  // Only show loading on the specific card being acted upon
                  isProcessingAction={processingId === course.id} 
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
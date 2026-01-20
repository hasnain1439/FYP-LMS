import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  Clock, UserCircle2, BookOpen, Calendar, 
  CheckCircle2, ArrowLeft, Loader2, Share2, AlertCircle 
} from "lucide-react";
import LoadingSpinner from "../../../../component/LoadingSpinner";

export default function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false); // ✅ New State
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // 1. Fetch Public Course Details
        const courseRes = await axios.get(`http://localhost:5000/api/courses/${courseId}`);
        setCourse(courseRes.data.course);

        // 2. Check if Student is Already Enrolled
        if (token) {
          const myCoursesRes = await axios.get(
            "http://localhost:5000/api/courses/student/my-courses", 
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          // Check if this course ID exists in my courses list
          const myCourses = myCoursesRes.data.courses || [];
          const isFound = myCourses.some(c => c.id === courseId);
          setIsEnrolled(isFound);
        }

      } catch (err) {
        console.error(err);
        setError("Failed to load course details.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId]);

  const handleEnroll = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to enroll.");
      return navigate("/login");
    }

    if (!window.confirm(`Enroll in "${course.name}"?`)) return;

    setEnrolling(true);
    try {
      await axios.post(
        `http://localhost:5000/api/courses/${courseId}/enroll`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // ✅ Success: Just update the UI state, don't redirect to learning page
      alert("Successfully enrolled!");
      setIsEnrolled(true); 

    } catch (err) {
      // If backend says "Already enrolled", just update the UI
      if (err.response && err.response.data.error?.includes("Already enrolled")) {
        setIsEnrolled(true);
        alert("You are already enrolled in this course.");
      } else {
        alert(err.response?.data?.error || "Enrollment failed");
      }
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error || !course) return <div className="p-10 text-center text-red-500">{error || "Course not found"}</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      {/* --- Hero Section --- */}
      <div className="bg-blue-600 text-white rounded-xl p-6">
        <div className="max-w-7xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-blue-100 hover:text-white mb-6 transition">
            <ArrowLeft size={20} /> Back to Catalog
          </button>
          
          <div className="flex flex-wrap gap-3 mb-4">
            {course.categories?.map((cat, i) => (
              <span key={i} className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold tracking-wide">
                {cat}
              </span>
            ))}
          </div>
          
          <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight max-w-4xl">
            {course.name}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-blue-100 text-sm md:text-base">
            <div className="flex items-center gap-2">
              <UserCircle2 size={20} />
              <span>By {course.teacher?.firstName} {course.teacher?.lastName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={20} />
              <span>{course.totalSessions} Sessions</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={20} />
              <span>Created {new Date(course.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- Main Content --- */}
      <div className="max-w-7xl mx-auto px-6 -mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="text-blue-500" /> About this Course
            </h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
              {course.description || "No detailed description provided."}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Class Schedule</h2>
            <div className="space-y-4">
              {course.schedules?.length > 0 ? (
                course.schedules.map((sch) => (
                  <div key={sch.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold">
                        {sch.dayOfWeek}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Weekly Session</p>
                        <p className="text-sm text-gray-500">Day {sch.dayOfWeek}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700">
                        {sch.startTime} - {sch.endTime}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic">No schedule information available.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Action Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-lg sticky top-8">
            <div className="mb-6 pb-6 border-b border-gray-100">
              <span className="text-sm text-gray-500 font-medium uppercase tracking-wider">Total Enrolled</span>
              <div className="text-3xl font-bold text-gray-900 mt-1">{course.enrollmentCount || 0}</div>
              
              {/* Status Badge */}
              <p className={`text-sm mt-2 flex items-center gap-1 font-medium ${isEnrolled ? "text-green-600" : "text-blue-600"}`}>
                {isEnrolled ? (
                  <><CheckCircle2 size={16} /> You are enrolled</>
                ) : (
                  <><AlertCircle size={16} /> Course is open</>
                )}
              </p>
            </div>

            {/* ✅ FIXED BUTTON LOGIC */}
            {isEnrolled ? (
              <button
                disabled
                className="w-full py-4 bg-green-50 border border-green-200 text-green-700 text-lg font-bold rounded-xl flex items-center justify-center gap-2 cursor-default"
              >
                <CheckCircle2 size={20} /> Already Enrolled
              </button>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-xl shadow-blue-200 shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {enrolling ? <Loader2 className="animate-spin" /> : "Enroll Now"}
              </button>
            )}

            <p className="text-xs text-gray-400 text-center mt-4">
              30-day money-back guarantee (Mock)
            </p>
            
            <button className="w-full mt-4 py-2 text-gray-500 font-medium hover:text-blue-600 flex items-center justify-center gap-2 transition">
              <Share2 size={16} /> Share this course
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
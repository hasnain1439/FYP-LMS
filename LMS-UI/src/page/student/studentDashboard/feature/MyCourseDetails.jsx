import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  ArrowLeft, BookOpen, Calendar, Users, 
  Layers, CheckCircle2, AlertCircle 
} from "lucide-react";
import toast from "react-hot-toast"; // 🔔 Import Toast

// 👇 Import Standard Component
import LoadingSpinner from "../../../../component/LoadingSpinner";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function MyCourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        const res = await axios.get(
          `${BACKEND_URL}/api/courses/${courseId}`, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setCourse(res.data.course);
      } catch (err) {
        console.error("Error fetching course:", err);
        setError("Failed to load course details.");
        toast.error("Failed to load course.");
      } finally {
        setLoading(false);
      }
    };

    if (courseId) fetchCourseDetails();
  }, [courseId, navigate]);

  // Loading State
  if (loading) return <LoadingSpinner />;

  // Error State
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-sm">
        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Error</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all w-full">
          Go Back
        </button>
      </div>
    </div>
  );

  if (!course) return null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-20">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* --- Header Section --- */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2.5 bg-white rounded-xl hover:bg-gray-100 transition shadow-md text-gray-600"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{course.name}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <span className="font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                {course.categories?.[0] || "General"}
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              <span>Created on {new Date(course.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- Left Column: Main Content --- */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Description Card */}
            <div className="bg-white p-8 rounded-3xl shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="text-blue-500" size={20} /> About Course
              </h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {course.description || "No description provided."}
              </p>
            </div>

            {/* Curriculum / Schedule */}
            <div className="bg-white p-8 rounded-3xl shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Calendar className="text-orange-500" size={20} /> Schedule
              </h2>
              
              {course.schedules && course.schedules.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {course.schedules.map((sch) => {
                    const days = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
                    return (
                      <div key={sch.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                          {days[sch.dayOfWeek].substring(0, 3)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{days[sch.dayOfWeek]}</p>
                          <p className="text-sm text-gray-500">{sch.startTime} - {sch.endTime}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-400 italic">No schedule set for this course.</p>
              )}
            </div>
          </div>

          {/* --- Right Column: Stats & Actions --- */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-md">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Course Stats</h3>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <Layers size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Sessions</p>
                    <p className="text-lg font-bold text-gray-900">{course.totalSessions}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Enrolled Students</p>
                    <p className="text-lg font-bold text-gray-900">{course.enrollmentCount || 0}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Status</p>
                    <p className="text-lg font-bold text-gray-900">Active</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
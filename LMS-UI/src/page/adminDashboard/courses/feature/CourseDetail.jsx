import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { GetCourseById } from "../../../../api/GetCourseById";
import { FaBookOpen, FaCalendarAlt, FaClock } from "react-icons/fa";
import toast from "react-hot-toast"; // 🔔 1. Import Toast

// 👇 2. Import Standard Components
import LoadingSpinner from "../../../../component/LoadingSpinner";
import EmptyState from "../../../../component/EmptyState";

export default function CourseDetail() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) {
        setError("Invalid course ID");
        setLoading(false);
        return;
      }

      try {
        const data = await GetCourseById(courseId);
        // Normalization logic
        const normalizedCourse = {
          ...data,
          courseCurriculum: Array.isArray(data.courseCurriculum)
            ? data.courseCurriculum
            : data.courseCurriculum
            ? [data.courseCurriculum]
            : [],
          schedules: Array.isArray(data.schedules)
            ? data.schedules
            : data.schedules
            ? [data.schedules]
            : [],
        };
        setCourse(normalizedCourse);
      } catch (err) {
        console.error("Error fetching course:", err);
        setError("Failed to load course");
        // 🔔 Error Notification
        toast.error("Failed to load course details.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  // ✅ 3. Standard Loading
  if (loading) return <LoadingSpinner />;

  // ✅ 4. Standard Empty/Error State
  if (error || !course) {
    return <EmptyState message={error || "Course not found"} />;
  }

  return (
    <div className="w-full space-y-8 font-sans text-gray-800">
      
      {/* Hero Section */}
      <div className="bg-white rounded-3xl p-8 shadow-md">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">{course.name}</h1>
                <div className="flex flex-wrap gap-2 mt-3">
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-blue-100">
                        {Array.isArray(course.categories) ? course.categories.join(", ") : course.categories}
                    </span>
                    <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-green-100">
                        {course.totalSessions || 0} Weeks Duration
                    </span>
                </div>
            </div>
        </div>
        <p className="text-gray-600 text-lg leading-relaxed mt-4">
            {course.description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Curriculum Column */}
        <div className="md:col-span-2">
            <div className="bg-white rounded-3xl shadow-md overflow-hidden h-full">
                <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm text-blue-600">
                        <FaBookOpen />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">Curriculum</h2>
                </div>
                <div className="p-8">
                    <ul className="space-y-4">
                    {course.courseCurriculum.length > 0 ? (
                        course.courseCurriculum.map((topic, index) => (
                        <li key={index} className="flex gap-4 items-start group">
                            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full font-bold text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                {index + 1}
                            </span>
                            <span className="text-gray-700 leading-relaxed pt-1 group-hover:text-gray-900 transition-colors">
                                {topic}
                            </span>
                        </li>
                        ))
                    ) : (
                        <li className="text-gray-400 italic text-center py-4">No curriculum items added yet.</li>
                    )}
                    </ul>
                </div>
            </div>
        </div>

        {/* Schedule Column */}
        <div className="md:col-span-1">
             <div className="bg-white rounded-3xl shadow-md overflow-hidden h-full">
                <div className="px-6 py-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm text-green-600">
                        <FaCalendarAlt />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">Schedule</h2>
                </div>
                <div className="p-6">
                    <ul className="space-y-3">
                    {course.schedules.length > 0 ? (
                        course.schedules.map((s, index) => (
                        <li key={index} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-all">
                            <div className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                {daysOfWeek[s.dayOfWeek] || "Unknown"}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-3 py-1.5 rounded-lg border border-gray-100 w-fit">
                                <FaClock className="text-gray-400 text-xs" />
                                <span>{s.startTime} - {s.endTime}</span>
                            </div>
                        </li>
                        ))
                    ) : (
                        <li className="text-gray-400 italic text-center py-4">No schedules set.</li>
                    )}
                    </ul>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}
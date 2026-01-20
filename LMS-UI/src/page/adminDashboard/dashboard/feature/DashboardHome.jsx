import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  LuBookOpen,
  LuFileQuestion,
  LuUserCheck,
  LuUsers,
} from "react-icons/lu";
import StatCard from "../../../../component/StatCard"; // Adjust path
import LineCharts from "./LineChart";
import EnrollmentCharts from "./EnrollmentStatusCharts";
import RecentActiveStudent from "./RecentActiveStudent";
import TeacherLiveSchedule from "./TeacherLiveSchedule";
import RecentAttendance from "../../teacherAttendance/TeacherAttendance"; // ✅ Import the new widget
import toast from "react-hot-toast";
import LoadingSpinner from "../../../../component/LoadingSpinner"; // Adjust path
import EmptyState from "../../../../component/EmptyState"; // Adjust path
import { UserContext } from "../../../../context/ContextApi";

// Configuration
const BACKEND_URL = "http://localhost:5000";
const FALLBACK_IMAGE = "https://ui-avatars.com/api/?name=User&background=random&color=fff";

export default function DashboardHome() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Stable Image Helper
  const getProfileImage = (url) => {
    if (!url || url === "undefined" || url === "null") {
      return FALLBACK_IMAGE;
    }
    if (url.startsWith("http") || url.startsWith("blob")) return url;
    return `${BACKEND_URL}${url}`;
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || token === "undefined") {
      navigate("/login");
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDashboardData(response.data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
        
        if (error.response?.status !== 401) {
            const errorMsg = error.response?.data?.message || "Failed to fetch dashboard stats";
            toast.error(errorMsg);
        }

        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <LoadingSpinner />;
  
  if (!dashboardData) {
     return <EmptyState message="Failed to load dashboard data." />;
  }

  const { stats, charts, recentActivity } = dashboardData;

  const statCards = [
    { title: "Total Courses", value: stats.totalCourses, status: "Overview", icon: <LuUsers size={20} /> },
    { title: "Total Quizzes", value: stats.totalQuizzes, status: "Overview", icon: <LuBookOpen size={20} /> },
    { title: "Students Enrolled", value: stats.totalStudents, status: "Overview", icon: <LuFileQuestion size={20} /> },
    { title: "Pending Grading", value: stats.pendingGrading, status: "Action needed", icon: <LuUserCheck size={20} /> },
  ];

  return (
    <div className="space-y-8 font-sans text-gray-800">
      
      {/* Welcome Header */}
      <div className="bg-white p-8 rounded-3xl shadow-md flex flex-col sm:flex-row items-center gap-6">
        <img
          src={getProfileImage(user?.profilePicture || user?.profile_picture)}
          alt="Profile"
          className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-lg"
          onError={(e) => {
             if (e.target.src !== FALLBACK_IMAGE) {
                e.target.src = FALLBACK_IMAGE;
             }
          }}
        />

        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Welcome back, {user?.firstName || "Teacher"}!
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            Here is an overview of your students' performance today.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((s, i) => (
          <StatCard key={i} title={s.title} value={s.value} status={s.status} icon={s.icon} />
        ))}
      </div>

      {/* Live Schedule */}
      <TeacherLiveSchedule data={dashboardData.schedule} />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex-1 w-full min-h-[300px]">
          <LineCharts data={charts.enrollmentTrend} />
        </div>
        <div className="flex-1 w-full min-h-[300px]">
          <EnrollmentCharts data={charts.enrollmentStatus} />
        </div>
      </div>

      {/* ✅ NEW: Activity & Attendance Section */}
      <div className="grid grid-cols-1 gap-6">
         {/* Live Attendance Feed */}
         <div className="flex-1 w-full h-full">
            <RecentAttendance />
         </div>
         
         {/* Recent Enrollments/Activity */}
         <div className="flex-1 w-full h-full">
            <RecentActiveStudent data={recentActivity} />
         </div>
      </div>
    </div>
  );
}
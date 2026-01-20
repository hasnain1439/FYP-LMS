import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaBookOpen,
  FaCheckCircle,
  FaChartBar,
} from "react-icons/fa";
import toast from "react-hot-toast"; // 🔔 Import Toast

// 👇 Import Standard Components
import LoadingSpinner from "../../../../component/LoadingSpinner";
import StatCard from "../../../../component/StatCard";

// Sub-components
import LiveSchedule from "./LiveSchedule";
import ActiveCoursesGrid from "./ActiveCoursesGrid";
import UpcomingDeadlines from "./UpcomingDeadlines";

// ✅ Use Environment Variable
const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Helper to handle profile image URLs
const getProfileImage = (path) => {
  if (!path) return "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
  if (path.startsWith("http")) return path;
  return `${BACKEND_URL}${path}`;
};

function StdDashboardSection() {
  const [dashboardData, setDashboardData] = useState(null);
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // Parallel Fetch
        const [dashboardRes, profileRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/dashboard/student`, { headers }),
          axios.get(`${BACKEND_URL}/api/auth/profile`, { headers }),
        ]);

        setDashboardData(dashboardRes.data);
        setUser(profileRes.data.user); 
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load dashboard data.");
        toast.error("Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- LOADING STATE ---
  if (loading) return <LoadingSpinner />;

  // --- ERROR STATE ---
  if (error) {
    return <div className="p-4 text-red-500 bg-red-50 rounded-lg text-center">{error}</div>;
  }

  // --- STATS DATA ---
  const stats = [
    {
      title: "Courses in Progress",
      value: dashboardData?.stats?.inProgress || 0,
      icon: <FaBookOpen />,
    },
    {
      title: "Completed Courses",
      value: dashboardData?.stats?.completed || 0,
      icon: <FaCheckCircle />,
    },
    {
      title: "Average Grade",
      value: `${dashboardData?.stats?.averageGrade || 0}%`,
      icon: <FaChartBar />,
    },
  ];

  return (
    <div className="space-y-8 pb-10 font-sans text-gray-800">
      
      {/* 1. Welcome Section */}
      <div className="bg-white p-8 rounded-3xl shadow-md flex flex-col sm:flex-row items-center gap-6">
        <img
          src={getProfileImage(user?.profilePicture)}
          alt="Profile"
          className="w-20 h-20 rounded-full object-cover border-4 border-blue-50 shadow-sm"
          onError={(e) => {
            e.target.src = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
          }}
        />
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Welcome back, <span className="text-blue-600">{user?.firstName || "Student"}!</span>
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            Here is an overview of your learning progress today.
          </p>
        </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            status="Overview"
            icon={stat.icon}
          />
        ))}
      </div>

      {/* 3. Live Schedule */}
      <LiveSchedule data={dashboardData?.schedule || []} />

      {/* 4. Active Courses */}
      <ActiveCoursesGrid />

      {/* 5. Upcoming Deadlines */}
      <UpcomingDeadlines data={dashboardData?.deadlines || []} />
    </div>
  );
}

export default StdDashboardSection;
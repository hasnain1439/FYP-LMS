import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaEnvelope, FaIdBadge, FaUserCheck, FaCalendarAlt,
  FaPen, FaKey, FaSignOutAlt, FaBriefcase, FaGraduationCap
} from "react-icons/fa";
import { logout } from "../../../../component/LogoutButton"; 

// 👇 1. Import Standard Components
import LoadingSpinner from "../../../../component/LoadingSpinner";
import EmptyState from "../../../../component/EmptyState";

// ✅ 2. Use Environment Variable (Fallback to localhost if not set)
const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // --- 1. Fetch Profile Logic ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");

        // A. Security Check
        if (!token) {
          navigate("/login");
          return;
        }

        // B. API Call
        const response = await axios.get(
          `${BACKEND_URL}/api/auth/profile`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setUser(response.data.user);
      } catch (err) {
        console.error("Failed to load profile:", err);

        // C. Error Handling: Force Logout on 401/403
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          await logout(); // Use your imported utility
          navigate("/login");
        } else {
          setError("Failed to load profile data.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  // --- ✅ HELPER: Strict Image Safety Check ---
  const getProfileImage = (url) => {
    if (!url || url === "undefined" || url === "null") {
      return "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
    }
    if (url.startsWith("http") || url.startsWith("blob")) return url;
    return `${BACKEND_URL}${url}?t=${new Date().getTime()}`;
  };

  // --- Helper: Dynamic Role Base Path ---
  const getBasePath = () => {
    if (!user) return "/";
    if (user.role === "admin") return "/admin";
    if (user.role === "teacher") return "/teacher";
    return "/student";
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // --- Helper: Format Date ---
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // --- Render Loading State ---
  if (loading) return <LoadingSpinner />;

  // --- Render Error State ---
  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <EmptyState 
            message={error || "No user profile found."} 
            // You can add a retry button inside EmptyState or here manually if preferred
        />
      </div>
    );
  }

  const basePath = getBasePath();

  // --- Render Main Profile ---
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="space-y-6 mx-auto">
        
        {/* --- BLUE HEADER CARD --- */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {/* Blue Banner */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-500"></div>

          <div className="px-6 sm:px-10 pb-8">
            <div className="relative flex flex-col sm:flex-row items-center sm:items-end -mt-12 mb-6">
              {/* Profile Image */}
              <img
                src={getProfileImage(user.profilePicture || user.profile_picture)}
                onError={(e) => {
                  e.target.src = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
                }}
                alt="Profile"
                className="w-32 h-32 rounded-full border-4 border-white shadow-md object-cover bg-white z-10"
              />

              {/* Name & Role */}
              <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left flex-1">
                <h1 className="text-3xl font-bold text-gray-900">
                  {user.firstName} {user.lastName}
                </h1>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize flex items-center gap-1 ${
                    user.role === 'teacher' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {user.role === 'teacher' ? <FaBriefcase size={12}/> : <FaGraduationCap size={12}/>}
                    {user.role}
                  </span>
                  {user.designation && (
                    <span className="text-gray-500 text-sm border-l pl-2 border-gray-300">
                      {user.designation}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-6 border-t border-gray-100 pt-6">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate(`${basePath}/update-profile`)} 
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm text-sm font-medium"
                >
                  <FaPen size={12} /> Edit Profile
                </button>

                <button
                  onClick={() => navigate(`${basePath}/change-password`)} 
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition shadow-sm text-sm font-medium"
                >
                  <FaKey size={12} /> Change Password
                </button>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition shadow-sm text-sm font-medium"
              >
                <FaSignOutAlt size={14} /> Logout
              </button>
            </div>
          </div>
        </div>

        {/* --- DETAILS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Info */}
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <h3 className="text-lg font-bold text-gray-900 mb-6 border-b pb-2 flex items-center gap-2">
              Contact Information
            </h3>
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <FaEnvelope size={18} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">
                    Email Address
                  </p>
                  <p className="text-gray-900 font-medium break-all">{user.email}</p>
                </div>
              </div>

              {user.rollNumber && (
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                    <FaIdBadge size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">
                      ID / Roll No
                    </p>
                    <p className="text-gray-900 font-medium">
                      {user.rollNumber}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account Details */}
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <h3 className="text-lg font-bold text-gray-900 mb-6 border-b pb-2">
              Account Details
            </h3>
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-xl ${
                    user.isActive
                      ? "bg-green-50 text-green-600"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  <FaUserCheck size={18} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">
                    Current Status
                  </p>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-bold mt-1 ${
                      user.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {user.isActive ? "Active Account" : "Inactive"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                  <FaCalendarAlt size={18} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">
                    Member Since
                  </p>
                  <p className="text-gray-900 font-medium">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* --- PROFESSIONAL PROFILE --- */}
          {(user.careerObjective || user.skills) && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 md:col-span-2">
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">
                Professional Profile
              </h3>

              {user.careerObjective && (
                <div className="mb-6">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-2">
                    Career Objective
                  </p>
                  <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
                    {user.careerObjective}
                  </p>
                </div>
              )}

              {user.skills && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-3">
                    Key Skills
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {/* ✅ 3. Improved Skills Handling (String or Array) */}
                    {Array.isArray(user.skills)
                      ? user.skills.map((skill, index) => (
                          <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm border border-gray-200 hover:bg-gray-200 transition select-none">
                            {skill}
                          </span>
                        ))
                      : typeof user.skills === "string"
                      ? user.skills.split(",").map((skill, index) => (
                          <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm border border-gray-200 hover:bg-gray-200 transition select-none">
                            {skill.trim()}
                          </span>
                        ))
                      : <span className="text-gray-500 italic">No skills listed</span>
                    }
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
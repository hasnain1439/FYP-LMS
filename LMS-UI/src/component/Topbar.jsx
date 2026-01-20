import React, { useContext, useState } from "react";
import { UserContext } from "../context/ContextApi"; 
import { useNavigate, useLocation } from "react-router-dom"; 
import { FaBars, FaBell, FaUser, FaSignOutAlt } from "react-icons/fa";
import { logout } from "./LogoutButton"; 
import UserAvatar from "./UserAvatar"; // ✅ Uses the new component

const Topbar = ({ toggleSidebar }) => {
  const { user } = useContext(UserContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const getPageTitle = (path) => {
    if (path.includes("/dashboard") || path === "/teacher" || path === "/student") return "Dashboard";
    if (path.includes("/courses")) return "Courses";
    if (path.includes("/quizzes")) return "Quizzes";
    if (path.includes("/enrollments")) return "Enrollments";
    if (path.includes("/profile")) return "My Profile";
    return "LMS Portal";
  };

  const currentTitle = getPageTitle(location.pathname);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const userName = user ? `${user.firstName} ${user.lastName}` : "Loading...";
  const userRole = user?.role || "Guest";

  return (
    <div className="bg-white h-16 shadow-sm flex items-center justify-between px-6 sticky top-0 z-30">
      
      {/* Left Side */}
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar} 
          className="text-gray-500 hover:text-blue-600 transition lg:hidden p-2 rounded-md focus:outline-none"
        >
          <FaBars size={24} />
        </button>
        <h2 className="text-xl font-bold text-gray-800 tracking-tight">
          {currentTitle}
        </h2>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-6">
        <button className="relative text-gray-500 hover:text-blue-600 transition">
          <FaBell size={20} />
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 focus:outline-none group"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition">{userName}</p>
              <p className="text-xs text-gray-500 capitalize">{userRole}</p>
            </div>
            
            <UserAvatar 
              src={user?.profilePicture || user?.profile_picture} 
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-100 shadow-sm bg-gray-50 group-hover:border-blue-200 transition"
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
                <p className="text-sm font-bold text-gray-800">{userName}</p>
              </div>
              
              <button 
                onClick={() => {
                   setDropdownOpen(false);
                   navigate(user?.role === "admin" || user?.role === "teacher" ? "/teacher/profile" : "/student/profile");
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
              >
                <FaUser size={14} /> My Profile
              </button>
              
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <FaSignOutAlt size={14} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Topbar;
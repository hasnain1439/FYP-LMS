import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import {
  FaHome,
  FaBook,
  FaList,
  FaClipboardCheck,
  FaUser,
  FaCalendarCheck,
} from "react-icons/fa";
import Sidebar from "./Sidebar"; 
import Topbar from "./Topbar";   

function StudentLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // --- Dynamic Document Title ---
  useEffect(() => {
    const path = location.pathname;
    let title = "Student Dashboard";

    if (path.includes("my-courses")) title = "My Courses";
    else if (path.includes("catalog")) title = "Course Catalog";
    else if (path.includes("quizzes")) title = "My Quizzes";
    else if (path.includes("attendance")) title = "My Attendance"; 
    else if (path.includes("profile")) title = "Student Profile";

    document.title = `${title} | LMS`;
  }, [location]);

  // --- STUDENT NAVIGATION ITEMS ---
  const studentNavItems = [
    { path: "/student", label: "Dashboard", icon: <FaHome /> },
    { path: "/student/my-courses", label: "My Learning", icon: <FaBook /> },
    { path: "/student/catalog", label: "Browse Courses", icon: <FaList /> },
    { path: "/student/quizzes", label: "Quizzes", icon: <FaClipboardCheck /> },
    { path: "/student/attendance", label: "Attendance History", icon: <FaCalendarCheck /> },
    { path: "/student/profile", label: "My Profile", icon: <FaUser /> },
  ];

  return (
    // ✅ Updated 'bg-gray-50' to 'bg-gray-light' to match Teacher Layout
    <div className="flex h-screen bg-gray-light font-sans text-gray-800">
      
      {/* 1. Sidebar (Fixed) */}
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        menuItems={studentNavItems}
      />

      {/* 2. Main Content Wrapper */}
      <div className="flex flex-col flex-1 w-full lg:ml-64 transition-all duration-300 relative">
        
        {/* Topbar */}
        <Topbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Page Content */}
        {/* Kept inner bg-gray-50 consistent with Layout.jsx structure */}
        <main className="flex-1 p-6 overflow-y-auto overflow-x-hidden bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default StudentLayout;
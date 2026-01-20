import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../component/Sidebar"; // ✅ Adjust path if needed
import Topbar from "../component/Topbar";   // ✅ Adjust path if needed
import { 
  FaHome, 
  FaBook, 
  FaClipboardList, 
  FaUsers, 
  FaUser, 
  FaCalendarCheck // ✅ Imported for Attendance
} from "react-icons/fa";

export default function Layout() {
  // 1. State to control Sidebar visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 2. Define Menu Items
  const menuItems = [
    { label: "Dashboard", path: "/teacher", icon: <FaHome /> },
    { label: "Courses", path: "/teacher/courses", icon: <FaBook /> },
    { label: "Quizzes", path: "/teacher/quizzes", icon: <FaClipboardList /> },
    { label: "Students", path: "/teacher/enrollments", icon: <FaUsers /> },
    // ✅ Added Attendance Report Link
    { label: "Attendance Report", path: "/teacher/attendance", icon: <FaCalendarCheck /> },
    { label: "Profile", path: "/teacher/profile", icon: <FaUser /> },
  ];

  return (
    <div className="flex h-screen bg-gray-light">
      
      {/* 3. SIDEBAR */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        menuItems={menuItems} 
      />

      {/* 4. MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* 5. MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden lg:ml-64 transition-all duration-300">
        
        {/* Pass toggle function to Topbar */}
        <Topbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
           <Outlet />
        </main>
      </div>
    </div>
  );
}
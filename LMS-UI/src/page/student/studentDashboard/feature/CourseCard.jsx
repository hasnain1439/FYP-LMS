import React from "react";
import { FaBookOpen, FaChalkboardTeacher, FaLayerGroup, FaCalendarAlt, FaUsers, FaRegEye } from "react-icons/fa";

const CourseCard = ({ course, type = "catalog", onAction }) => {
  // --- 1. Data Normalization ---
  const courseName = course?.name || "Untitled Course";
  const description = course?.description || "";
  const categories = course?.categories || [];
  const totalSessions = course?.totalSessions || 0;
  const enrollmentCount = course?.enrollmentCount || 0;
  
  // Handle Teacher Name
  let teacherName = "Unknown Instructor";
  if (course.teacher && course.teacher.firstName) {
    teacherName = `${course.teacher.firstName} ${course.teacher.lastName}`;
  } else if (course.teacherFirstName) {
    teacherName = `${course.teacherFirstName} ${course.teacherLastName}`;
  }

  // Handle Date Display (Created At for Teachers, Enrolled At for Students)
  const displayDate = type === 'teacher' 
    ? (course.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'N/A')
    : (course.enrolledAt ? new Date(course.enrolledAt).toLocaleDateString() : null);

  // --- THEME CONFIGURATION ---
  const isTeacher = type === "teacher";
  
  // Teacher = Emerald (Green), Student/Catalog = Blue
  const gradientClass = isTeacher ? "from-emerald-600 to-emerald-400" : "from-blue-600 to-blue-400";
  const iconColorClass = isTeacher ? "text-emerald-600" : "text-blue-600";
  const badgeColorClass = isTeacher ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-blue-600 bg-blue-50 border-blue-100";
  const buttonBaseClass = isTeacher 
    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200" 
    : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200";

  return (
    <div 
      className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col h-full group cursor-pointer"
      onClick={() => onAction && onAction(course.id)} // Make whole card clickable
    >
      
      {/* --- Top Section: Gradient Cover --- */}
      <div className={`h-32 bg-gradient-to-r ${gradientClass} relative p-4`}>
        {/* Category Tag */}
        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-white border border-white/30">
          {categories[0] || "General"}
        </div>
        
        {/* Icon Box */}
        <div className={`absolute -bottom-6 left-6 w-12 h-12 bg-white rounded-xl shadow-md flex items-center justify-center ${iconColorClass} text-xl group-hover:scale-110 transition-transform duration-200`}>
          {isTeacher ? <FaChalkboardTeacher /> : <FaBookOpen />}
        </div>
      </div>

      {/* --- Content Section --- */}
      <div className="pt-8 pb-5 px-6 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1" title={courseName}>
          {courseName}
        </h3>
        
        {/* Subtitle */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          {isTeacher ? (
             <>
               <FaCalendarAlt className="text-emerald-500" size={12} />
               <span className="truncate text-xs">Created: {displayDate}</span>
             </>
          ) : (
             <>
               <FaChalkboardTeacher className="text-blue-500" />
               <span className="truncate">{teacherName}</span>
             </>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1 min-h-[40px]">
          {description || "No description provided."}
        </p>

        {/* Stats Row */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-4 mb-4 text-xs text-gray-500 font-medium">
          <div className="flex items-center gap-1.5">
            <FaLayerGroup className="text-gray-400" />
            <span>{totalSessions} Sessions</span>
          </div>
          
          {isTeacher ? (
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border ${badgeColorClass}`}>
              <FaUsers />
              <span>{enrollmentCount} Students</span>
            </div>
          ) : (
            displayDate && (
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border ${badgeColorClass}`}>
                <FaCalendarAlt />
                <span>Joined {displayDate}</span>
              </div>
            )
          )}
        </div>

        {/* --- Action Button --- */}
        <div className="mt-auto">
            <button 
                onClick={(e) => {
                    e.stopPropagation(); // Prevent double-click if card has onclick
                    onAction && onAction(course.id);
                }}
                className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${buttonBaseClass}`}
            >
                <FaRegEye /> View Course
            </button>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
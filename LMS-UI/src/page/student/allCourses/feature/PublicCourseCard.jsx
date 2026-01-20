import React from "react";
import {
  Clock,
  Users,
  UserCircle2,
  BookOpen,
  CheckCircle2,
  LogOut,
  Loader2,
  Eye,
} from "lucide-react";

/**
 * A course card specifically designed for the "Browse/Catalog" page.
 * It handles showing Join/Leave/View actions based on enrollment status.
 */
export default function PublicCourseCard({
  course,
  isEnrolled, // Boolean: Is the current student already in this course?
  onJoin,     // Function to handle joining
  onLeave,    // Function to handle leaving (dropping)
  onView,     // Function to handle viewing details
  isProcessingAction // Boolean: Is a join/leave action currently happening on this specific card?
}) {
  // Helper for category pills
  const mainCategory = course.categories?.[0] || "General";
  const remainingCount = course.categories?.length > 1 ? course.categories.length - 1 : 0;

  return (
    <div className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 h-full">
      {/* Top Visual Banner */}
      <div className="h-32 bg-gradient-to-br from-blue-500 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="px-3 py-1 text-xs font-semibold tracking-wide bg-white/90 text-blue-700 rounded-full shadow-sm">
            {mainCategory}
          </span>
          {remainingCount > 0 && (
            <span className="px-3 py-1 text-xs font-semibold tracking-wide bg-white/90 text-gray-600 rounded-full shadow-sm">
              +{remainingCount} more
            </span>
          )}
        </div>
        <BookOpen
          className="absolute bottom-4 right-4 text-white/20 group-hover:scale-110 transition-transform duration-300"
          size={64}
        />
      </div>

      {/* Content Section */}
      <div className="p-6 flex flex-col flex-grow">
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {course.name}
        </h3>

        {/* Teacher Info */}
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 font-medium">
          <UserCircle2 size={18} className="text-blue-500" />
          <span>
            {course.teacher?.firstName} {course.teacher?.lastName}
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-500 text-sm mb-6 line-clamp-3 flex-grow leading-relaxed">
          {course.description || "No description provided for this course."}
        </p>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-4 mb-6">
          <div className="flex items-center gap-1.5">
            <Clock size={16} className="text-gray-400" />
            <span>{course.totalSessions || 0} Sessions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={16} className="text-gray-400" />
            <span>{course.enrollmentCount || 0} Enrolled</span>
          </div>
        </div>

        {/* --- Action Buttons Area --- */}
        <div className="mt-auto space-y-3">
          
          {/* ----- State 1: User IS enrolled ----- */}
          {isEnrolled ? (
            <div className="flex flex-col gap-3">
              {/* Enrolled Badge indicator */}
              <div className="w-full py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm">
                <CheckCircle2 size={16} />
                Already Enrolled
              </div>
              
              <div className="flex gap-2">
                 {/* View Button */}
                <button
                  onClick={onView}
                  className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm"
                >
                   <Eye size={16} /> View
                </button>
                 {/* Leave Button */}
                <button
                  onClick={onLeave}
                  disabled={isProcessingAction}
                  className="flex-none px-4 py-2.5 bg-white border border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-70 text-sm"
                >
                  {isProcessingAction ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <LogOut size={16} /> Leave
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* ----- State 2: User IS NOT enrolled ----- */
            <div className="flex gap-3">
              {/* View Button */}
              <button
                onClick={onView}
                 className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm"
              >
                  <Eye size={16} /> View
              </button>
              
              {/* Join Button */}
              <button
                onClick={onJoin}
                disabled={isProcessingAction}
                className="flex-[2] py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-md shadow-blue-200 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
              >
                {isProcessingAction ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-white" />
                    <span>Joining...</span>
                  </>
                ) : (
                  "Join Course"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
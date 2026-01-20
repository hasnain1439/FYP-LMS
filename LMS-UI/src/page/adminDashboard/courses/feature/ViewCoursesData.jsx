import { useEffect } from "react";
import { LuUsers, LuClock, LuBookOpen } from "react-icons/lu";
import { RxCross2 } from "react-icons/rx";

export default function ViewCoursesData({ viewData, closePopup }) {
  
  // 1. Lock Body Scroll when popup is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, []);

  if (!viewData) return null;

  return (
    <div className="fixed -inset-10 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-start px-8 py-6 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight pr-4">
              {viewData.title || viewData.name}
            </h2>
            <div className="flex flex-wrap gap-2 mt-2">
                {/* Category Badge */}
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wide">
                    {Array.isArray(viewData.categories) ? viewData.categories.join(", ") : viewData.category || "General"}
                </span>

                {/* Status Badge */}
                {viewData.status && (
                    <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium capitalize border ${
                        viewData.status === "active"
                        ? "bg-green-50 text-green-700 border-green-100"
                        : viewData.status === "completed"
                        ? "bg-blue-50 text-blue-700 border-blue-100"
                        : "bg-red-50 text-red-700 border-red-100"
                    }`}
                    >
                    {viewData.status}
                    </span>
                )}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={() => closePopup(false)}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <RxCross2 className="text-xl" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-8 overflow-y-auto">
            
            {/* Description */}
            <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <LuBookOpen className="text-blue-500" /> Description
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                    {viewData.description || "No description provided."}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase mb-1">
                        <LuUsers className="text-lg text-blue-500" /> Total Students
                    </div>
                    <span className="text-xl font-bold text-gray-900">
                        {viewData.students || viewData.enrollmentCount || 0}
                    </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase mb-1">
                        <LuClock className="text-lg text-blue-500" /> Duration
                    </div>
                    <span className="text-xl font-bold text-gray-900">
                        {viewData.duration || viewData.totalSessions || 0} Weeks
                    </span>
                </div>
            </div>

            {/* Progress Bar (Only show if progress exists) */}
            {typeof viewData.progress !== 'undefined' && (
                <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-900 font-bold text-sm">
                            Course Progress
                        </span>
                        <span className="text-blue-600 font-bold text-sm">
                            {viewData.progress}%
                        </span>
                    </div>

                    <div className="w-full bg-white rounded-full h-2.5 overflow-hidden border border-blue-100">
                        <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${viewData.progress}%` }}
                        ></div>
                    </div>
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end">
            <button
                onClick={() => closePopup(false)}
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all text-sm shadow-sm"
            >
                Close
            </button>
        </div>

      </div>
    </div>
  );
}
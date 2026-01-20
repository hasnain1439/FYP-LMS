import React from "react";
import { useNavigate } from "react-router-dom"; // ✅ Import for navigation
import { 
  FaExclamationCircle, 
  FaFileAlt, 
  FaClipboardCheck, 
  FaCheckCircle 
} from "react-icons/fa";

const UpcomingDeadlines = ({ data }) => {
  const navigate = useNavigate(); // ✅ Hook for navigation

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <FaExclamationCircle className="text-orange-500 text-xl" />
        <h2 className="text-lg font-bold text-gray-800">Upcoming Deadlines</h2>
      </div>

      {/* List */}
      <div className="flex flex-col gap-4">
        {data.map((item) => {
          // Check if Urgent (and not already done)
          const isUrgent = (item.daysLeft.includes("Today") || item.daysLeft.includes("1 day")) && !item.isSubmitted;

          return (
            <div
              key={item.id}
              className={`flex flex-col md:flex-row items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                isUrgent
                  ? "bg-orange-50 border-orange-200"
                  : "bg-white border-gray-100 hover:border-gray-200"
              }`}
            >
              {/* Left Side: Icon & Info */}
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div
                  className={`p-3 rounded-lg text-xl ${
                    item.isSubmitted
                      ? "bg-green-100 text-green-600" // Green for submitted
                      : isUrgent
                      ? "bg-orange-100 text-orange-500"
                      : "bg-blue-50 text-blue-500"
                  }`}
                >
                  {/* Icon Logic */}
                  {item.isSubmitted ? <FaCheckCircle /> : isUrgent ? <FaClipboardCheck /> : <FaFileAlt />}
                </div>

                <div>
                  <h3 className={`font-bold text-base ${isUrgent ? "text-orange-900" : "text-gray-900"}`}>
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500">{item.courseName}</p>
                  
                  {/* Date & Status Row */}
                  <div className="flex items-center gap-2 text-xs font-medium mt-1">
                    <span className="text-gray-400">📅 Due {item.formattedDate}</span>
                    
                    {!item.isSubmitted && (
                      <span className={isUrgent ? "text-orange-600 font-bold" : "text-blue-600"}>
                        • {item.daysLeft}
                      </span>
                    )}
                    
                    {/* Show "Completed" text if done */}
                    {item.isSubmitted && (
                      <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full">
                         Submitted
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side: Action Button */}
              <div className="mt-3 md:mt-0 w-full md:w-auto">
                {item.isSubmitted ? (
                  // ✅ STATE 1: ALREADY SUBMITTED
                  <button
                    disabled
                    className="w-full md:w-auto px-6 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed flex items-center gap-2"
                  >
                    <FaCheckCircle /> Done
                  </button>
                ) : (
                  // ✅ STATE 2: TAKE QUIZ (Active)
                  <button
                    onClick={() => navigate(`/student/take-quiz/${item.id}`)} // 👈 Logic to go to Quiz Page
                    className={`w-full md:w-auto px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      isUrgent
                        ? "bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-200"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-100"
                    }`}
                  >
                    Take Quiz
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UpcomingDeadlines;
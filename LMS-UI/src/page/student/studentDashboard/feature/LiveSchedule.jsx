import React, { useState, useContext } from "react";
import { FaCalendarAlt, FaVideo, FaRegClock } from "react-icons/fa";
import toast from "react-hot-toast";
import { UserContext } from "../../../../context/ContextApi";
import FaceCapture from "../../../../component/FaceCapture";
import EmptyState from "../../../../component/EmptyState";

const LiveSchedule = ({ data }) => {
  const { user } = useContext(UserContext);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <EmptyState message="No classes scheduled for today." />
      </div>
    );
  }

  const handleJoinClick = (item) => {
    // 1. Check if class is live
    const isLive = item.status === "Live Now";
    if (!isLive) return;

    // 2. Authentication Check
    const token = localStorage.getItem("token");
    if (!user && !token) {
      toast.error("Please login to join the class.");
      return;
    }

    // 3. 🛡️ Data Integrity Check
    if (!item.courseId) {
      console.error("❌ Data Error: 'courseId' is missing in this item:", item);
      toast.error("System Error: Course ID is missing. Cannot verify.");
      return;
    }

    // 4. Prepare Session Object
    const sessionData = {
      courseId: item.courseId,
      scheduleId: item.scheduleId || item.id,
      title: item.title,
    };

    setSelectedSession(sessionData);
    setCaptureOpen(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 ">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <FaCalendarAlt className="text-blue-600 text-lg" />
          <h2 className="text-lg font-bold text-gray-800">Live Schedule</h2>
        </div>
        <span className="text-sm text-gray-500 font-medium">Today</span>
      </div>

      {/* Schedule List */}
      <div className="flex flex-col gap-4">
        {data.map((item) => {
          const isLive = item.status === "Live Now";

          return (
            <div
              key={item.id || item.scheduleId}
              className={`flex flex-col md:flex-row items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                isLive
                  ? "border-blue-500 bg-blue-50/50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              {/* Class Info */}
              <div className="flex items-center gap-6 w-full md:w-auto">
                {/* Time Column */}
                <div className="flex flex-col items-center justify-center min-w-[70px] text-gray-600 border-r border-gray-200 pr-4">
                  <span
                    className={`font-bold text-lg ${isLive ? "text-blue-600" : "text-gray-700"}`}
                  >
                    {item.day || "Today"}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-medium mt-1">
                    <FaRegClock />
                    <span>{item.time}</span>
                  </div>
                </div>

                {/* Details Column */}
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-gray-900 text-lg">
                      {item?.title?.length > 50
                        ? `${item.title.slice(0, 50)}...`
                        : item?.title}
                    </h3>
                    {isLive && (
                      <span className="bg-red-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse shadow-sm">
                        <span className="w-1.5 h-1.5 bg-white rounded-full"></span>{" "}
                        Live
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    Instructor:{" "}
                    <span className="font-medium text-gray-700">
                      {item.instructor}
                    </span>
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 md:mt-0 w-full md:w-auto">
                <button
                  disabled={!isLive}
                  onClick={() => handleJoinClick(item)}
                  className={`w-full md:w-auto px-6 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                    isLive
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 cursor-pointer active:scale-95"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  }`}
                >
                  {isLive ? (
                    <>
                      <FaVideo /> Join Class
                    </>
                  ) : (
                    "Upcoming"
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Face Capture Modal */}
      {selectedSession && (
        <FaceCapture
          isOpen={captureOpen}
          onClose={() => {
            setCaptureOpen(false);
            setSelectedSession(null);
          }}
          session={selectedSession}
          apiEndpoint="/api/attendance/markAttendance"
          onSuccess={(response) => {
            const link = response.meetingLink || response.link;

            if (link) {
              // ✅ POPUP BLOCKER FIX:
              // 1. Try to open in a new tab
              const newTab = window.open(link, "_blank");

              // 2. If blocked (newTab is null), force open in current tab
              if (
                !newTab ||
                newTab.closed ||
                typeof newTab.closed === "undefined"
              ) {
                toast.loading("Redirecting to class...", { duration: 3000 });
                setTimeout(() => {
                  window.location.href = link;
                }, 1000);
              }
            } else {
              toast.success(
                "Attendance marked! Please refresh to see class link.",
              );
            }
          }}
        />
      )}
    </div>
  );
};

export default LiveSchedule;

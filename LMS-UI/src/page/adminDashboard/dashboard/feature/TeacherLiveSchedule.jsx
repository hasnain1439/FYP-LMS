import React, { useState, useContext } from "react";
import { FaCalendarAlt, FaVideo, FaRegClock } from "react-icons/fa";
import EmptyState from "../../../../component/EmptyState";
import toast from "react-hot-toast";
import FaceCapture from "../../../../component/FaceCapture"; // ✅ Import FaceCapture
import { UserContext } from "../../../../context/ContextApi";

const TeacherLiveSchedule = ({ data }) => {
  const { user } = useContext(UserContext);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  // ✅ Step 1: Handle Click - Open Face Scanner
  const handleStartClassClick = (item) => {
    // Basic Checks
    const status = item.status ? item.status.trim().toLowerCase() : "";
    if (status !== "live now") return;

    if (!item.courseId) {
      toast.error("Error: Missing Course ID");
      return;
    }

    // Prepare data for the modal
    setSelectedSession({
      courseId: item.courseId,
      scheduleId: item.id || item.scheduleId,
      title: item.title,
      isTeacher: true, // Optional flag if your FaceCapture needs it
    });

    setCaptureOpen(true); // Open the Modal
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 min-h-[200px] flex items-center justify-center">
        <EmptyState message="No classes scheduled for today." />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <FaCalendarAlt className="text-blue-600 text-lg" />
          <h2 className="text-lg font-bold text-gray-800">Your Schedule</h2>
        </div>
        <span className="text-sm text-gray-500 font-medium">Today</span>
      </div>

      {/* Schedule List */}
      <div className="flex flex-col gap-4">
        {data.map((item) => {
          const status = item.status ? item.status.trim().toLowerCase() : "";
          const isLive = status === "live now";

          return (
            <div
              key={item.id}
              className={`flex flex-col md:flex-row items-center justify-between p-4 rounded-xl border transition-all ${
                isLive ? "border-blue-500 bg-blue-50/50" : "border-gray-200"
              }`}
            >
              <div className="flex items-center gap-6 w-full md:w-auto">
                <div className="flex flex-col items-center justify-center min-w-[60px] text-gray-600">
                  <div className="flex items-center gap-1 text-sm font-semibold">
                    <FaRegClock
                      className={isLive ? "text-blue-600" : "text-gray-400"}
                    />
                    <span
                      className={isLive ? "text-blue-900" : "text-gray-600"}
                    >
                      {item.time}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 font-medium uppercase mt-1">
                    Start
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-gray-900 text-lg">
                      {item?.title?.length > 50
                        ? `${item.title.slice(0, 50)}...`
                        : item?.title}
                    </h3>
                    {isLive && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                        Live Now
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Topic:{" "}
                    <span className="font-medium text-gray-700">
                      {item.topic || "General"}
                    </span>
                  </p>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <div className="mt-4 md:mt-0 w-full md:w-auto">
                <button
                  disabled={!isLive}
                  onClick={() => handleStartClassClick(item)}
                  className={`w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all ${
                    isLive
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 shadow-lg cursor-pointer active:scale-95"
                      : "bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {isLive ? (
                    <>
                      <FaVideo /> Start Class
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

      {/* ✅ Step 2: Face Verification Modal */}
      {selectedSession && (
        <FaceCapture
          isOpen={captureOpen}
          onClose={() => {
            setCaptureOpen(false);
            setSelectedSession(null);
          }}
          session={selectedSession}
          // ✅ Correct Endpoint for Teachers
          apiEndpoint="/api/lectures/startLectureWithFaceVerification"
          onSuccess={(response) => {
            const link = response.meetingLink || response.link;

            if (link) {
              // ✅ POPUP BLOCKER FIX:
              // 1. Try to open in a new tab
              const newTab = window.open(link, "_blank");

              // 2. If blocked (newTab is null or closed immediately), force redirect in current tab
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
              toast.success("Class started! Please refresh for link.");
            }
          }}
        />
      )}
    </div>
  );
};

export default TeacherLiveSchedule;

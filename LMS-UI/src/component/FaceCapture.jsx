import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import toast from "react-hot-toast";
import { FaCamera, FaTimes, FaSpinner, FaUserCheck } from "react-icons/fa";

const FaceCapture = ({ 
  isOpen, 
  onClose, 
  session, 
  onSuccess, 
  apiEndpoint, 
  type = "student" // Default to student, pass "teacher" for start class
}) => {
  const webcamRef = useRef(null);
  const [loading, setLoading] = useState(false);

  // Helper: Convert Base64 to File object
  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleCapture = useCallback(async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return toast.error("Camera not ready");

    // 1. Safety Checks
    if (!session?.courseId) {
      toast.error("Error: Course ID is missing.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Verifying Identity...");

    try {
      const token = localStorage.getItem("token");
      
      // 2. Determine Endpoint (if not explicitly provided)
      let url = apiEndpoint;
      if (!url) {
        url = type === "teacher" 
          ? "http://localhost:5000/api/lecture/start"
          : "http://localhost:5000/api/attendance/mark";
      } else if (!url.startsWith("http")) {
        url = `http://localhost:5000${url}`;
      }

      // 3. Prepare Payload
      const imageFile = dataURLtoFile(imageSrc, "face-scan.jpg");
      const formData = new FormData();

      // ✅ Exact keys required by your backend
      formData.append("image", imageFile); 
      formData.append("courseId", session.courseId);
      
      if (session.scheduleId || session.id) {
        formData.append("scheduleId", session.scheduleId || session.id);
      }

      console.log(`🚀 Sending ${type} verification request to:`, url);

      // 4. Send Request
      const response = await axios.post(url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // 5. Handle Success
      const data = response.data;
      toast.success(data.message || "Face Verified Successfully!", { id: toastId });
      
      // Auto-open meeting link if returned (Teacher flow)
      if (data.meetingLink || data.meetLink) {
        const link = data.meetingLink || data.meetLink;
        setTimeout(() => {
           window.open(link, "_blank");
        }, 1000);
      }

      if (onSuccess) onSuccess(data);
      onClose();

    } catch (error) {
      console.error("Verification Error:", error);
      const errorMsg = error.response?.data?.error || "Face Verification Failed";
      const errorDetails = error.response?.data?.details || "";
      
      // Show specific error from backend (e.g., "Face Mismatch")
      toast.error(`${errorMsg} ${errorDetails}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  }, [webcamRef, session, onClose, onSuccess, apiEndpoint, type]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-fadeIn">
        
        {/* Header */}
        <div className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FaUserCheck className="text-blue-400" />
            {type === "teacher" ? "Teacher Verification" : "Student Attendance"}
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors"
            disabled={loading}
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center">
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border-2 border-gray-200 shadow-inner group">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "user" }}
              className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
            />
            
            {/* Overlay Frame */}
            <div className="absolute inset-0 border-4 border-blue-500/30 rounded-lg pointer-events-none">
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-blue-400 rounded-tl"></div>
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-blue-400 rounded-tr"></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-blue-400 rounded-bl"></div>
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-blue-400 rounded-br"></div>
            </div>
          </div>

          <p className="text-sm text-gray-500 mt-4 text-center">
            {loading 
              ? "Analyzing face biometrics..." 
              : "Please look directly at the camera and ensure good lighting."}
          </p>

          {/* Action Buttons */}
          <div className="mt-6 w-full flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            
            <button
              onClick={handleCapture}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl flex justify-center items-center gap-2 hover:bg-blue-700 font-medium transition-all shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  <FaCamera /> Verify Face
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceCapture;
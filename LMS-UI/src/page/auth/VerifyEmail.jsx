import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { FaSpinner, FaCheckCircle, FaExclamationCircle, FaEnvelopeOpenText, FaArrowLeft } from "react-icons/fa";
import toast from "react-hot-toast";

const VerifyEmail = () => {
  const { userId, token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!userId || !token) {
      setStatus("error");
      setMessage("Invalid verification link. Missing parameters.");
      return;
    }

    const verify = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/auth/verify-email/${userId}/${token}`
        );
        const successMsg = res.data.message || "Email verified successfully!";
        setMessage(successMsg);
        setStatus("success");
        toast.success(successMsg);
      } catch (error) {
        const errMsg =
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Verification failed. The link may be invalid or expired.";
        setMessage(errMsg);
        setStatus("error");
        toast.error(errMsg);
      }
    };
    verify();
  }, [userId, token]);

  // Auto-redirect on success
  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => {
        navigate("/login");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
        
        {/* LOADING STATE */}
        {status === "loading" && (
          <div className="py-8">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center justify-center">
                <FaSpinner className="animate-spin text-4xl text-blue-600" />
              </div>
              <div className="w-16 h-16 mx-auto rounded-full border-4 border-blue-100"></div>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Verifying Email</h2>
            <p className="text-gray-500 text-sm">Please wait while we validate your link...</p>
          </div>
        )}

        {/* SUCCESS STATE */}
        {status === "success" && (
          <div className="py-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
              <FaCheckCircle className="text-3xl text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verified!</h2>
            <p className="text-green-600 font-medium mb-4">{message}</p>
            <p className="text-gray-400 text-sm">Redirecting to login...</p>
            
            <div className="mt-6 w-full h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 animate-[width_3s_ease-in-out_forwards]" style={{ width: "0%" }}></div>
            </div>
          </div>
        )}

        {/* ERROR STATE (Updated with Login Link) */}
        {status === "error" && (
          <div className="py-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <FaExclamationCircle className="text-3xl text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h2>
            <p className="text-red-500 font-medium mb-6">{message}</p>
            
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
              <FaEnvelopeOpenText className="text-gray-400 text-2xl mx-auto mb-2" />
              <p className="text-gray-600 text-sm mb-3">
                Link expired or invalid?
              </p>
              <Link
                to="/resend-verification"
                className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 transition-all text-sm w-full sm:w-auto"
              >
                Resend Link
              </Link>
            </div>

            {/* ✅ NEW: Back to Login Link */}
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium text-sm transition-colors mt-2"
            >
              <FaArrowLeft className="text-xs" /> Back to Login
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};

export default VerifyEmail;
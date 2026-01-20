import React, { useState, useRef, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
  FaEnvelope,
  FaLock,
  FaUser,
  FaIdBadge,
  FaSpinner,
  FaExclamationCircle,
  FaCamera,
  FaTimes,
  FaCheck,
  FaRedo,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

const Registration = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // --- CAMERA STREAM HANDLING ---
  useEffect(() => {
    const video = videoRef.current;
    if (stream && video) {
      video.srcObject = stream;
      video.play().catch((err) => console.warn("Autoplay prevented:", err));
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const validationSchema = Yup.object({
    firstName: Yup.string().required("First name is required"),
    lastName: Yup.string().required("Last name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .matches(/[A-Z]/, "Need at least 1 Uppercase letter")
      .matches(/[a-z]/, "Need at least 1 Lowercase letter")
      .matches(/\d/, "Need at least 1 Number")
      .matches(/[@$!%*?&]/, "Need at least 1 Special Character")
      .required("Password is required"),
    role: Yup.string().required("Please select a role"),
    faceImage: Yup.mixed().required("Face verification image is required"),
  });

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      setStream(s);
      setShowCamera(true);
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("Could not access camera. Please allow permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setShowCamera(false);
  };

  const capturePhoto = (setFieldValue) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    // Flip image horizontally to match the "mirror" video feed
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "face_capture.png", { type: "image/png" });
      const url = URL.createObjectURL(blob);

      setFieldValue("faceImage", file);
      setPreviewUrl(url);
      toast.success("Face captured successfully!");
      stopCamera();
    }, "image/png");
  };

  // --- 🔴 THE CRITICAL FIX IS HERE 🔴 ---
  const postData = async (values, { resetForm, setSubmitting }) => {
    setServerError("");
    const formData = new FormData();
    Object.keys(values).forEach((key) => formData.append(key, values[key]));

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/register",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      console.log("Full Server Response:", res.data);

      // ✅ FIX: Use 'accessToken' and 'user.id' exactly as shown in your screenshot
      const token = res.data.accessToken;
      const userId = res.data.user?.id || res.data.user?._id;

      if (token && userId) {
        localStorage.setItem("token", token);
        toast.success("Account created successfully!");
        
        // Navigate to /verify-email/USERID/TOKEN
        navigate(`/verify-email/${userId}/${token}`);
        
      } else {
        console.warn("Missing ID or Token. Data received:", res.data);
        toast.success("Registration successful! Please Log In.");
        navigate("/login");
      }

      resetForm();
    } catch (error) {
      console.error("❌ Registration failed:", error);
      const msg = error.response?.data?.error || "Registration failed. Please try again.";
      setServerError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Create Account
          </h2>
          <p className="text-gray-500 mt-2 text-sm">
            Join us for secure AI-powered learning
          </p>
        </div>

        {serverError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-600 animate-pulse">
            <FaExclamationCircle className="text-xl shrink-0" />
            <span className="text-sm font-medium">{serverError}</span>
          </div>
        )}

        <Formik
          initialValues={{
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            role: "",
            faceImage: null,
          }}
          validationSchema={validationSchema}
          onSubmit={postData}
        >
          {({ setFieldValue, isSubmitting, values }) => (
            <Form className="space-y-5">
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full relative group">
                  <FaUser className="absolute top-4 left-4 text-gray-400 group-focus-within:text-blue-600 transition-colors z-10" />
                  <Field
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                  <ErrorMessage name="firstName" component="p" className="text-red-500 text-xs mt-1 ml-2" />
                </div>
                <div className="w-full relative group">
                  <FaUser className="absolute top-4 left-4 text-gray-400 group-focus-within:text-blue-600 transition-colors z-10" />
                  <Field
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                  <ErrorMessage name="lastName" component="p" className="text-red-500 text-xs mt-1 ml-2" />
                </div>
              </div>

              <div className="relative group">
                <FaEnvelope className="absolute top-4 left-4 text-gray-400 group-focus-within:text-blue-600 transition-colors z-10" />
                <Field
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <ErrorMessage name="email" component="p" className="text-red-500 text-xs mt-1 ml-2" />
              </div>

              <div className="relative group">
                <FaLock className="absolute top-4 left-4 text-gray-400 group-focus-within:text-blue-600 transition-colors z-10" />
                <Field
                  type="password"
                  name="password"
                  placeholder="Password"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <ErrorMessage name="password" component="p" className="text-red-500 text-xs mt-1 ml-2" />
              </div>

              <div className="relative group">
                <FaIdBadge className="absolute top-4 left-4 text-gray-400 group-focus-within:text-blue-600 transition-colors z-10" />
                <Field
                  as="select"
                  name="role"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer text-gray-600"
                >
                  <option value="" disabled>Select Role</option>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </Field>
                <ErrorMessage name="role" component="p" className="text-red-500 text-xs mt-1 ml-2" />
              </div>

              <div className="pt-2">
                <label className="block text-sm font-bold text-gray-700 mb-3 ml-1">
                  Face Verification
                </label>

                {!previewUrl ? (
                  <div
                    onClick={startCamera}
                    className="border-2 border-dashed border-gray-300 rounded-2xl h-40 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors mb-3">
                      <FaCamera className="text-gray-400 text-xl group-hover:text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-500 group-hover:text-blue-700">
                      Tap to Capture Face
                    </span>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm group">
                    <img
                      src={previewUrl}
                      alt="Captured Face"
                      className="w-full h-48 object-cover bg-black"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewUrl(null);
                          setFieldValue("faceImage", null);
                        }}
                        className="bg-white text-gray-900 px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 hover:bg-gray-100 shadow-md transform hover:scale-105 transition-all"
                      >
                        <FaRedo className="text-xs" /> Retake Photo
                      </button>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-green-500 text-white p-1.5 rounded-full shadow-lg">
                      <FaCheck className="text-xs" />
                    </div>
                  </div>
                )}
                <ErrorMessage name="faceImage" component="p" className="text-red-500 text-xs mt-2 ml-2" />
              </div>

              {showCamera && (
                <div className="fixed -inset-10 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-hidden">
                  <div className="relative w-full max-w-lg bg-gray-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center">
                    
                    <div className="absolute top-0 w-full p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
                      <span className="text-white/80 text-sm font-medium tracking-wide">
                        Position face in oval
                      </span>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-all backdrop-blur-md"
                      >
                        <FaTimes />
                      </button>
                    </div>

                    <div className="relative w-full aspect-[4/3] bg-black">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform -scale-x-100"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-64 border-2 border-white/30 rounded-[50%] shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
                      </div>
                    </div>

                    <div className="w-full p-6 bg-gray-900 flex justify-center items-center gap-6">
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-6 py-2 rounded-full text-gray-400 font-medium text-sm hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => capturePhoto(setFieldValue)}
                        className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
                      >
                        <div className="w-12 h-12 rounded-full bg-blue-600"></div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !values.faceImage}
                className="w-full py-4 mt-4 rounded-xl font-bold text-white shadow-lg shadow-blue-500/30 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin" /> Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>

              <p className="text-center text-sm text-gray-600 mt-4">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-blue-600 font-bold hover:underline"
                >
                  Log In
                </Link>
              </p>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default Registration;
import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { FaEnvelope, FaSpinner, FaArrowLeft, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { Link } from "react-router-dom";
import toast from "react-hot-toast"; // 🔔 Import Toast

const ForgotPassword = () => {
  const [status, setStatus] = useState({ type: "", message: "" });

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
  });

  const handleForgotPassword = async (values, { setSubmitting, resetForm }) => {
    setStatus({ type: "", message: "" });

    try {
      const res = await axios.post("http://localhost:5000/api/auth/forgot-password", {
        email: values.email,
      });

      const successMsg = res.data.message || "Reset link sent! Please check your inbox.";
      
      setStatus({ 
        type: "success", 
        message: successMsg 
      });
      
      // 🔔 Notification
      toast.success(successMsg);
      
      resetForm();
    } catch (error) {
      console.error("Forgot Password Error:", error);
      const errorMsg = error.response?.data?.error || "Failed to send reset link. Please try again.";
      
      setStatus({ 
        type: "error", 
        message: errorMsg 
      });

      // 🔔 Notification
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-bg px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Forgot Password?</h2>
          <p className="text-gray-500 mt-2 text-sm">
            Enter your email and we'll send you instructions to reset your password.
          </p>
        </div>

        {status.message && (
          <div className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${
            status.type === "success" 
              ? "bg-green-50 border-green-200 text-green-700" 
              : "bg-red-50 border-red-200 text-red-700"
          }`}>
            {status.type === "success" ? <FaCheckCircle /> : <FaExclamationCircle />}
            <span className="text-sm font-medium">{status.message}</span>
          </div>
        )}

        <Formik
          initialValues={{ email: "" }}
          validationSchema={validationSchema}
          onSubmit={handleForgotPassword}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-6">
              
              <div className="relative group">
                <FaEnvelope className="absolute top-3.5 left-4 text-gray-400 group-focus-within:text-blue-600 transition-colors z-10" />
                <Field
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
                />
                <ErrorMessage 
                  name="email" 
                  component="p" 
                  className="text-red-500 text-xs mt-1 ml-1" 
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex justify-center items-center gap-2
                  ${isSubmitting 
                    ? "bg-blue-400 cursor-not-allowed" 
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/30"
                  }`}
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin" /> Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>

              <div className="text-center mt-4">
                <Link 
                  to="/login" 
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <FaArrowLeft className="text-xs" /> Back to Login
                </Link>
              </div>

            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default ForgotPassword;
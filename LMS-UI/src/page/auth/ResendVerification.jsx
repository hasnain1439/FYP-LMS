import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaEnvelope, FaSpinner, FaCheckCircle, FaExclamationCircle, FaArrowLeft } from "react-icons/fa";
import toast from "react-hot-toast"; // 🔔 Import Toast

const validationSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),
});

const ResendVerification = () => {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  
  const resendEmailHandler = async (values, { setSubmitting, resetForm }) => {
    setMessage("");
    setError("");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/resend-verification",
        { email: values.email }
      );
      
      const successMsg = res.data.message || "Verification email sent";
      setMessage(successMsg);
      
      // 🔔 Notification
      toast.success(successMsg);

      resetForm();
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Network Error. Please try again.";
      setError(errorMsg);
      
      // 🔔 Notification
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-bg px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        
        {message ? (
          <div className="text-center py-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
              <FaCheckCircle className="text-3xl text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Email Sent!</h2>
            <p className="text-gray-500 mb-6">
              Please check your inbox to verify your account.
            </p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-xl shadow-lg hover:bg-blue-700 transition-all"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Resend Verification</h2>
              <p className="text-gray-500 mt-2 text-sm">
                Enter your email to receive a new verification link.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 animate-pulse">
                <FaExclamationCircle className="text-xl shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <Formik
              initialValues={{ email: "" }}
              validationSchema={validationSchema}
              onSubmit={resendEmailHandler}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-6">
                  
                  <div className="relative group">
                    <FaEnvelope className="absolute top-3.5 left-4 text-gray-400 group-focus-within:text-blue-600 transition-colors z-10" />
                    <Field
                      type="email"
                      name="email"
                      placeholder="Enter your email"
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
                      "Resend Link"
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
          </>
        )}
      </div>
    </div>
  );
};

export default ResendVerification;
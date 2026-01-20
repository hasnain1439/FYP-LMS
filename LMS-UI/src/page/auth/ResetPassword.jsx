import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import { FaLock, FaSpinner, FaCheckCircle, FaExclamationCircle, FaArrowLeft } from "react-icons/fa";
import toast from "react-hot-toast"; // 🔔 Import Toast

const ResetPassword = () => {
  const { token } = useParams();
  const [status, setStatus] = useState({ type: "", message: "" });

  const validationSchema = Yup.object({
    password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        "Must contain Uppercase, Lowercase, Number & Special Char"
      )
      .required("Password is required"),

    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], "Passwords must match")
      .required("Confirm password is required"),
  });

  const handleResetPassword = async (values, { setSubmitting, resetForm }) => {
    setStatus({ type: "", message: "" });

    try {
      const res = await axios.post(
        `http://localhost:5000/api/auth/reset-password/${token}`,
        {
          password: values.password,
          confirmPassword: values.confirmPassword,
        }
      );

      const successMsg = res.data.message || "Password reset successful! You can now login.";
      setStatus({ 
        type: "success", 
        message: successMsg 
      });
      
      // 🔔 Notification
      toast.success(successMsg);

      resetForm();
    } catch (error) {
      console.error("Reset Password Error:", error);
      const errorMsg = error.response?.data?.error || "Link invalid or expired. Please try again.";
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
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Set New Password</h2>
          <p className="text-gray-500 mt-2 text-sm">
            Please create a strong password for your account.
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

        {status.type === "success" ? (
          <div className="text-center">
            <Link 
              to="/login"
              className="inline-block w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <Formik
            initialValues={{ password: "", confirmPassword: "" }}
            validationSchema={validationSchema}
            onSubmit={handleResetPassword}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-5">
                
                <div className="relative group">
                  <FaLock className="absolute top-3.5 left-4 text-gray-400 group-focus-within:text-blue-600 transition-colors z-10" />
                  <Field
                    type="password"
                    name="password"
                    placeholder="New Password"
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
                  />
                  <ErrorMessage name="password" component="p" className="text-red-500 text-xs mt-1 ml-1" />
                </div>

                <div className="relative group">
                  <FaLock className="absolute top-3.5 left-4 text-gray-400 group-focus-within:text-blue-600 transition-colors z-10" />
                  <Field
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm New Password"
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
                  />
                  <ErrorMessage name="confirmPassword" component="p" className="text-red-500 text-xs mt-1 ml-1" />
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
                      <FaSpinner className="animate-spin" /> Resetting...
                    </>
                  ) : (
                    "Reset Password"
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
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
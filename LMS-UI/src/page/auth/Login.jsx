import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { FaEnvelope, FaLock, FaSpinner, FaExclamationCircle } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast"; // 🔔 Import Toast

const validationSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

const Login = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const loginHandler = async (values, { setSubmitting }) => {
    setServerError(""); 

    try {
      const formData = new FormData();
      if (values.email) formData.append("email", values.email);
      if (values.password) formData.append("password", values.password);

      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      console.log("Login Success:", res.data);

      const token = res.data.token || res.data.accessToken;
      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        
        // 🔔 Notification
        toast.success(`Welcome back, ${res.data.user.firstName}!`);
      } else {
        throw new Error("No access token received.");
      }

      // Redirect based on role
      const role = res.data.user?.role;
      if (role === "teacher") {
        navigate("/teacher");
      } else if (role === "student") {
        navigate("/student");
      } else {
        navigate("/dashboard");
      }

    } catch (error) {
      console.error("Login Error:", error);
      const errorMsg = error.response?.data?.error || "Login failed. Please check your credentials.";
      setServerError(errorMsg);
      
      // 🔔 Notification
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-bg px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Welcome Back</h2>
          <p className="text-gray-500 mt-2 text-sm">Login to access your dashboard</p>
        </div>

        {serverError && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 animate-pulse">
            <FaExclamationCircle className="text-xl shrink-0" />
            <span className="text-sm font-medium">{serverError}</span>
          </div>
        )}

        <Formik
          initialValues={{
            email: "",
            password: "",
          }}
          validationSchema={validationSchema}
          onSubmit={loginHandler}
        >
          {({ setFieldValue, isSubmitting }) => (
            <Form className="space-y-5">
              
              <div className="relative group">
                <FaEnvelope className="absolute top-3.5 left-4 text-gray-400 group-focus-within:text-blue-600 transition-colors z-10" />
                <Field
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
                />
                <ErrorMessage name="email" component="p" className="text-red-500 text-xs mt-1 ml-1" />
              </div>

              <div className="relative group">
                <FaLock className="absolute top-3.5 left-4 text-gray-400 group-focus-within:text-blue-600 transition-colors z-10" />
                <Field
                  type="password"
                  name="password"
                  placeholder="Password"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
                />
                <ErrorMessage name="password" component="p" className="text-red-500 text-xs mt-1 ml-1" />
              </div>

              {/* removed face-upload / camera capture UI - login by email & password only */}

              <div className="text-right">
                <Link
                  to="/forget-password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Forgot Password?
                </Link>
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
                    <FaSpinner className="animate-spin" /> Verifying...
                  </>
                ) : (
                  "Login"
                )}
              </button>

              <p className="text-center text-sm text-gray-600 mt-6">
                Don’t have an account?{" "}
                <Link
                  to="/register"
                  className="text-blue-600 font-bold hover:underline transition-all"
                >
                  Register Here
                </Link>
              </p>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default Login;
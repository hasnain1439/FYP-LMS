import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Lock, Eye, EyeOff, ArrowLeft, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

// ✅ Use Environment Variable
const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const validationSchema = Yup.object({
  currentPassword: Yup.string().required("Current password is required"),
  newPassword: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
      "Must contain uppercase, lowercase, number & special char"
    )
    .required("New password is required"),
  confirmNewPassword: Yup.string()
    .oneOf([Yup.ref("newPassword"), null], "Passwords must match")
    .required("Confirm password is required"),
});

const ChangePassword = () => {
  const navigate = useNavigate();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const changePasswordHandler = async (values, { setSubmitting, resetForm }) => {
    try {
      // 1️⃣ Get Token from Local Storage
      const token = localStorage.getItem("token");

      // 2️⃣ If no token, force login
      if (!token) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
        return;
      }

      const res = await axios.put(
        `${BACKEND_URL}/api/auth/change-password`,
        {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
          confirmPassword: values.confirmNewPassword,
        },
        {
          // 3️⃣ ADD THIS HEADER
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true 
        }
      );

      toast.success(res.data.message || "Password changed successfully!");
      resetForm();
      setTimeout(() => navigate("/login"), 2000);

    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || "Something went wrong";
      toast.error(msg);
      
      // If error is 401, redirect to login
      if(err.response && err.response.status === 401) {
          navigate("/login");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center sm:p-4 font-sans text-gray-800">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl overflow-hidden">
        
        <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100 flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-white rounded-xl border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
        </div>

        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
              <KeyRound size={32} />
            </div>
          </div>
          
          <Formik
            initialValues={{
              currentPassword: "",
              newPassword: "",
              confirmNewPassword: "",
            }}
            validationSchema={validationSchema}
            onSubmit={changePasswordHandler}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-5">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute top-3.5 left-4 text-gray-400" size={16} />
                    <Field
                      type={showCurrent ? "text" : "password"}
                      name="currentPassword"
                      placeholder="Enter current password"
                      className="w-full pl-11 pr-11 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                    />
                    <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute top-3.5 right-4 text-gray-400">
                      {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <ErrorMessage name="currentPassword" component="p" className="text-red-500 text-xs mt-1.5 font-medium ml-1" />
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">New Password</label>
                  <div className="relative">
                    <Lock className="absolute top-3.5 left-4 text-gray-400" size={16} />
                    <Field
                      type={showNew ? "text" : "password"}
                      name="newPassword"
                      placeholder="Enter new password"
                      className="w-full pl-11 pr-11 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute top-3.5 right-4 text-gray-400">
                      {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <ErrorMessage name="newPassword" component="p" className="text-red-500 text-xs mt-1.5 font-medium ml-1" />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute top-3.5 left-4 text-gray-400" size={16} />
                    <Field
                      type={showConfirm ? "text" : "password"}
                      name="confirmNewPassword"
                      placeholder="Re-enter new password"
                      className="w-full pl-11 pr-11 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute top-3.5 right-4 text-gray-400">
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <ErrorMessage name="confirmNewPassword" component="p" className="text-red-500 text-xs mt-1.5 font-medium ml-1" />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all transform active:scale-[0.98] disabled:opacity-70"
                >
                  {isSubmitting ? "Updating..." : "Update Password"}
                </button>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
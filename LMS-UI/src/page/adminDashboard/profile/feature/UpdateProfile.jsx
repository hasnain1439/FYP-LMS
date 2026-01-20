import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaCamera, FaArrowLeft, FaSave, FaUser } from "react-icons/fa";
import toast from "react-hot-toast"; // 🔔 1. Import Toast

// 👇 2. Import Standard Components
import LoadingSpinner from "../../../../component/LoadingSpinner";

// ✅ Use Environment Variable
const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const UpdateProfile = () => {
  const navigate = useNavigate();
  
  // Local state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // --- ✅ HELPER: Handle Image URLs ---
  const getSafeImage = (imgSrc) => {
    // 1. If no image, return placeholder
    if (!imgSrc || imgSrc === "undefined" || imgSrc === "null") {
      return "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
    }

    // 2. If it's a "Blob" (New file selected) OR External URL -> Return as is
    if (imgSrc.startsWith("blob:") || imgSrc.startsWith("http")) {
      return imgSrc;
    }

    // 3. If it's a backend path -> Prepend Backend URL
    return `${BACKEND_URL}${imgSrc}`;
  };

  // --- 1. Fetch Current User Data ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return navigate("/login");

        const response = await axios.get(`${BACKEND_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const userData = response.data.user || response.data;
        setUser(userData);
        
        // Set existing image preview
        if (userData.profilePicture) {
          setPreviewImage(userData.profilePicture);
        }
      } catch (err) {
        console.error("Failed to load profile", err);
        toast.error("Failed to load profile data.");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  // --- 2. Validation Schema ---
  const validationSchema = Yup.object({
    firstName: Yup.string().required("First name is required"),
    lastName: Yup.string().required("Last name is required"),
  });

  // --- 3. Handle Submit ---
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const token = localStorage.getItem("token");
      
      const formData = new FormData();
      formData.append("firstName", values.firstName);
      formData.append("lastName", values.lastName);

      if (selectedFile) {
        formData.append("profilePicture", selectedFile); 
      }

      const res = await axios.put(
        `${BACKEND_URL}/api/auth/profile`,
        formData,
        {
          headers: { 
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`
          },
        }
      );

      // 🔔 Success Toast
      toast.success("Profile updated successfully!");
      
      // Update Local Storage (to keep UI in sync immediately)
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...currentUser, ...res.data.user }));

      // Redirect back
      setTimeout(() => navigate(-1), 1000);

    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || "Failed to update profile";
      // 🔔 Error Toast
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Standard Loading
  if (loading || !user) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center py-10 px-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="text-blue-100 hover:text-white transition"
            type="button"
          >
            <FaArrowLeft />
          </button>
          <h2 className="text-lg font-bold text-white">Update Profile</h2>
        </div>

        <div className="p-8">
          
          <Formik
            initialValues={{
              firstName: user.firstName || "",
              lastName: user.lastName || "",
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ setFieldValue, isSubmitting }) => (
              <Form className="space-y-6">
                
                {/* 1. Profile Picture Upload */}
                <div className="flex flex-col items-center mb-8">
                  <div className="relative cursor-pointer group">
                    <img 
                      src={getSafeImage(previewImage)} 
                      alt="Profile Preview" 
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 shadow-sm bg-gray-50" 
                      onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"; }}
                    />
                    <label 
                      htmlFor="file-upload" 
                      className="absolute bottom-1 right-1 bg-blue-600 p-2.5 rounded-full text-white cursor-pointer hover:bg-blue-700 shadow-md transition border-2 border-white"
                    >
                      <FaCamera size={14} />
                    </label>
                    <input 
                      id="file-upload" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if(file) {
                          setSelectedFile(file);
                          setFieldValue("profilePicture", file);
                          // Create local preview URL (Blob)
                          setPreviewImage(URL.createObjectURL(file));
                        }
                      }} 
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Update Profile Picture</p>
                </div>

                {/* 2. First Name */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
                    <div className="relative">
                      <Field 
                        type="text" name="firstName" 
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition" 
                      />
                      <FaUser className="absolute top-3.5 left-3.5 text-gray-400" size={14} />
                    </div>
                    <ErrorMessage name="firstName" component="p" className="text-red-500 text-xs mt-1" />
                </div>

                {/* 3. Last Name */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
                    <div className="relative">
                      <Field 
                        type="text" name="lastName" 
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition" 
                      />
                      <FaUser className="absolute top-3.5 left-3.5 text-gray-400" size={14} />
                    </div>
                    <ErrorMessage name="lastName" component="p" className="text-red-500 text-xs mt-1" />
                </div>

                {/* Submit Buttons */}
                <div className="border-t border-gray-100 pt-6 flex justify-end gap-3 mt-4">
                  <button 
                    type="button" 
                    onClick={() => navigate(-1)} 
                    className="px-6 py-2.5 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition font-medium border border-gray-200"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200 transition font-medium disabled:opacity-70"
                  >
                    <FaSave /> {isSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>

              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default UpdateProfile;
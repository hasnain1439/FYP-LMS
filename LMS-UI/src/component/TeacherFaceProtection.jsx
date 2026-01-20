import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FaUser, FaCheckCircle, FaExclamationCircle, FaCamera } from "react-icons/fa";

const Settings = () => {
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    profilePicture: null,
    faceRegistered: false // New flag from backend
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. Fetch User Data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get("http://localhost:5000/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setUser({
          ...data.user,
          // Assuming backend returns this flag based on if faceEmbedding is not null
          faceRegistered: !!data.user.faceEmbedding 
        });
      } catch (error) {
        console.error("Failed to load profile", error);
      }
    };
    fetchProfile();
  }, []);

  // 2. Handle File Selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // 3. Upload & Register Face
  const handleSave = async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append("image", selectedFile); // Must match backend 'upload.single("image")'

    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.put(
        "http://localhost:5000/api/user/profile", // Your UserController.updateProfilePicture endpoint
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      if (data.success) {
        toast.success("Profile updated & Face ID registered!");
        setUser(prev => ({
          ...prev,
          profilePicture: data.profilePicture,
          faceRegistered: data.faceRegistered
        }));
        setSelectedFile(null);
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || "Update failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Account Settings</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        
        {/* Profile Picture Section */}
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-8 border-b border-gray-100 pb-8">
          
          {/* Image Preview */}
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-50 shadow-md">
              <img 
                src={preview || (user.profilePicture ? `http://localhost:5000${user.profilePicture}` : "https://via.placeholder.com/150")} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            
            <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
              <FaCamera size={14} />
              <input type="file" hidden accept="image/*" onChange={handleFileChange} />
            </label>
          </div>

          {/* Info & Face Status */}
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{user.firstName} {user.lastName}</h3>
              <p className="text-gray-500">{user.email}</p>
            </div>

            {/* Face ID Status Indicator */}
            <div className={`flex items-center gap-3 p-4 rounded-lg border ${
              user.faceRegistered ? "bg-green-50 border-green-100 text-green-700" : "bg-amber-50 border-amber-100 text-amber-700"
            }`}>
              {user.faceRegistered ? (
                <FaCheckCircle className="text-xl shrink-0" />
              ) : (
                <FaExclamationCircle className="text-xl shrink-0" />
              )}
              
              <div>
                <p className="font-semibold text-sm">
                  {user.faceRegistered ? "Face ID Registered" : "Face ID Not Set"}
                </p>
                <p className="text-xs opacity-90 mt-0.5">
                  {user.faceRegistered 
                    ? "You can use facial verification for classes." 
                    : "Please upload a clear profile picture to enable face verification."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button 
            onClick={handleSave}
            disabled={!selectedFile || loading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {loading ? "Processing Face ID..." : "Save Changes"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Settings;
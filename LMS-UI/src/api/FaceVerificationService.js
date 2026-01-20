import axios from "axios";

const API_BASE_URL = "http://localhost:5000";

/**
 * Face Verification Service
 * Handles all face-related API calls
 */

/**
 * Register teacher/student face with profile picture
 * @param {File} imageFile - Image file to register
 * @returns {Promise} - Response with registered face data
 */
export const registerFace = async (imageFile) => {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("profilePicture", imageFile);
  formData.append("registerFace", "true");

  try {
    const response = await axios.put(
      `${API_BASE_URL}/api/users/profile`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Verify teacher face before starting class
 * @param {File} imageFile - Image file to verify
 * @returns {Promise} - Response with verification status and meeting link
 */
export const verifyFaceForClass = async (imageFile) => {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("verifyFace", "true");

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/users/verify-face`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Check if teacher face is verified
 * @returns {Promise} - Verification status
 */
export const checkFaceVerificationStatus = async () => {
  const token = localStorage.getItem("token");

  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/users/face-verification-status`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Update face registration (re-register)
 * @param {File} imageFile - New image file
 * @returns {Promise} - Response with updated face data
 */
export const updateFaceRegistration = async (imageFile) => {
  return registerFace(imageFile);
};

/**
 * Handle API errors consistently
 * @param {Error} error - Axios error object
 * @returns {Object} - Structured error object
 */
const handleApiError = (error) => {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    if (status === 401) {
      localStorage.removeItem("token");
      return {
        status,
        message: "Session expired. Please login again.",
        error: data.error || "Unauthorized",
      };
    } else if (status === 403) {
      return {
        status,
        message: "Face verification failed. Your face does not match the registered image.",
        error: data.error || "Forbidden",
      };
    } else if (status === 400) {
      return {
        status,
        message: data.error || "Invalid image or no face detected.",
        error: data.error || "Bad Request",
      };
    } else {
      return {
        status,
        message: data.error || "An error occurred during face verification.",
        error: data.error || "Server Error",
      };
    }
  } else if (error.request) {
    return {
      status: 0,
      message: "Network error. Please check your connection.",
      error: "Network Error",
    };
  } else {
    return {
      status: 0,
      message: error.message || "An unexpected error occurred.",
      error: error.message,
    };
  }
};

export default {
  registerFace,
  verifyFaceForClass,
  checkFaceVerificationStatus,
  updateFaceRegistration,
};

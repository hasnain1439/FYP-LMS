import axios from "axios";

// ✅ Pure function to fetch all courses (with optional filters)
export const GetCourses = async (filters = {}) => {
  try {
    const params = {};

    if (filters.category) params.category = filters.category;
    if (filters.search) params.search = filters.search;

    const res = await axios.get(
      "http://localhost:5000/api/courses/getAllCourses",
      { params, withCredentials: true }
    );

    return res.data.courses;
  } catch (error) {
    console.error("Get courses API error:", error.response?.data || error);
    throw error;
  }
};
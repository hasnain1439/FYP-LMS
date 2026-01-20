import axios from "axios";

export const CreateCoursesApi = async (coursesData) => {
  try {
    const res = await axios.post(
      "http://localhost:5000/api/courses/create-course",
      coursesData,
      { withCredentials: true }
    );
    return res.data;
  } catch (error) {
    console.log("Create course API error:", error.response?.data || error);
    throw error;
  }
};

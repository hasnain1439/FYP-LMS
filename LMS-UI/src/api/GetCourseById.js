import axios from "axios";

export const GetCourseById = async (courseId) => {
  if (!courseId) throw new Error("Course ID is required");

  try {
    const res = await axios.get(
      `http://localhost:5000/api/courses/${courseId}`,
      { withCredentials: true } // ✅ Correct
    );

    return res.data.course;
  } catch (error) {
    console.error(
      "Get course by ID API error:",
      error.response?.data || error
    );
    throw error;
  }
};
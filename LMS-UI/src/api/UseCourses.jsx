import { useState, useEffect } from "react";
import axios from "axios";

export const useCourses = () => {
  const [courses, setCourses] = useState([]);
  const [waiting, setWaiting] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setWaiting(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/courses/getAllCourses",
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }
        );
        setCourses(res.data.courses || []);
      } catch (err) {
        console.error("Failed to fetch courses", err);
        setError("Failed to load courses.");
      } finally {
        setWaiting(false);
      }
    };

    fetchCourses();
  }, []);

  return { courses, waiting, error };
};

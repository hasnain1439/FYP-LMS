import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaBookOpen, FaFilter, FaDownload } from "react-icons/fa";
import LoadingSpinner from "../../../component/LoadingSpinner";

const BACKEND_URL = "http://localhost:5000";

export default function TeacherAttendance() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Fetch Teacher's Courses for Dropdown
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        // Ensure this endpoint exists in your CourseController
        const res = await axios.get(
          `${BACKEND_URL}/api/courses/teacher/my-courses`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setCourses(res.data.courses || []);
        if (res.data.courses?.length > 0) {
          setSelectedCourse(res.data.courses[0].id); // Auto-select first course
        }
      } catch (err) {
        console.error("Failed to fetch courses", err);
      }
    };
    fetchCourses();
  }, []);

  // 2. Fetch Attendance when Course Selection Changes
  useEffect(() => {
    if (!selectedCourse) return;

    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${BACKEND_URL}/api/attendance/teacher/course/${selectedCourse}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setRecords(res.data.attendance || []);
      } catch (error) {
        console.error("Failed to fetch records", error);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [selectedCourse]);

  return (
    <div className="max-w-7xl mx-auto font-sans">
      {/* Table */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden min-h-[400px]">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FaBookOpen className="text-blue-600" /> Attendance Report
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              View attendance logs for your courses.
            </p>
          </div>

          {/* Course Selector */}
          <div className="relative">
            <FaFilter className="absolute left-3 top-3.5 text-gray-400 text-sm" />
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-[200px]"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No records found for this course.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">
                    Student
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">
                    Topic
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="p-4 font-semibold text-gray-900">
                      {r.studentName}
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {r.studentEmail}
                    </td>
                    <td className="p-4 text-sm text-gray-700">
                      {r.topic || "-"}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {new Date(r.date).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

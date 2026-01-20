"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { CiSearch } from "react-icons/ci";
import {
  FaPlus,
  FaRegEye,
  FaEdit,
  FaTrash,
  FaTimes,
  FaUserGraduate,
  FaBookOpen,
  FaCalendarAlt,
  FaChartLine,
  FaSave,
} from "react-icons/fa";
import toast from "react-hot-toast"; // 🔔 1. Import Toast

// ✅ Import Standard Components (Using the path structure from your previous files)
import LoadingSpinner from "../../../../component/LoadingSpinner";
import EmptyState from "../../../../component/EmptyState";

import { GetCourses } from "../../../../api/GetCourses";

// ✅ URLs
const API_URL = "http://localhost:5000/api/enrollments";

// ✅ HELPER: Sends Token + Cookies
const getAuthConfig = () => {
  const token = localStorage.getItem("token");
  return {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    withCredentials: true,
  };
};

// Helper for status styling - refined colors
const getStatusStyles = (status) => {
  switch (status?.toLowerCase()) {
    case "active":
      return "bg-green-50 text-green-700 border border-green-200";
    case "dropped":
      return "bg-red-50 text-red-700 border border-red-200";
    case "completed":
      return "bg-blue-50 text-blue-700 border border-blue-200";
    default:
      return "bg-gray-50 text-gray-600 border border-gray-200";
  }
};

export default function EnrollmentsSection() {
  // --- STATE ---
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showModal, setShowModal] = useState(false); // Add Student Modal
  const [viewModal, setViewModal] = useState(false); // View Modal
  const [editModal, setEditModal] = useState(false); // Edit Modal

  // Data States
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [studentEmail, setStudentEmail] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [coursesList, setCoursesList] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Edit Form State
  const [editFormData, setEditFormData] = useState({
    id: "",
    status: "active",
    progress: 0,
  });

  // --- 1. FETCH ENROLLMENTS ---
  useEffect(() => {
    fetchData();
  }, [searchText, filterStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL, {
        ...getAuthConfig(),
        params: {
          page: 1,
          limit: 10,
          search: searchText,
          status: filterStatus === "All" ? "" : filterStatus,
        },
      });
      setEnrollments(response.data.data || []);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      // 🔔 Error Toast
      toast.error("Failed to load enrollments.");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. FETCH COURSES ---
  useEffect(() => {
    if (showModal) {
      const fetchDataCourses = async () => {
        try {
          setLoadingCourses(true);
          const data = await GetCourses();
          setCoursesList(Array.isArray(data) ? data : data.data || []);
        } catch (err) {
          console.error("Failed to load courses:", err);
          toast.error("Failed to load courses list.");
        } finally {
          setLoadingCourses(false);
        }
      };
      fetchDataCourses();
    }
  }, [showModal]);

  // --- 3. CREATE ENROLLMENT ---
  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) return toast.error("Please select a course");

    try {
      await axios.post(
        API_URL,
        {
          studentEmail: studentEmail,
          courseId: selectedCourseId,
        },
        getAuthConfig(),
      );

      // 🔔 Success Toast
      toast.success("Student Enrolled Successfully!");

      setShowModal(false);
      setStudentEmail("");
      setSelectedCourseId("");
      fetchData();
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to enroll student.";
      // 🔔 Error Toast
      toast.error(msg);
    }
  };

  // --- 4. DROP STUDENT ---
  const handleDropStudent = async (id) => {
    if (confirm("Are you sure you want to drop this student?")) {
      try {
        await axios.put(
          `${API_URL}/${id}`,
          { status: "dropped" },
          getAuthConfig(),
        );

        // 🔔 Success Toast
        toast.success("Student dropped successfully.");
        fetchData();
      } catch (error) {
        const msg = error.response?.data?.message || "Failed to drop student";
        // 🔔 Error Toast
        toast.error(msg);
      }
    }
  };

  // --- 5. VIEW HANDLER ---
  const handleView = (item) => {
    setSelectedEnrollment(item);
    setViewModal(true);
  };

  // --- 6. EDIT HANDLER (Open Modal) ---
  const handleEdit = (item) => {
    setEditFormData({
      id: item.id,
      status: item.status,
      progress: item.progress,
    });
    setEditModal(true);
  };

  // --- 7. UPDATE HANDLER (Save Changes) ---
  const handleUpdateEnrollment = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${API_URL}/${editFormData.id}`,
        {
          status: editFormData.status,
          progress: Number(editFormData.progress),
        },
        getAuthConfig(),
      );

      // 🔔 Success Toast
      toast.success("Enrollment Updated Successfully!");

      setEditModal(false);
      fetchData(); // Refresh Table
    } catch (error) {
      console.error(error);
      const msg =
        error.response?.data?.message || "Failed to update enrollment";
      // 🔔 Error Toast
      toast.error(msg);
    }
  };

  return (
    <div className="w-full space-y-8 bg-gray-50 min-h-screen font-sans text-gray-800">
      {/* --- TOP BAR --- */}
      <div className="bg-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row sm:justify-between items-center gap-4">
        {/* Search & Filter Group */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-72 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CiSearch className="text-gray-400 text-xl group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="search"
              placeholder="Search by student name or email..."
              className="block w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative w-full sm:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray rounded-xl text-sm text-gray-700 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="active">Active</option>
              <option value="dropped">Dropped</option>
              <option value="completed">Completed</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Enroll Button */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all duration-200 transform hover:-translate-y-0.5 font-medium text-sm"
        >
          <FaPlus size={14} />
          <span>Enroll Student</span>
        </button>
      </div>

      {/* --- TABLE CARD --- */}
      <div className="bg-white rounded-3xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Enrolled On
                </th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider w-48">
                  Progress
                </th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                // ✅ 2. Standard Loading Spinner
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : enrollments.length === 0 ? (
                // ✅ 3. Standard Empty State
                <tr>
                  <td colSpan={6} className="py-12">
                    <EmptyState message="No enrollments found matching your criteria." />
                  </td>
                </tr>
              ) : (
                enrollments.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/80 transition-colors duration-150 group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-100">
                          {item.studentName?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {item.studentName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.studentEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-md border border-gray-200 whitespace-nowrap">
                        {item.courseName.length > 30
                          ? item.courseName.slice(0, 30) + "..."
                          : item.courseName}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(item.enrolledAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs font-medium text-gray-500">
                          <span>{item.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              item.progress === 100
                                ? "bg-green-500"
                                : "bg-blue-500"
                            }`}
                            style={{ width: `${item.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusStyles(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end items-center gap-2 ">
                        <button
                          onClick={() => handleView(item)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="View Details"
                        >
                          <FaRegEye size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <FaEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDropStudent(item.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Drop Student"
                        >
                          <FaTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md transform transition-all scale-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Enroll Student
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Add a new student to a course.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <FaTimes size={16} />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Student Email
                </label>
                <input
                  required
                  type="email"
                  className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Select Course
                </label>
                <div className="relative">
                  <select
                    required
                    className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none appearance-none cursor-pointer"
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    disabled={loadingCourses}
                  >
                    <option value="">
                      {loadingCourses
                        ? "Loading courses..."
                        : "Select a course..."}
                    </option>
                    {!loadingCourses &&
                      coursesList.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.name || course.title}
                        </option>
                      ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      ></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                >
                  Enroll Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- VIEW MODAL --- */}
      {viewModal && selectedEnrollment && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
            <div className="bg-gray-50/50 px-8 py-6 flex justify-between items-center border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                  <FaUserGraduate size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Enrollment Details
                  </h3>
                  <p className="text-xs text-gray-500">Full information card</p>
                </div>
              </div>
              <button
                onClick={() => setViewModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="flex items-center gap-5">
                <div className="h-20 w-20 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 text-3xl font-bold border border-blue-100 shadow-inner">
                  {selectedEnrollment.studentName?.charAt(0).toUpperCase() ||
                    "U"}
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-gray-900">
                    {selectedEnrollment.studentName}
                  </h4>
                  <p className="text-gray-500">
                    {selectedEnrollment.studentEmail}
                  </p>
                  <span
                    className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusStyles(selectedEnrollment.status)}`}
                  >
                    {selectedEnrollment.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1.5">
                    <FaBookOpen className="text-blue-400" /> Course
                  </p>
                  <p className="font-semibold text-gray-800 text-sm">
                    {selectedEnrollment.courseName}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1.5">
                    <FaCalendarAlt className="text-green-400" /> Enrolled On
                  </p>
                  <p className="font-semibold text-gray-800 text-sm">
                    {new Date(selectedEnrollment.enrolledAt).toLocaleDateString(
                      undefined,
                      {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      },
                    )}
                  </p>
                </div>
                <div className="col-span-2 space-y-2">
                  <div className="flex justify-between items-end">
                    <p className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1.5">
                      <FaChartLine className="text-purple-400" /> Progress
                    </p>
                    <span className="text-sm font-bold text-blue-600">
                      {selectedEnrollment.progress || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full"
                      style={{ width: `${selectedEnrollment.progress || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {editModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm transform transition-all scale-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Update Enrollment
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Modify status and progress.
                </p>
              </div>
              <button
                onClick={() => setEditModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <FaTimes size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateEnrollment} className="space-y-6">
              {/* Status Dropdown */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Status
                </label>
                <div className="relative">
                  <select
                    className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none appearance-none cursor-pointer"
                    value={editFormData.status}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="active">Active</option>
                    <option value="dropped">Dropped</option>
                    <option value="completed">Completed</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      ></path>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Progress Bar Input */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Progress
                  </label>
                  <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    {editFormData.progress}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  value={editFormData.progress}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      progress: e.target.value,
                    })
                  }
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditModal(false)}
                  className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 shadow-lg shadow-green-200 transition-all flex items-center gap-2"
                >
                  <FaSave size={14} /> Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

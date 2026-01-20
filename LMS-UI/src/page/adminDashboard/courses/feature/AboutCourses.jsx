import { useState, useEffect } from "react";
import { CiSearch } from "react-icons/ci";
import { FaPlus } from "react-icons/fa";
import { FiEdit } from "react-icons/fi";
import { LuUsers } from "react-icons/lu";
import { MdOutlineDeleteOutline, MdOutlineRemoveRedEye } from "react-icons/md";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast"; // 🔔 1. Import Toast

import UpdateCourses from "./UpdateCourses.jsx";
import AddCourses from "./AddCourses";
import { GetCourses } from "../../../../api/GetCourses";
import LoadingSpinner from "../../../../component/LoadingSpinner.jsx";
import EmptyState from "../../../../component/EmptyState.jsx";


export default function AboutCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [filterCategory, setFilterCategory] = useState("All");
  const [searchText, setSearchText] = useState("");

  const [editCourse, setEditCourse] = useState(null);
  const [addCourses, setAddCourses] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [deletePopup, setDeletePopup] = useState(false);

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const filters = {
          category: filterCategory === "All" ? undefined : filterCategory,
          search: searchText || undefined,
        };
        const data = await GetCourses(filters);
        setCourses(data || []);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
        setError("Failed to load courses.");
        // 🔔 Error Notification
        toast.error("Failed to load courses.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [filterCategory, searchText]);

  // Edit course
  const editHandler = (course) => setEditCourse({ ...course });

  const handleSaveEdit = async (updatedCourse) => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.put(
        `http://localhost:5000/api/courses/${updatedCourse.id}`,
        updatedCourse,
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );

      setCourses((prev) =>
        prev.map((c) => (c.id === updatedCourse.id ? response.data.course : c))
      );
      setEditCourse(null);
      // 🔔 Success Notification
      toast.success("Course updated successfully!");
    } catch (err) {
      console.error("Update course failed:", err.response?.data || err);
      // 🔔 Error Notification
      const msg = err.response?.data?.error || "Failed to update course.";
      toast.error(msg);
    }
  };

  // Delete course
  const deleteHandler = (index) => {
    setDeleteIndex(index);
    setDeletePopup(true);
  };
  // delete course
  const confirmationHandler = async () => {
    if (deleteIndex === null) return;
    const token = localStorage.getItem("token");
    const courseId = courses[deleteIndex].id;
    try {
      await axios.delete(`http://localhost:5000/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setCourses((prev) => prev.filter((_, idx) => idx !== deleteIndex));
      // 🔔 Success Notification
      toast.success("Course deleted successfully!");
    } catch (err) {
      console.error("Delete course failed:", err.response?.data || err);
      // 🔔 Error Notification
      const msg = err.response?.data?.error || "Failed to delete course.";
      toast.error(msg);
    } finally {
      setDeletePopup(false);
      setDeleteIndex(null);
    }
  };

  // Add course
  const handleAddCourse = (newCourse) => {
    setCourses((prev) => [newCourse, ...prev]);
    setAddCourses(false);
    // 🔔 Success Notification
    toast.success("Course added successfully!");
  };

  return (
    <div className="space-y-8 bg-gray-50 min-h-screen font-sans text-gray-800">
      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-md ">
        {/* Search Box */}
        <div className="w-full sm:w-1/3 flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-200">
          <CiSearch className="text-gray-400 text-xl" />
          <input
            type="search"
            placeholder="Search for courses..."
            className="bg-transparent border-none outline-none w-full text-sm text-gray-700 placeholder-gray-400"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        {/* Filter & Add Button */}
        <div className="flex items-center flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-3 w-full sm:w-48 bg-gray-50 border border-gray rounded-xl text-sm font-medium text-gray-600 focus:ring-2 focus:ring-blue-100 cursor-pointer outline-none transition-all hover:bg-gray-100"
          >
            <option value="All">All Categories</option>
            <option value="Programming">Programming</option>
            <option value="Design">Design</option>
            <option value="Database">Database</option>
            <option value="Web Development">Web Development</option>
            <option value="Business">Business</option>
          </select>

          <button
            onClick={() => setAddCourses(true)}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-medium shadow-lg shadow-blue-200 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <FaPlus className="text-sm" /> <span>Add Course</span>
          </button>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // ✅ 3. Use Loading Spinner
          <div className="col-span-full">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="col-span-full text-center text-red-500 py-10 bg-red-50 rounded-xl">
            {error}
          </div>
        ) : courses.length === 0 ? (
          // ✅ 4. Use Empty State
          <div className="col-span-full">
            <EmptyState message="No courses found matching your criteria." />
          </div>
        ) : (
          courses.map((course, idx) => (
            <div
              key={course.id}
              className="group bg-white rounded-2xl p-5 shadow-md hover:shadow-xl hover:border-blue-100 transition-all duration-300 flex flex-col justify-between h-full"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 pr-2">
                    <h2 className="text-lg font-bold text-gray-800 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                      {course.name}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1 font-medium tracking-wide uppercase">
                      {(course.categories || []).join(", ")}
                    </p>
                  </div>
                  {course.status && (
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                        course.status === "active"
                          ? "bg-green-100 text-green-700"
                          : course.status === "completed"
                          ? "bg-blue-100 text-blue-700"
                          : course.status === "draft"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {course.status}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-6 line-clamp-3 leading-relaxed">
                   {course.description || "No description provided."}
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center py-4 border-t border-gray-50 text-sm">
                   <div className="flex items-center gap-2 text-gray-600">
                     <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600">
                       <LuUsers size={16} />
                     </div>
                     <span className="font-semibold">{course.enrollmentCount || 0}</span>
                     <span className="text-gray-400 font-normal">Students</span>
                   </div>
                   <div className="text-gray-500 font-medium bg-gray-50 px-3 py-1 rounded-lg text-xs">
                     {course.totalSessions || 0} Weeks
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-2 pt-2">
                  <Link
                    to={`/teacher/course/${course.id}`}
                    className="flex items-center justify-center gap-2 bg-gray-50 border border-gray hover:bg-gray-100 text-gray-700 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  >
                    <MdOutlineRemoveRedEye size={16} /> View
                  </Link>

                  <button
                    onClick={() => editHandler(course)}
                    className="flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  >
                    <FiEdit size={15} /> Edit
                  </button>

                  <button
                    onClick={() => deleteHandler(idx)}
                    className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  >
                    <MdOutlineDeleteOutline size={18} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Popup */}
      {deletePopup && (
        <div className="fixed -inset-10 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full transform transition-all scale-100">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto text-red-500">
              <MdOutlineDeleteOutline size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
              Delete Course?
            </h2>
            <p className="text-gray-500 text-center mb-8 text-sm leading-relaxed">
              Are you sure you want to remove this course? This action cannot be undone and all data will be lost.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletePopup(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmationHandler}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-red-200 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Courses Popup */}
      {editCourse && (
        <UpdateCourses
          course={editCourse}
          onClose={() => setEditCourse(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Add Course Popup */}
      {addCourses && (
        <AddCourses
          onClose={() => setAddCourses(false)}
          setNewCourse={handleAddCourse}
        />
      )}
    </div>
  );
}
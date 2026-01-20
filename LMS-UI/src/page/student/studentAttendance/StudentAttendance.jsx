import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaClock } from "react-icons/fa";
import LoadingSpinner from "../../../component/LoadingSpinner"; 

// ✅ Update with your backend URL
const BACKEND_URL = "http://localhost:5000";

export default function StudentAttendance() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BACKEND_URL}/api/attendance/student/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) {
          setHistory(res.data.history);
        }
      } catch (error) {
        console.error("Failed to load attendance:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto font-sans">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
          <FaCalendarAlt size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
          <p className="text-sm text-gray-500">Track your class participation history.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        {history.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-gray-400">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <FaClock size={24} className="opacity-30" />
            </div>
            <p>No attendance records found yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Session Topic</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {history.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50/80 transition duration-150">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900">
                          {new Date(record.date).toLocaleDateString(undefined, { 
                            weekday: 'short', month: 'short', day: 'numeric' 
                          })}
                        </span>
                        <span className="text-xs text-gray-500 mt-0.5">
                          {new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-800 bg-gray-100 px-2 py-1 rounded-md">
                        {record.courseName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {record.topic || "Regular Class Session"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                        record.status === 'Present' 
                          ? 'bg-green-50 text-green-700 border-green-100' 
                          : 'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        {record.status === 'Present' ? <FaCheckCircle size={10} /> : <FaTimesCircle size={10} />}
                        {record.status}
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
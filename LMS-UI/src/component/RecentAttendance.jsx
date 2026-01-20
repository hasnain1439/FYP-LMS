import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaUserCheck, FaChevronRight } from "react-icons/fa";

const BACKEND_URL = "http://localhost:5000";

export default function RecentAttendance() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BACKEND_URL}/api/attendance/teacher/dashboard-history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) setData(res.data.records);
      } catch (error) {
        console.error("Failed to fetch recent attendance", error);
      }
    };
    fetchData();
  }, []);

  if (!data || data.length === 0) return null; // Don't show if empty

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <div className="p-2 bg-green-100 text-green-600 rounded-lg">
            <FaUserCheck size={16} />
          </div>
          Recent Arrivals
        </h2>
        <button className="text-sm text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1">
          View All <FaChevronRight size={10} />
        </button>
      </div>

      <div className="space-y-4">
        {data.map((record, index) => (
          <div key={index} className="flex items-center justify-between group p-2 hover:bg-gray-50 rounded-xl transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                {record.studentName?.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 leading-tight">{record.studentName}</p>
                <p className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 mt-0.5">
                  {record.courseName}
                </p>
              </div>
            </div>
            <div className="text-right">
               <p className="text-xs font-bold text-gray-800">
                {new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
               </p>
               <p className="text-[10px] text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                 Verified
               </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
import React from "react";
import { LuUsers, LuClock } from "react-icons/lu";
import EmptyState from "../../../../component/EmptyState";


function RecentActiveStudent({ data }) {
  // ✅ UPDATED: Use standard EmptyState component
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-3xl shadow-md h-full flex flex-col">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Recent Activity</h3>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState message="No recent activity found." />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-3xl shadow-md h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800">Recent Activity</h3>
        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md cursor-pointer hover:bg-blue-100 transition">View All</span>
      </div>
      
      <div className="flex flex-col space-y-4">
        {data.map((activity, index) => (
          <div 
            key={index} 
            className="group flex items-start gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors duration-200"
          >
            {/* Icon Container */}
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
              <LuUsers className="text-lg" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-800 truncate leading-tight">
                {activity.message}
              </h4>
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                <LuClock size={12} />
                <span>{activity.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecentActiveStudent;
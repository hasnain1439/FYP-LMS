import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import EmptyState from "../../../../component/EmptyState";

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl">
        <p className="text-sm font-bold text-gray-700">{label}</p>
        <p className="text-sm text-blue-600 font-medium">
          {`${payload[0].value} Students`}
        </p>
      </div>
    );
  }
  return null;
};

const LineCharts = ({ data }) => {
  // ✅ 1. Standard Empty State (No Notifications needed here)
  if (!data || data.length === 0) {
    return <EmptyState message="No enrollment data available" />;
  }

  return (
    <div className="bg-white p-6 rounded-3xl shadow-md h-full">
      <h3 className="text-lg font-bold text-gray-800 mb-6">Monthly Enrollments</h3>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9CA3AF', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9CA3AF', fontSize: 12 }} 
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB' }} />
            <Bar 
              dataKey="count" 
              name="Students" 
              fill="#3B82F6" 
              radius={[6, 6, 6, 6]} 
              barSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LineCharts;
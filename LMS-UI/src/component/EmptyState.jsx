import React from 'react';

const EmptyState = ({ message = "No data available" }) => {
  return (
    <div className="flex flex-col items-center justify-center h-64 w-full border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
      <svg 
        className="w-16 h-16 text-gray-400 mb-3" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p className="text-gray-500 font-medium text-lg">{message}</p>
    </div>
  );
};

export default EmptyState;
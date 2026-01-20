import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center h-64 w-full">
      {/* Standard Tailwind CSS Spinner */}
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="mt-4 text-gray-500 font-medium animate-pulse">Loading...</p>
    </div>
  );
};

export default LoadingSpinner;
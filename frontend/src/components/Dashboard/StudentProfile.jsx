import React from "react";

export default function StudentProfile({ name, rollNo, course, email, image }) {
  return (
    <div className="bg-white shadow-md rounded-2xl p-6 max-w-md mx-auto">
      {/* Profile Picture + Basic Info */}
      <div className="flex items-center space-x-4">
        <img
          src={image || "https://via.placeholder.com/100"}
          alt="Student Avatar"
          className="w-20 h-20 rounded-full object-cover border"
        />
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            {name || "Unknown Student"}
          </h2>
          <p className="text-gray-500 text-sm">{course || "No Course Assigned"}</p>
        </div>
      </div>

      {/* Details */}
      <div className="mt-4 space-y-2 text-sm text-gray-600">
        <p><span className="font-medium">Roll No:</span> {rollNo || "N/A"}</p>
        <p><span className="font-medium">Email:</span> {email || "Not Provided"}</p>
      </div>
    </div>
  );
}

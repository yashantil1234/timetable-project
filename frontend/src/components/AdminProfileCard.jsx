import React, { useState } from "react";

export default function AdminProfileCard() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {/* Admin Card (clickable) */}
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center space-x-3 p-3 rounded-xl cursor-pointer bg-blue-50 hover:bg-blue-100 transition"
      >
        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold">
          A
        </div>
        <div>
          <h2 className="font-semibold text-gray-800">Admin User</h2>
          <p className="text-sm text-gray-500">Administrator</p>
        </div>
      </div>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute bottom-14 left-0 w-56 bg-white shadow-lg rounded-lg border p-4 z-50">
          <h3 className="font-bold text-gray-700 mb-2">Admin Details</h3>
          <p className="text-sm text-gray-600">Name: Admin User</p>
          <p className="text-sm text-gray-600">Email: admin@example.com</p>
          <p className="text-sm text-gray-600">Role: Administrator</p>

          <button
            onClick={() => alert("Logging out...")}
            className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

import React from "react";

export default function ConflictChecker({ conflicts }) {
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Detected Conflicts</h2>

      {conflicts.length === 0 ? (
        <p className="text-green-600">✅ No conflicts found!</p>
      ) : (
        <ul className="space-y-3">
          {conflicts.map((conflict, index) => (
            <li
              key={index}
              className="bg-red-100 border border-red-300 text-red-700 p-3 rounded"
            >
              <strong>{conflict.type.toUpperCase()} Conflict:</strong>{" "}
              {conflict.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

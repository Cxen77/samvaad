import React from "react";
import { useNavigate } from "react-router-dom";
import CircularProgress from "./CircularProgress";

function Recommended({ people }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">

      <div className="p-5 bg-gradient-to-r from-sky-50 to-white border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900">Recommended</h3>
        <p className="text-sm text-gray-600">Based on your skills</p>
      </div>

      <div className="divide-y divide-gray-200 flex-1 overflow-y-auto">
        {people.map((person, index) => (
          <div
            key={index}
            className="p-4 flex items-center gap-4 hover:bg-gray-50 transition cursor-pointer"
            onClick={() => navigate(`/profile/${person.username || 'demo'}`)} // Fallback for demo data
          >
            <img
              src={person.img || `https://ui-avatars.com/api/?name=${person.name}&background=random`}
              alt={person.name}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-100"
            />

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 truncate">{person.name}</h3>
              <p className="text-sm text-gray-600 truncate">{person.skill}</p>
            </div>

            <CircularProgress percentage={person.match} color={person.color} />
          </div>
        ))}
      </div>

      <div className="p-4 text-center border-t border-gray-200">
        <button className="text-sm font-bold text-sky-600 hover:text-sky-700 hover:underline">
          View All Recommendations →
        </button>
      </div>
    </div>
  );
}

export default Recommended;

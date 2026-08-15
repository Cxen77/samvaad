import React from "react";

function CircularProgress({ percentage, color }) {
  const emptyColor = "#e5e7eb";

  return (
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        background: `conic-gradient(${color} ${percentage}%, ${emptyColor} 0)`
      }}
    >
      <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center">
        <span className="font-bold text-sm" style={{ color }}>
          {percentage}%
        </span>
      </div>
    </div>
  );
}

export default CircularProgress;

import React from "react";

const LoaderR = () => {
  return (
    <div className="custom-loader-overlay">
      <div className="loader-ball">
        <div className="loader-fill" />
        <img
          src="/favicon-leaf.png"
          alt="Loading"
          className="loader-text"
          style={{ width: "64px", height: "64px", objectFit: "contain" }}
        />
      </div>
    </div>
  );
};

export default LoaderR;

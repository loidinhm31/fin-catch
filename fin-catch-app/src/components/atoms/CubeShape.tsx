import React from "react";

export interface CubeShapeProps {
  className?: string;
  variant?: "default" | "yellow" | "pink";
}

export const CubeShape: React.FC<CubeShapeProps> = ({ className = "", variant = "default" }) => (
  <div
    className={`cube-decoration ${variant === "yellow" ? "cube-yellow" : variant === "pink" ? "cube-pink" : ""} ${className}`}
  ></div>
);

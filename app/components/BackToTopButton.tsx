"use client";

import React from "react";

type BackToTopButtonProps = {
  className?: string;
  style?: React.CSSProperties;
};

export default function BackToTopButton({ className = "", style }: BackToTopButtonProps) {
  const handleClick = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const combinedClassName = `cursor-pointer ${className}`.trim();

  return (
    <button
      className={combinedClassName}
      style={style}
      onClick={handleClick}
      aria-label="Back to top"
    >
      Back to Top
    </button>
  );
}

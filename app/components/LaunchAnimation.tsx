"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function LaunchAnimation() {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    const hasLaunched = sessionStorage.getItem("hasLaunched");

    if (!hasLaunched) {
      setShowAnimation(true);
      sessionStorage.setItem("hasLaunched", "true");

      const timer = setTimeout(() => {
        setShowAnimation(false);
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, []);

  if (!showAnimation) return null;

  return (
    <div
      id="launch-animation"
      className="launch-screen"
      suppressHydrationWarning
    >
      <div className="rocket">
        <Image
          src="/jetpack_logo.png"
          alt="Jetpack"
          width={500}
          height={500}
          className="rocket-image"
          priority
        />
        <div className="flame"></div>
      </div>
    </div>
  );
}

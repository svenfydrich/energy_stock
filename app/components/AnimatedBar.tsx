"use client";

import { motion, AnimatePresence } from "framer-motion";

export function AnimatedBar() {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 80, damping: 18, mass: 1.5 }}
        className="relative w-full overflow-hidden py-1"
      >
        {/* Animated gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, #32de84, #229e5c, #6fffc2, #eafff4, #32de84, #229e5c, #6fffc2, #32de84)",
            backgroundSize: "200% 100%",
            animation: "gradient-flow 4s linear infinite",
          }}
        />

        {/* Shimmer */}
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }}
          className="absolute inset-0 bg-linear-to-r from-transparent via-[#eafff4]/40 to-transparent transform skew-x-12"
        />

        {/* Glowing border */}
        <motion.div
          animate={{ opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 border-t-2 border-b-2 border-white/30"
        />

        {/* Spacer to give the bar its height */}
        <div className="relative h-2" />
      </motion.div>
    </AnimatePresence>
  );
}

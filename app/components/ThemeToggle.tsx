"use client";

import { useTheme } from "./ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme, isHydrated } = useTheme();

  const cycleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // Prevent rendering until hydration is complete to avoid hydration mismatch
  if (!isHydrated) {
    return (
      <div
        className={`
        relative w-10 h-10 
        bg-white dark:bg-neutral-900 
        border border-neutral-200 dark:border-neutral-700 
        rounded-full text-sm font-medium 
        text-neutral-600 dark:text-neutral-300 
        transition-all duration-200 
        shadow-sm flex items-center justify-center
        ${className}
      `}
      >
        <div className="w-4 h-4 animate-pulse bg-neutral-300 dark:bg-neutral-600 rounded" />
      </div>
    );
  }

  const getIcon = () => {
    if (theme === "dark") {
      return (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      );
    } else {
      return (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      );
    }
  };

  const getLabel = () => {
    return theme === "light" ? "Light" : "Dark";
  };

  return (
    <motion.button
      onClick={cycleTheme}
      className={`
        relative w-10 h-10 
        bg-white dark:bg-neutral-900 
        border border-neutral-200 dark:border-neutral-700 
        rounded-full text-sm font-medium 
        text-neutral-600 dark:text-neutral-300 
        hover:bg-neutral-50 dark:hover:bg-neutral-800 
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 
        transition-all duration-200 
        shadow-sm hover:shadow-md
        flex items-center justify-center
        ${className}
      `}
      whileTap={{ scale: 0.95 }}
      title={`Current: ${getLabel()}. Click to switch theme.`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={theme}
          initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          {getIcon()}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}

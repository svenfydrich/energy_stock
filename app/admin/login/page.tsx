"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useToasts } from "@/app/components/ToastProvider";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { success, error } = useToasts();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        success("Login successful!");
        router.push("/admin/dashboard");
        router.refresh();
      } else {
        error(data.error || "Invalid password");
      }
    } catch (err) {
      console.error(err);
      error("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-white text-neutral-900 p-8 w-full max-w-md"
      >
        <h1 className="text-3xl font-extrabold mb-2 text-center">
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Admin Login
          </span>
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center mb-8">
          Enter your password to access the admin dashboard
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter admin password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !password}
            className="btn btn-primary w-full text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:opacity-40 disabled:pointer-events-none"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

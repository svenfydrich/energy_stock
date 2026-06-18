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
        className="card-no-shimmer bg-neutral-900 p-8 w-full max-w-md"
      >
        <h1 className="text-3xl font-extrabold mb-2 text-center" style={{ color: "#32de84" }}>
          Admin Login
        </h1>
        <p className="text-sm text-neutral-400 text-center mb-8">
          Enter your password to access the admin dashboard
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-neutral-300 mb-2"
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
              className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-neutral-600/40 bg-transparent text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#32de84] focus:border-[#32de84]/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              placeholder="Enter admin password"
            />
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isLoading || !password}
              className="px-7 py-2 rounded-full border border-black text-black text-lg font-semibold disabled:opacity-40 disabled:pointer-events-none"
              style={{ backgroundColor: "#32de84", boxShadow: "none" }}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

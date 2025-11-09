"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useToasts } from "@/app/components/ToastProvider";
import DrinkRefillView from "../components/DrinkRefillView";
import WishlistAdminView from "../components/WishlistAdminView";

type PurchaseStats = {
  totalPurchases: number;
  purchasesToday: number;
  purchasesThisWeek: number;
  purchasesThisMonth: number;
  topDrinks: Array<{
    drinkId: number;
    drinkName: string;
    count: number;
  }>;
  recentPurchases: Array<{
    id: number;
    drinkName: string;
    customerName: string | null;
    createdAt: string;
  }>;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<PurchaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"stats" | "refill" | "wishlist">(
    "stats"
  );
  const router = useRouter();
  const { error } = useToasts();

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/auth", {
        credentials: "include", // Ensure cookies are sent
      });
      const data = await res.json();
      if (data.authenticated) {
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
        router.replace("/admin/login"); // Use replace to prevent going back
      }
    } catch (err) {
      console.error(err);
      setAuthenticated(false);
      router.replace("/admin/login");
    }
  }, [router]);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/stats");
      if (!res.ok) {
        throw new Error("Failed to fetch stats");
      }
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
      error("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    // Always check auth via API (cookies are httpOnly and not accessible from client)
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authenticated) {
      fetchStats();
    }
  }, [authenticated, fetchStats]);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Show loading while checking authentication
  if (authenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="flex items-center gap-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
          Verifying access...
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated (will redirect)
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-sm text-neutral-500">Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="w-full max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Admin Dashboard
              </span>
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Manage inventory and view purchase statistics
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-outline text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400"
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setActiveTab("stats")}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "stats"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
          >
            Statistics
          </button>
          <button
            onClick={() => setActiveTab("refill")}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "refill"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
          >
            Drink Refill
          </button>
          <button
            onClick={() => setActiveTab("wishlist")}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "wishlist"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
          >
            Wishlist
          </button>
        </div>

        {/* Content */}
        {activeTab === "wishlist" ? (
          <WishlistAdminView />
        ) : activeTab === "stats" ? (
          <div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="card bg-white text-neutral-900 p-6 animate-pulse"
                  >
                    <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded mb-4" />
                    <div className="h-8 w-16 bg-neutral-200 dark:bg-neutral-800 rounded" />
                  </div>
                ))}
              </div>
            ) : stats ? (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card bg-white text-neutral-900 p-6"
                  >
                    <p className="text-xs uppercase tracking-wide text-indigo-600 mb-2">
                      Total Purchases
                    </p>
                    <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                      {stats.totalPurchases}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="card bg-white text-neutral-900 p-6"
                  >
                    <p className="text-xs uppercase tracking-wide text-indigo-600 mb-2">
                      Today
                    </p>
                    <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                      {stats.purchasesToday}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="card bg-white text-neutral-900 p-6"
                  >
                    <p className="text-xs uppercase tracking-wide text-indigo-600 mb-2">
                      This Week
                    </p>
                    <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                      {stats.purchasesThisWeek}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="card bg-white text-neutral-900 p-6"
                  >
                    <p className="text-xs uppercase tracking-wide text-indigo-600 mb-2">
                      This Month
                    </p>
                    <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                      {stats.purchasesThisMonth}
                    </p>
                  </motion.div>
                </div>

                {/* Top Drinks & Recent Purchases */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Drinks */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="card bg-white text-neutral-900 p-6"
                  >
                    <h2 className="text-xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">
                      Top Drinks
                    </h2>
                    {stats.topDrinks.length > 0 ? (
                      <div className="space-y-3">
                        {stats.topDrinks.map((drink, index) => (
                          <div
                            key={drink.drinkId}
                            className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-indigo-600 w-6">
                                #{index + 1}
                              </span>
                              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                {drink.drinkName}
                              </span>
                            </div>
                            <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                              {drink.count} purchases
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        No purchases yet
                      </p>
                    )}
                  </motion.div>

                  {/* Recent Purchases */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="card bg-white text-neutral-900 p-6"
                  >
                    <h2 className="text-xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">
                      Recent Purchases
                    </h2>
                    {stats.recentPurchases.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {stats.recentPurchases.map((purchase) => (
                          <div
                            key={purchase.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900"
                          >
                            <div>
                              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                {purchase.drinkName}
                              </p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                {purchase.customerName
                                  ? `by ${purchase.customerName}`
                                  : "Anonymous"}{" "}
                                •{" "}
                                {new Date(purchase.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        No recent purchases
                      </p>
                    )}
                  </motion.div>
                </div>
              </>
            ) : null}
          </div>
        ) : (
          <DrinkRefillView />
        )}
      </div>
    </div>
  );
}

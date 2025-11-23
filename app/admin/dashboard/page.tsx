"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useToasts } from "@/app/components/ToastProvider";
import DrinkRefillView from "../components/DrinkRefillView";
import BackToTopButton from "@/app/components/BackToTopButton";
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
    drinkBrand: string;
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
    <div className="min-h-screen py-8 relative">
      <BackToTopButton />
      <div className="w-full max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 gradient-text">
              Admin Dashboard
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Manage inventory and view purchase statistics
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-7 py-2 rounded-full border border-black text-black text-lg font-semibold disabled:opacity-40 disabled:pointer-events-none"
            style={{ backgroundColor: '#32de84', boxShadow: 'none', animation: 'none', transition: 'none' }}
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 sm:gap-2 mb-6 sm:mb-8 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab("stats")}
            className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium sm:font-semibold border-b-2 transition-all duration-200 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-t-lg whitespace-nowrap ${
              activeTab === "stats"
                ? "border-[#32de84] text-[#32de84]"
                : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600"
            }`}
          >
            Statistics
          </button>
          <button
            onClick={() => setActiveTab("refill")}
            className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium sm:font-semibold border-b-2 transition-all duration-200 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-t-lg whitespace-nowrap ${
              activeTab === "refill"
                ? "border-[#32de84] text-[#32de84]"
                : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600"
            }`}
          >
            <span className="hidden sm:inline">Restock</span>
            <span className="sm:hidden">Restock</span>
          </button>
          <button
            onClick={() => setActiveTab("wishlist")}
            className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium sm:font-semibold border-b-2 transition-all duration-200 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-t-lg whitespace-nowrap ${
              activeTab === "wishlist"
                ? "border-[#32de84] text-[#32de84]"
                : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600"
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
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card-no-shimmer p-3 sm:p-6"
                  >
                    <p className="text-xs uppercase tracking-wide text-indigo-600 mb-1 sm:mb-2">
                      <span
                        className="hidden sm:inline"
                        style={{ color: "#32DE84" }}
                      >
                        Total Purchases
                      </span>
                      <span className="sm:hidden" style={{ color: "#32DE84" }}>
                        Total
                      </span>
                    </p>
                    <p className="text-xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                      {stats.totalPurchases}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="card-no-shimmer p-3 sm:p-6"
                  >
                    <p className="text-xs uppercase tracking-wide text-indigo-600 mb-1 sm:mb-2">
                      <span style={{ color: "#32DE84" }}>Today</span>
                    </p>
                    <p className="text-xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                      {stats.purchasesToday}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="card-no-shimmer p-3 sm:p-6"
                  >
                    <p className="text-xs uppercase tracking-wide text-[#32DE84] mb-1 sm:mb-2">
                      <span
                        className="hidden sm:inline"
                        style={{ color: "#32DE84" }}
                      >
                        This Week
                      </span>
                      <span className="sm:hidden" style={{ color: "#32DE84" }}>
                        Week
                      </span>
                    </p>
                    <p className="text-xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                      {stats.purchasesThisWeek}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="card-no-shimmer p-3 sm:p-6"
                  >
                    <p className="text-xs uppercase tracking-wide text-indigo-600 mb-1 sm:mb-2">
                      <span
                        className="hidden sm:inline"
                        style={{ color: "#32DE84" }}
                      >
                        This Month
                      </span>
                      <span className="sm:hidden" style={{ color: "#32DE84" }}>
                        Month
                      </span>
                    </p>
                    <p className="text-xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                      {stats.purchasesThisMonth}
                    </p>
                  </motion.div>
                </div>

                {/* Top Drinks & Recent Purchases */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
                  {/* Top Drinks */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="card-no-shimmer p-4 sm:p-6"
                  >
                    <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-neutral-900 dark:text-neutral-100">
                      Top Drinks
                    </h2>
                    {stats.topDrinks.length > 0 ? (
                      <div className="space-y-2 sm:space-y-3">
                        {stats.topDrinks.map((drink, index) => (
                          <div
                            key={drink.drinkId}
                            className="flex items-center justify-between p-2 sm:p-3 rounded-lg border-2 border-dashed border-neutral-300/40 dark:border-neutral-600/40 hover:border-[#32DE84] focus:border-[#32DE84] transition-colors"
                          >
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                              <span className="text-xs sm:text-sm font-semibold text-indigo-600 w-4 sm:w-6 shrink-0">
                                <span style={{ color: "#32DE84" }}>
                                  #{index + 1}
                                </span>
                              </span>
                              <span className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                                {drink.drinkName}
                              </span>
                            </div>
                            <span className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-300 whitespace-nowrap ml-2">
                              <span className="hidden sm:inline">
                                {drink.count} purchases
                              </span>
                              <span className="sm:hidden">{drink.count}</span>
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
                    className="card-no-shimmer p-4 sm:p-6"
                  >
                    <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-neutral-900 dark:text-neutral-100">
                      Recent Purchases
                    </h2>
                    {stats.recentPurchases.length > 0 ? (
                      <div className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
                        {stats.recentPurchases.map((purchase) => (
                          <div
                            key={purchase.id}
                            className="p-2 sm:p-3 rounded-lg border-2 border-dashed border-neutral-300/40 dark:border-neutral-600/40 hover:border-[#32DE84] focus:border-[#32DE84] transition-colors"
                          >
                            <div>
                              <p className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                                {purchase.drinkBrand} {purchase.drinkName}
                              </p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                <span className="hidden sm:inline">
                                  {purchase.customerName
                                    ? `by ${purchase.customerName}`
                                    : "Anonymous"}{" "}
                                  •{" "}
                                  {new Date(
                                    purchase.createdAt
                                  ).toLocaleString()}
                                </span>
                                <span className="sm:hidden">
                                  {purchase.customerName || "Anonymous"} •{" "}
                                  {new Date(
                                    purchase.createdAt
                                  ).toLocaleDateString()}
                                </span>
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

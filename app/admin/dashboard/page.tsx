"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useToasts } from "@/app/components/ToastProvider";
import DrinkRefillView from "../components/DrinkRefillView";
import BackToTopButton from "@/app/components/BackToTopButton";
import WishlistAdminView from "../components/WishlistAdminView";

const TAB_ACTIVE = "border-[#32de84] text-[#32de84]";
const TAB_INACTIVE =
  "border-transparent text-white hover:text-neutral-300 hover:border-neutral-600 hover:bg-neutral-800/50";

type PurchaseStats = {
  totalPurchases: number;
  purchasesToday: number;
  purchasesThisWeek: number;
  purchasesThisMonth: number;
  topDrinks: Array<{
    drinkId: number;
    drinkName: string;
    drinkBrand: string;
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
  const [activeTab, setActiveTab] = useState<"stats" | "refill" | "wishlist">("stats");
  const router = useRouter();
  const { error } = useToasts();

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/auth", { credentials: "include" });
      const data = await res.json();
      if (data.authenticated) {
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
        router.replace("/admin/login");
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
      if (!res.ok) throw new Error("Failed to fetch stats");
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
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authenticated) fetchStats();
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

  if (authenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-medium text-neutral-400">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent" />
          Verifying access...
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-neutral-400">Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 relative">
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 gradient-text">
              Admin Dashboard
            </h1>
            <p className="text-sm text-neutral-400">
              Manage inventory and view purchase statistics
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-7 py-2 rounded-full border border-black text-black text-lg font-semibold disabled:opacity-40 disabled:pointer-events-none self-start sm:self-auto"
            style={{ backgroundColor: "#32de84", boxShadow: "none" }}
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 sm:gap-2 mb-6 sm:mb-8 border-b border-neutral-800 overflow-x-auto">
          {(["stats", "refill", "wishlist"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium sm:font-semibold border-b-2 transition-all duration-200 cursor-pointer rounded-t-lg whitespace-nowrap ${
                activeTab === tab ? TAB_ACTIVE : TAB_INACTIVE
              }`}
            >
              {tab === "stats" ? "Statistics" : tab === "refill" ? "Restock" : "Wishlist"}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "wishlist" ? (
          <WishlistAdminView />
        ) : activeTab === "stats" ? (
          <div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="card bg-black p-6 animate-pulse">
                    <div className="h-4 w-24 bg-neutral-800 rounded mb-4" />
                    <div className="h-8 w-16 bg-neutral-800 rounded" />
                  </div>
                ))}
              </div>
            ) : stats ? (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
                  {[
                    { label: "Total Purchases", labelShort: "Total", value: stats.totalPurchases, delay: 0 },
                    { label: "Today", labelShort: "Today", value: stats.purchasesToday, delay: 0.1 },
                    { label: "This Week", labelShort: "Week", value: stats.purchasesThisWeek, delay: 0.2 },
                    { label: "This Month", labelShort: "Month", value: stats.purchasesThisMonth, delay: 0.3 },
                  ].map(({ label, labelShort, value, delay }) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay }}
                      className="card-no-shimmer p-3 sm:p-6"
                    >
                      <p className="text-xs uppercase tracking-wide mb-1 sm:mb-2" style={{ color: "#32DE84" }}>
                        <span className="hidden sm:inline">{label}</span>
                        <span className="sm:hidden">{labelShort}</span>
                      </p>
                      <p className="text-xl sm:text-3xl font-bold text-neutral-100">{value}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Top Drinks & Recent Purchases */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="card-no-shimmer p-4 sm:p-6"
                  >
                    <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-neutral-100">
                      Top Drinks
                    </h2>
                    {stats.topDrinks.length > 0 ? (
                      <div className="space-y-2 sm:space-y-3">
                        {stats.topDrinks.map((drink, index) => (
                          <div
                            key={drink.drinkId}
                            className="flex items-center justify-between p-2 sm:p-3 rounded-lg border-2 border-dashed border-neutral-700/40 hover:border-[#32DE84] transition-colors"
                          >
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                              <span className="text-xs sm:text-sm font-semibold w-4 sm:w-6 shrink-0" style={{ color: "#32DE84" }}>
                                #{index + 1}
                              </span>
                              <span className="text-xs sm:text-sm font-medium text-neutral-100 truncate">
                                {drink.drinkBrand ? `${drink.drinkBrand} ` : ""}{drink.drinkName}
                              </span>
                            </div>
                            <span className="text-xs sm:text-sm font-bold text-neutral-400 whitespace-nowrap ml-2">
                              <span className="hidden sm:inline">{drink.count} purchases</span>
                              <span className="sm:hidden">{drink.count}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-400">No purchases yet</p>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="card-no-shimmer p-4 sm:p-6"
                  >
                    <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-neutral-100">
                      Recent Purchases
                    </h2>
                    {stats.recentPurchases.length > 0 ? (
                      <div className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
                        {stats.recentPurchases.map((purchase) => (
                          <div
                            key={purchase.id}
                            className="p-2 sm:p-3 rounded-lg border-2 border-dashed border-neutral-700/40 hover:border-[#32DE84] transition-colors"
                          >
                            <p className="text-xs sm:text-sm font-medium text-neutral-100 truncate">
                              {purchase.drinkBrand} {purchase.drinkName}
                            </p>
                            <p className="text-xs text-neutral-400 truncate">
                              <span className="hidden sm:inline">
                                {purchase.customerName
                                  ? `by ${purchase.customerName}`
                                  : "Anonymous"}{" "}
                                • {new Date(purchase.createdAt).toLocaleString()}
                              </span>
                              <span className="sm:hidden">
                                {purchase.customerName || "Anonymous"} •{" "}
                                {new Date(purchase.createdAt).toLocaleDateString()}
                              </span>
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-400">No recent purchases</p>
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
      <div className="mt-8 flex justify-center">
        <BackToTopButton
          className="inline-block px-6 py-2 rounded-full border border-white text-white text-lg transition-all hover:bg-neutral-800"
          style={{ backgroundColor: "#000000" }}
        />
      </div>
    </div>
  );
}

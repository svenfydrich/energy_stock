"use client";

import React, { useEffect, useState, useCallback, useTransition } from "react";
import Image from "next/image";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useToasts } from "./components/ToastProvider";
import WishlistView from "./components/WishlistView";
import PaymentModal from "./components/PaymentModal";

type Drink = {
  id: number;
  name: string;
  price: number;
  stock: number;
  imageUrl: string | null;
};

const CARD_ANIM = {
  initial: { opacity: 0, y: 24, scale: 0.94, filter: "blur(6px)" },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 300, damping: 28 },
  },
  exit: {
    opacity: 0,
    y: -16,
    scale: 0.9,
    filter: "blur(4px)",
    transition: { duration: 0.25, ease: "easeInOut" },
  },
};

const BUTTON_BASE =
  "btn w-full text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:opacity-40 disabled:pointer-events-none";

function SkeletonCard() {
  return (
    <div className="card bg-white dark:bg-neutral-900 p-5 flex flex-col gap-4 h-full animate-pulse">
      <div className="rounded-xl bg-neutral-200 dark:bg-neutral-800 h-64" />
      <div className="h-6 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="h-4 w-1/2 rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="mt-auto">
        <div className="h-10 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDrinkIds, setPendingDrinkIds] = useState<Set<number>>(
    new Set()
  );
  const [isRefreshing, startRefresh] = useTransition();
  const [activeTab, setActiveTab] = useState<"inventory" | "wishlist">(
    "inventory"
  );
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    drink: Drink | null;
  }>({ isOpen: false, drink: null });
  const [wishlistCount, setWishlistCount] = useState(0);
  const { success, error, info } = useToasts();

  const fetchDrinks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/restock", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`Failed to load drinks (${res.status})`);
      }
      const data = await res.json();
      setDrinks(data.drinks ?? []);
    } catch (e) {
      console.error(e);
      error("Failed to load drinks.");
    } finally {
      setLoading(false);
    }
  }, [error]);

  const fetchWishlistCount = useCallback(async () => {
    try {
      const res = await fetch("/api/wishlist", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`Failed to load wishlist (${res.status})`);
      }
      const data = await res.json();
      setWishlistCount(data.drinks?.length ?? 0);
    } catch (e) {
      console.error(e);
      // Don't show error for wishlist count failure, it's not critical
    }
  }, []);

  useEffect(() => {
    fetchDrinks();
    fetchWishlistCount();
  }, [fetchDrinks, fetchWishlistCount]);

  const markPending = (id: number, add: boolean) => {
    setPendingDrinkIds((prev) => {
      const next = new Set(prev);
      if (add) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const optimisticUpdate = (id: number, delta: number) => {
    setDrinks((prev) =>
      prev.map((d) => (d.id === id ? { ...d, stock: d.stock + delta } : d))
    );
  };

  const buyDrink = (id: number) => {
    const drink = drinks.find((d) => d.id === id);
    if (!drink) return;
    if (drink.stock <= 0) {
      info("This drink is out of stock.");
      return;
    }

    setPaymentModal({ isOpen: true, drink });
  };

  const handlePaymentSuccess = () => {
    // Refresh drinks list
    fetchDrinks();
    setPaymentModal({ isOpen: false, drink: null });
  };

  const hardRefresh = () => {
    startRefresh(() => {
      fetchDrinks();
      fetchWishlistCount();
    });
  };

  const totalStock = drinks.reduce((sum, d) => sum + d.stock, 0);

  return (
    <div className="min-h-screen flex flex-col items-center py-4 md:py-8 fade-in">
      <div className="w-full max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6 mb-8 sm:mb-10">
          <div className="text-center sm:text-left">
            <p className="text-xs sm:text-sm uppercase tracking-wider text-indigo-600 font-semibold">
              {activeTab === "inventory" ? "Inventory Dashboard" : "Wishlist"}
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold animated-gradient-text leading-tight">
              {activeTab === "inventory"
                ? "Recharge and keep hacking."
                : "Your wishlist"}
            </h2>
            <p className="mt-2 sm:mt-3 max-w-xl text-neutral-600 dark:text-neutral-300 text-sm md:text-base">
              {activeTab === "inventory"
                ? "Select a drink and pay with Paypal or bank transfer"
                : "Add drinks you'd like to see in stock."}
            </p>
          </div>
          {activeTab === "inventory" && (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center sm:justify-end w-full sm:w-auto">
              <div className="card-no-shimmer bg-white dark:bg-neutral-900 px-4 sm:px-5 py-3 sm:py-4 flex flex-col items-start min-w-[10rem] sm:min-w-[12rem]">
                <span className="text-xs uppercase tracking-wide text-indigo-600">
                  Total Items
                </span>
                <span className="text-xl sm:text-2xl font-bold mt-1 text-neutral-900 dark:text-neutral-100">
                  {drinks.length}
                </span>
              </div>
              <div className="card-no-shimmer bg-white dark:bg-neutral-900 px-4 sm:px-5 py-3 sm:py-4 flex flex-col items-start min-w-[10rem] sm:min-w-[12rem]">
                <span className="text-xs uppercase tracking-wide text-indigo-600">
                  Total Stock
                </span>
                <span className="text-xl sm:text-2xl font-bold mt-1 text-neutral-900 dark:text-neutral-100">
                  {totalStock}
                </span>
              </div>
              <div className="card-no-shimmer bg-white dark:bg-neutral-900 px-5 py-4 flex flex-col items-start min-w-[12rem]">
                <span className="text-xs uppercase tracking-wide text-indigo-600">
                  Wishlisted Items
                </span>
                <span className="text-2xl font-bold mt-1 text-neutral-900 dark:text-neutral-100">
                  {wishlistCount}
                </span>
              </div>
              <button
                onClick={hardRefresh}
                className="card-no-shimmer bg-white dark:bg-neutral-900 px-4 sm:px-6 py-3 sm:py-4 flex flex-col items-center justify-center min-w-32 sm:min-w-40 text-xs sm:text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 group"
                disabled={isRefreshing}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`mb-1 text-indigo-600 dark:text-indigo-400 ${
                    isRefreshing
                      ? "animate-spin"
                      : "group-hover:rotate-180 transition-transform duration-500"
                  }`}
                >
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                </svg>
                <span className="text-neutral-900 dark:text-neutral-100">
                  {isRefreshing ? "Refreshing…" : "Refresh"}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 sm:gap-2 mb-6 sm:mb-8 border-b border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium sm:font-semibold border-b-2 transition-all duration-200 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-t-lg ${
              activeTab === "inventory"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600"
            }`}
          >
            Inventory
          </button>
          <button
            onClick={() => {
              setActiveTab("wishlist");
              fetchWishlistCount();
            }}
            className={`px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium sm:font-semibold border-b-2 transition-all duration-200 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-t-lg ${
              activeTab === "wishlist"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600"
            }`}
          >
            Wishlist
          </button>
        </div>

        {/* Content */}
        {activeTab === "inventory" ? (
          <LayoutGroup>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={`skeleton-${i}`} />
                ))
              ) : (
                <AnimatePresence>
                  {drinks.map((d) => {
                    const isPending = pendingDrinkIds.has(d.id);
                    const outOfStock = d.stock <= 0;
                    return (
                      <motion.div
                        key={d.id}
                        layout
                        variants={CARD_ANIM}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="card bg-white dark:bg-neutral-900 p-5 flex flex-col h-full group relative hover:scale-[1.02] transition-transform"
                      >
                        <div className="w-full h-64 rounded-xl overflow-hidden relative">
                          <Image
                            src={d.imageUrl || "/next.svg"}
                            alt={d.name}
                            width={500}
                            height={500}
                            className="w-full h-full object-contain"
                            priority
                          />
                          {isPending && (
                            <motion.div
                              layoutId={`pending-overlay-${d.id}`}
                              className="absolute inset-0 bg-white/60 dark:bg-neutral-950/50 backdrop-blur-sm flex items-center justify-center"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              <div className="flex items-center gap-2 text-sm font-medium text-indigo-700 dark:text-indigo-300">
                                <motion.span
                                  className="inline-block h-3 w-3 rounded-full bg-indigo-500"
                                  animate={{
                                    scale: [1, 0.7, 1],
                                  }}
                                  transition={{
                                    repeat: Infinity,
                                    duration: 0.9,
                                    ease: "easeInOut",
                                  }}
                                />
                                Processing…
                              </div>
                            </motion.div>
                          )}
                        </div>
                        <h2 className="text-xl font-semibold mt-4 truncate text-neutral-900 dark:text-neutral-100">
                          {d.name}
                        </h2>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            €{d.price.toFixed(2)}
                          </span>
                          <span
                            className={`stock-badge ${outOfStock ? "out" : ""}`}
                          >
                            {outOfStock ? "Out" : `${d.stock} left`}
                          </span>
                        </div>

                        <div className="mt-5">
                          <button
                            onClick={() => buyDrink(d.id)}
                            disabled={outOfStock || isPending}
                            className={`${BUTTON_BASE} btn-primary w-full`}
                          >
                            {outOfStock ? "Out of Stock" : "Buy"}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </LayoutGroup>
        ) : (
          <WishlistView />
        )}

        {activeTab === "inventory" && !loading && drinks.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-16 text-center text-sm text-neutral-500 dark:text-neutral-400"
          >
            No drinks found. Seed the database or add new items.
          </motion.div>
        )}
      </div>

      {/* Payment Modal */}
      {paymentModal.drink && (
        <PaymentModal
          isOpen={paymentModal.isOpen}
          onClose={() => setPaymentModal({ isOpen: false, drink: null })}
          drink={paymentModal.drink}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

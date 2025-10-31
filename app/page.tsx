"use client";

import React, { useEffect, useState, useCallback, useTransition } from "react";
import Image from "next/image";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useToasts } from "./components/ToastProvider";

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
    <div className="card bg-white text-neutral-900 p-5 flex flex-col gap-4 h-full animate-pulse">
      <div className="rounded-xl bg-neutral-200 dark:bg-neutral-800 h-64" />
      <div className="h-6 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="h-4 w-1/2 rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="mt-auto flex gap-2">
        <div className="h-10 flex-1 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-10 flex-1 rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDrinkIds, setPendingDrinkIds] = useState<Set<number>>(
    new Set(),
  );
  const [isRefreshing, startRefresh] = useTransition();
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

  useEffect(() => {
    fetchDrinks();
  }, [fetchDrinks]);

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
      prev.map((d) => (d.id === id ? { ...d, stock: d.stock + delta } : d)),
    );
  };

  const buyDrink = async (id: number) => {
    const drink = drinks.find((d) => d.id === id);
    if (!drink) return;
    if (drink.stock <= 0) {
      info("This drink is out of stock.");
      return;
    }

    markPending(id, true);
    optimisticUpdate(id, -1);

    try {
      const res = await fetch("/api/buy", {
        method: "POST",
        body: JSON.stringify({ drinkId: id }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        throw new Error("Purchase failed");
      }
      success(`Purchased ${drink.name}.`);
    } catch (e) {
      console.error(e);
      optimisticUpdate(id, 1);
      error("Unable to complete purchase.");
    } finally {
      markPending(id, false);
    }
  };

  const restockDrink = async (id: number) => {
    const drink = drinks.find((d) => d.id === id);
    if (!drink) return;

    markPending(id, true);
    optimisticUpdate(id, +1);

    try {
      const res = await fetch("/api/restock", {
        method: "POST",
        body: JSON.stringify({ drinkId: id, amount: 1 }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        throw new Error("Restock failed");
      }
      success(`Restocked ${drink.name}.`);
    } catch (e) {
      console.error(e);
      optimisticUpdate(id, -1);
      error("Unable to restock.");
    } finally {
      markPending(id, false);
    }
  };

  const hardRefresh = () => {
    startRefresh(() => {
      fetchDrinks();
    });
  };

  const totalStock = drinks.reduce((sum, d) => sum + d.stock, 0);

  return (
    <div className="min-h-screen flex flex-col items-center py-4 md:py-8 fade-in">
      <div className="w-full max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div className="text-center md:text-left">
            <p className="text-sm uppercase tracking-wider text-indigo-600 font-semibold">
              Inventory Dashboard
            </p>
            <h2 className="mt-2 text-3xl md:text-4xl font-extrabold gradient-text leading-tight">
              Recharge and keep hacking.
            </h2>
            <p className="mt-3 max-w-xl text-neutral-600 dark:text-neutral-300 text-sm md:text-base">
              Please keep it tidy and always log the changes.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 justify-center md:justify-end">
            <div className="card bg-white text-neutral-900 px-5 py-4 flex flex-col items-start min-w-[12rem]">
              <span className="text-xs uppercase tracking-wide text-indigo-600">
                Total Items
              </span>
              <span className="text-2xl font-bold mt-1 text-neutral-900 dark:text-neutral-100">
                {drinks.length}
              </span>
            </div>
            <div className="card bg-white text-neutral-900 px-5 py-4 flex flex-col items-start min-w-[12rem]">
              <span className="text-xs uppercase tracking-wide text-indigo-600">
                Total Stock
              </span>
              <span className="text-2xl font-bold mt-1 text-neutral-900 dark:text-neutral-100">
                {totalStock}
              </span>
            </div>
            <button
              onClick={hardRefresh}
              className={`${BUTTON_BASE} btn-outline min-w-[10rem]`}
              disabled={isRefreshing}
            >
              {isRefreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

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
                      className="card bg-white text-neutral-900 p-5 flex flex-col h-full group relative"
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

                      <div className="mt-5 flex gap-3">
                        <button
                          onClick={() => buyDrink(d.id)}
                          disabled={outOfStock || isPending}
                          className={`${BUTTON_BASE} btn-primary flex-1`}
                        >
                          {outOfStock ? "Out of Stock" : "Buy"}
                        </button>
                        <button
                          onClick={() => restockDrink(d.id)}
                          disabled={isPending}
                          className={`${BUTTON_BASE} btn-outline flex-1`}
                        >
                          + Restock
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </LayoutGroup>

        {!loading && drinks.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-16 text-center text-sm text-neutral-500 dark:text-neutral-400"
          >
            No drinks found. Seed the database or add new items.
          </motion.div>
        )}
      </div>
    </div>
  );
}

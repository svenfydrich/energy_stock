"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useToasts } from "@/app/components/ToastProvider";

type Drink = {
  id: number;
  name: string;
  brand: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  sugarFree: boolean;
};

const CARD_ANIM = {
  initial: { opacity: 0, y: 24, scale: 0.94 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 28 },
  },
  exit: {
    opacity: 0,
    y: -16,
    scale: 0.9,
    transition: { duration: 0.25 },
  },
};

function SkeletonCard() {
  return (
    <div className="card bg-white text-neutral-900 p-5 flex flex-col gap-4 h-full animate-pulse">
      <div className="rounded-xl bg-neutral-200 dark:bg-neutral-800 h-64" />
      <div className="h-6 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="h-4 w-1/2 rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="mt-auto h-10 rounded bg-neutral-200 dark:bg-neutral-800" />
    </div>
  );
}

export default function DrinkRefillView() {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDrinkIds, setPendingDrinkIds] = useState<Set<number>>(
    new Set()
  );
  const [restockAmounts, setRestockAmounts] = useState<Map<number, number>>(
    new Map()
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newDrink, setNewDrink] = useState({
    name: "",
    brand: "",
    stock: 0,
    price: 0,
    imageUrl: "",
    sugarFree: false,
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingDrink, setEditingDrink] = useState<{
    id: number;
    name: string;
    brand: string;
    stock: number;
    price: number;
    imageUrl: string;
    sugarFree: boolean;
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    drinkId: number | null;
    drinkName: string;
  }>({ isOpen: false, drinkId: null, drinkName: "" });
  const [isDeleting, setIsDeleting] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { success, error } = useToasts();

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
      prev.map((d) => (d.id === id ? { ...d, stock: d.stock + delta } : d))
    );
  };

  const restockDrink = async (id: number, amount: number = 1) => {
    const drink = drinks.find((d) => d.id === id);
    if (!drink) return;

    if (amount <= 0 || !Number.isInteger(amount)) {
      error("Please enter a valid positive number");
      return;
    }

    markPending(id, true);
    optimisticUpdate(id, amount);

    try {
      const res = await fetch("/api/restock", {
        method: "POST",
        body: JSON.stringify({ drinkId: id, amount }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        throw new Error("Restock failed");
      }
      success(`Restocked ${drink.name} by ${amount}.`);
      // Clear the input for this drink
      setRestockAmounts((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    } catch (e) {
      console.error(e);
      optimisticUpdate(id, -amount);
      error("Unable to restock.");
    } finally {
      markPending(id, false);
    }
  };

  const handleAmountChange = (id: number, value: string) => {
    const numValue = parseInt(value, 10);
    setRestockAmounts((prev) => {
      const next = new Map(prev);
      if (value === "" || isNaN(numValue)) {
        next.delete(id);
      } else {
        next.set(id, numValue);
      }
      return next;
    });
  };

  const handleEditClick = (drink: Drink) => {
    setEditingDrink({
      id: drink.id,
      name: drink.name,
      brand: drink.brand,
      stock: drink.stock,
      price: drink.price,
      imageUrl: drink.imageUrl || "",
      sugarFree: drink.sugarFree,
    });
    setIsEditModalOpen(true);
  };

  const handleEditDrink = async () => {
    if (!editingDrink) return;

    if (!editingDrink.name.trim()) {
      error("Please enter a drink name");
      return;
    }

    if (!Number.isInteger(editingDrink.stock) || editingDrink.stock < 0) {
      error("Stock must be a non-negative integer");
      return;
    }

    if (editingDrink.price < 0 || !isFinite(editingDrink.price)) {
      error("Please enter a valid price");
      return;
    }

    setIsEditing(true);

    try {
      // Update drink via API - we'll need to create a generic update endpoint
      const res = await fetch("/api/admin/update-drink", {
        method: "POST",
        body: JSON.stringify({
          drinkId: editingDrink.id,
          name: editingDrink.name.trim(),
          brand: editingDrink.brand.trim(),
          stock: editingDrink.stock,
          price: editingDrink.price,
          imageUrl: editingDrink.imageUrl.trim() || null,
          sugarFree: editingDrink.sugarFree,
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update drink");
      }

      const data = await res.json();
      success(`Updated ${data.drink.name} successfully!`);

      // Update the drink in the list
      setDrinks((prev) =>
        prev.map((d) => (d.id === editingDrink.id ? data.drink : d))
      );

      handleCancelEdit();
    } catch (e) {
      console.error(e);
      error(e instanceof Error ? e.message : "Unable to update drink.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingDrink(null);
    setIsEditModalOpen(false);
  };

  const handleAddDrink = async () => {
    if (!newDrink.name.trim()) {
      error("Please enter a drink name");
      return;
    }

    if (!Number.isInteger(newDrink.stock) || newDrink.stock < 0) {
      error("Stock must be a non-negative integer");
      return;
    }

    if (newDrink.price < 0 || !isFinite(newDrink.price)) {
      error("Please enter a valid price");
      return;
    }

    setIsAdding(true);

    try {
      const res = await fetch("/api/admin/add-drink", {
        method: "POST",
        body: JSON.stringify({
          name: newDrink.name.trim(),
          brand: newDrink.brand.trim(),
          stock: newDrink.stock,
          price: newDrink.price,
          imageUrl: newDrink.imageUrl.trim() || null,
          sugarFree: newDrink.sugarFree,
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add drink");
      }

      const data = await res.json();
      success(`Added ${data.drink.name} successfully!`);

      // Add the new drink to the list
      setDrinks((prev) => [data.drink, ...prev]);

      // Reset form and close modal
      setNewDrink({
        name: "",
        brand: "",
        stock: 0,
        price: 0,
        imageUrl: "",
        sugarFree: false,
      });
      setIsAddModalOpen(false);
    } catch (e) {
      console.error(e);
      error(e instanceof Error ? e.message : "Unable to add drink.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleCancelAdd = () => {
    setNewDrink({
      name: "",
      brand: "",
      stock: 0,
      price: 0,
      imageUrl: "",
      sugarFree: false,
    });
    setIsAddModalOpen(false);
  };

  const handleDeleteClick = (id: number, name: string) => {
    setDeleteConfirm({ isOpen: true, drinkId: id, drinkName: name });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.drinkId) return;

    const drinkId = deleteConfirm.drinkId;
    const drinkName = deleteConfirm.drinkName;

    setIsDeleting(true);
    markPending(drinkId, true);

    try {
      const res = await fetch("/api/admin/delete-drink", {
        method: "POST",
        body: JSON.stringify({ drinkId }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete drink");
      }

      // Remove drink from list
      setDrinks((prev) => prev.filter((d) => d.id !== drinkId));
      success(`Deleted ${drinkName} successfully!`);
      setDeleteConfirm({ isOpen: false, drinkId: null, drinkName: "" });
    } catch (e) {
      console.error(e);
      error(e instanceof Error ? e.message : "Unable to delete drink.");
    } finally {
      setIsDeleting(false);
      markPending(drinkId, false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, drinkId: null, drinkName: "" });
  };

  const handleResetClick = () => {
    setResetConfirm(true);
  };

  const handleResetConfirm = async () => {
    setIsResetting(true);

    try {
      const res = await fetch("/api/admin/reset-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reset stock");
      }

      // Update all drinks stock to 0 in local state
      setDrinks((prev) => prev.map((drink) => ({ ...drink, stock: 0 })));
      success("Successfully reset all drink stock to 0!");
      setResetConfirm(false);
    } catch (e) {
      console.error(e);
      error(e instanceof Error ? e.message : "Unable to reset stock.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetCancel = () => {
    setResetConfirm(false);
  };

  return (
    <div>
      <div className="mb-6 flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4 sm:gap-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-800 dark:text-neutral-100">
            Inventory
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Restock, add new drinks and manage the items.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={fetchDrinks}
            className="btn btn-outline text-xs sm:text-sm font-medium sm:font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 px-3 py-2 sm:px-4 sm:py-2 flex-1 sm:flex-initial rounded-full"
          >
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">↻</span>
          </button>
          <button
            onClick={handleResetClick}
            disabled={isResetting}
            className="btn bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600 text-xs sm:text-sm font-medium sm:font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 disabled:opacity-40 disabled:pointer-events-none px-3 py-2 sm:px-4 sm:py-2 flex-1 sm:flex-initial rounded-full"
          >
            <span className="hidden sm:inline">
              {isResetting ? "Resetting..." : "Reset Stock"}
            </span>
            <span className="sm:hidden">{isResetting ? "..." : "Reset"}</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={`skeleton-${i}`} />
            ))
          ) : (
            <>
              {/* Add New Drink Card */}
              <motion.div
                layout
                variants={CARD_ANIM}
                initial="initial"
                animate="animate"
                exit="exit"
                className="card p-5 flex flex-col h-full group relative cursor-pointer hover:scale-[1.02] transition-transform"
                onClick={() => setIsAddModalOpen(true)}
              >
                <div className="w-full h-64 rounded-xl overflow-hidden relative flex items-center justify-center bg-linear-to-br from-green-400/30 to-black/60 dark:from-green-900/40 dark:to-black/80 border-2 border-dashed border-green-400/40 dark:border-green-700/40 group-hover:border-green-500/60 dark:group-hover:border-green-600/60 transition-colors">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 rounded-full bg-green-100/80 dark:bg-green-900/50 group-hover:bg-green-200 dark:group-hover:bg-green-800/70 transition-colors">
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-green-600 dark:text-green-400"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </div>
                    <span className="text-base font-semibold text-green-700 dark:text-green-300 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                      Add new drink
                    </span>
                  </div>
                </div>
              </motion.div>

              {drinks.map((d) => {
                const isPending = pendingDrinkIds.has(d.id);
                return (
                  <motion.div
                    key={d.id}
                    layout
                    variants={CARD_ANIM}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="card-no-shimmer p-5 flex flex-col h-full group relative hover:scale-[1.02] transition-transform"
                  >
                    {/* Action Buttons */}
                    <div className="absolute top-3 right-3 z-10 flex gap-2">
                      {/* Edit Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(d);
                        }}
                        disabled={isPending}
                        className="buy-btn w-10 h-10 flex items-center justify-center rounded-full border border-black text-black text-lg font-semibold disabled:opacity-40 disabled:pointer-events-none shadow-none"
                        style={{ boxShadow: 'none', animation: 'none', transition: 'none' }}
                        aria-label="Edit drink"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(d.id, d.name);
                        }}
                        disabled={isPending}
                        className="buy-btn w-10 h-10 flex items-center justify-center rounded-full border border-black text-black text-lg font-semibold disabled:opacity-40 disabled:pointer-events-none shadow-none"
                        style={{ boxShadow: 'none', animation: 'none', transition: 'none' }}
                        aria-label="Delete drink"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
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
                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-semibold">
                        <span style={{ color: "#32DE84" }}>
                          {d.brand || "Unknown"}
                        </span>
                      </p>
                      <h2 className="text-xl font-semibold mt-1 truncate text-neutral-800 dark:text-neutral-100">
                        {d.name}
                      </h2>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        €{d.price.toFixed(2)}
                      </span>
                      <span
                        className={`stock-badge whitespace-nowrap ${
                          d.stock === 0 ? "out" : ""
                        }`}
                      >
                        {d.stock === 0 ? "Out" : `${d.stock} in stock`}
                      </span>
                    </div>

                    <div className="mt-5 space-y-2">
                      <div className="flex gap-2 w-full">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={restockAmounts.get(d.id) || ""}
                          onChange={(e) =>
                            handleAmountChange(d.id, e.target.value)
                          }
                          disabled={isPending}
                          placeholder="Amount"
                          className="flex-1 min-w-0 px-3 py-2 rounded-lg border-2 border-dashed border-neutral-300/40 dark:border-neutral-600/40 bg-transparent text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#32de84] focus:border-[#32de84]/60 dark:focus:border-[#32de84]/60 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
                        />
                        <button
                          onClick={() => {
                            const amount = restockAmounts.get(d.id);
                            if (amount && amount > 0) {
                              restockDrink(d.id, amount);
                            }
                          }}
                          disabled={
                            isPending ||
                            !restockAmounts.get(d.id) ||
                            (restockAmounts.get(d.id) ?? 0) <= 0
                          }
                          className="btn text-xs sm:text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#32de84] disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap px-2 sm:px-3 py-2 w-16 sm:w-20 shrink-0 rounded-full bg-[#32de84] text-white border-none shadow-none"
                          style={{ boxShadow: 'none', animation: 'none', transition: 'none' }}
                        >
                          Restock
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </>
          )}
        </div>
      </AnimatePresence>

      {!loading && drinks.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-16 text-center text-sm text-neutral-500 dark:text-neutral-400"
        >
          No drinks found.
        </motion.div>
      )}

      {/* Add Drink Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleCancelAdd}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="card bg-white text-neutral-900 p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-neutral-900 dark:text-neutral-100">
              Add New Drink
            </h2>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2"
                >
                  Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={newDrink.name}
                  onChange={(e) =>
                    setNewDrink({ ...newDrink, name: e.target.value })
                  }
                  disabled={isAdding}
                  required
                  className="w-full px-4 py-2 rounded-lg border-2 border-dashed border-green-300/40 dark:border-green-600/40 bg-transparent text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#32de84] focus:border-[#32de84]/60 dark:focus:border-[#32de84]/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  placeholder="Enter drink name"
                />
              </div>

              <div>
                <label
                  htmlFor="brand"
                  className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2"
                >
                  Brand
                </label>
                <input
                  id="brand"
                  type="text"
                  value={newDrink.brand}
                  onChange={(e) =>
                    setNewDrink({ ...newDrink, brand: e.target.value })
                  }
                  disabled={isAdding}
                  className="w-full px-4 py-2 rounded-lg border-2 border-dashed border-neutral-300/40 dark:border-neutral-600/40 bg-transparent text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#32de84] focus:border-[#32de84]/60 dark:focus:border-[#32de84]/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  placeholder="Enter brand name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="stock"
                    className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2"
                  >
                    Stock *
                  </label>
                  <input
                    id="stock"
                    type="number"
                    min="0"
                    step="1"
                    value={newDrink.stock || ""}
                    onChange={(e) =>
                      setNewDrink({
                        ...newDrink,
                        stock: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    disabled={isAdding}
                    required
                    className="w-full px-4 py-2 rounded-lg border-2 border-dashed border-neutral-300/40 dark:border-neutral-600/40 bg-transparent text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#32de84] focus:border-[#32de84]/60 dark:focus:border-[#32de84]/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2"
                  >
                    Price (€) *
                  </label>
                  <input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newDrink.price || ""}
                    onChange={(e) =>
                      setNewDrink({
                        ...newDrink,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    disabled={isAdding}
                    required
                    className="w-full px-4 py-2 rounded-lg border-2 border-dashed border-neutral-300/40 dark:border-neutral-600/40 bg-transparent text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#32de84] focus:border-[#32de84]/60 dark:focus:border-[#32de84]/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="imageUrl"
                  className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2"
                >
                  Image URL
                </label>
                <input
                  id="imageUrl"
                  type="url"
                  value={newDrink.imageUrl}
                  onChange={(e) =>
                    setNewDrink({ ...newDrink, imageUrl: e.target.value })
                  }
                  disabled={isAdding}
                  className="w-full px-4 py-2 rounded-lg border-2 border-dashed border-neutral-300/40 dark:border-neutral-600/40 bg-transparent text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#32de84] focus:border-[#32de84]/60 dark:focus:border-[#32de84]/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  placeholder="https://example.com/image.png"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="sugarFree"
                  type="checkbox"
                  checked={newDrink.sugarFree}
                  onChange={(e) =>
                    setNewDrink({ ...newDrink, sugarFree: e.target.checked })
                  }
                  disabled={isAdding}
                  className="w-5 h-5 rounded border-2 border-[#32de84] dark:border-[#32de84] text-[#32de84] bg-[#32de84] focus:ring-2 focus:ring-[#32de84] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                />
                <label
                  htmlFor="sugarFree"
                  className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer"
                >
                  Sugar Free
                </label>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={handleAddDrink}
                disabled={isAdding || !newDrink.name.trim()}
                className="btn flex-1 text-xs sm:text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#32de84] disabled:opacity-40 disabled:pointer-events-none py-2 sm:py-2 rounded-full bg-[#32de84] text-white border-none shadow-none"
                style={{ boxShadow: 'none', animation: 'none', transition: 'none' }}
              >
                {isAdding ? "Adding..." : "Add"}
              </button>
              <button
                onClick={handleCancelAdd}
                disabled={isAdding}
                className="btn btn-outline flex-1 text-xs sm:text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none py-2 sm:py-2 rounded-full border shadow-none"
                style={{ boxShadow: 'none', animation: 'none', transition: 'none' }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Drink Modal */}
      {isEditModalOpen && editingDrink && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleCancelEdit}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="card bg-white text-neutral-900 p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-neutral-900 dark:text-neutral-100">
              Edit Drink
            </h2>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label
                  htmlFor="edit-name"
                  className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2"
                >
                  Name *
                </label>
                <input
                  id="edit-name"
                  type="text"
                  value={editingDrink.name}
                  onChange={(e) =>
                    setEditingDrink({ ...editingDrink, name: e.target.value })
                  }
                  disabled={isEditing}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#32DE84] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter drink name"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-brand"
                  className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2"
                >
                  Brand
                </label>
                <input
                  id="edit-brand"
                  type="text"
                  value={editingDrink.brand}
                  onChange={(e) =>
                    setEditingDrink({ ...editingDrink, brand: e.target.value })
                  }
                  disabled={isEditing}
                  className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#32DE84] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter brand name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="edit-stock"
                    className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2"
                  >
                    Stock *
                  </label>
                  <input
                    id="edit-stock"
                    type="number"
                    min="0"
                    step="1"
                    value={editingDrink.stock}
                    onChange={(e) =>
                      setEditingDrink({
                        ...editingDrink,
                        stock: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    disabled={isEditing}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#32DE84] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-price"
                    className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2"
                  >
                    Price (€) *
                  </label>
                  <input
                    id="edit-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingDrink.price}
                    onChange={(e) =>
                      setEditingDrink({
                        ...editingDrink,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    disabled={isEditing}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#32DE84] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="edit-imageUrl"
                  className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2"
                >
                  Image URL
                </label>
                <input
                  id="edit-imageUrl"
                  type="url"
                  value={editingDrink.imageUrl}
                  onChange={(e) =>
                    setEditingDrink({
                      ...editingDrink,
                      imageUrl: e.target.value,
                    })
                  }
                  disabled={isEditing}
                  className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#32DE84] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="https://example.com/image.png"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="edit-sugarFree"
                  type="checkbox"
                  checked={editingDrink.sugarFree}
                  onChange={(e) =>
                    setEditingDrink({
                      ...editingDrink,
                      sugarFree: e.target.checked,
                    })
                  }
                  disabled={isEditing}
                  className="w-5 h-5 rounded border-2 border-neutral-300 dark:border-neutral-600 text-[#32DE84] focus:ring-2 focus:ring-[#32DE84] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                />
                <label
                  htmlFor="edit-sugarFree"
                  className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer"
                >
                  Sugar Free
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleEditDrink}
                disabled={isEditing || !editingDrink.name.trim()}
                className="btn flex-1 text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#32de84] disabled:opacity-40 disabled:pointer-events-none rounded-full bg-[#32de84] text-white border-none shadow-none py-2"
                style={{ boxShadow: 'none', animation: 'none', transition: 'none' }}
              >
                {isEditing ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={isEditing}
                className="btn btn-outline flex-1 text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none rounded-full border shadow-none py-2"
                style={{ boxShadow: 'none', animation: 'none', transition: 'none' }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleDeleteCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="card bg-white text-neutral-900 p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">
              Delete Drink
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              Are you sure you want to delete{" "}
              <strong>{deleteConfirm.drinkName}</strong>? This action cannot be
              undone and will permanently remove the drink from the database.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="btn bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600 flex-1 text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 disabled:opacity-40 disabled:pointer-events-none rounded-full border shadow-none py-2"
                style={{ boxShadow: 'none', animation: 'none', transition: 'none' }}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className="btn btn-outline flex-1 text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none rounded-full border shadow-none py-2"
                style={{ boxShadow: 'none', animation: 'none', transition: 'none' }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reset Stock Confirmation Modal */}
      {resetConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleResetCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="card bg-white text-neutral-900 p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">
              Reset All Stock
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              Are you sure you want to reset the stock of{" "}
              <strong>all drinks</strong> to 0? This action cannot be undone and
              will affect all drinks in the inventory.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleResetConfirm}
                disabled={isResetting}
                className="btn bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600 flex-1 text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 disabled:opacity-40 disabled:pointer-events-none"
              >
                {isResetting ? "Resetting..." : "Reset All Stock"}
              </button>
              <button
                onClick={handleResetCancel}
                disabled={isResetting}
                className="btn btn-outline flex-1 text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:opacity-40 disabled:pointer-events-none"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useToasts } from "@/app/components/ToastProvider";
import { SkeletonCard } from "@/app/components/SkeletonCard";
import { ConfirmModal } from "@/app/components/ConfirmModal";
import { DrinkFormModal } from "./DrinkFormModal";
import { CARD_ANIM } from "@/lib/animations";
import type { Drink, DrinkFormData, ConfirmState } from "@/lib/types";
import { usePendingSet } from "@/app/hooks/usePendingSet";

const EMPTY_FORM: DrinkFormData = {
  name: "",
  brand: "",
  stock: 0,
  price: 0,
  imageUrl: "",
  sugarFree: false,
};

export default function DrinkRefillView() {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [loading, setLoading] = useState(true);
  const { pendingIds, mark } = usePendingSet();
  const [restockAmounts, setRestockAmounts] = useState<Map<number, number>>(new Map());

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newDrink, setNewDrink] = useState<DrinkFormData>(EMPTY_FORM);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingDrink, setEditingDrink] = useState<(DrinkFormData & { id: number }) | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<ConfirmState>({
    isOpen: false,
    drinkId: null,
    drinkName: "",
  });
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
      if (!res.ok) throw new Error(`Failed to load drinks (${res.status})`);
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

  const handleAmountChange = (id: number, value: string) => {
    const numValue = parseInt(value, 10);
    setRestockAmounts((prev) => {
      const next = new Map(prev);
      if (value === "" || isNaN(numValue)) next.delete(id);
      else next.set(id, numValue);
      return next;
    });
  };

  const restockDrink = async (id: number, amount: number) => {
    const drink = drinks.find((d) => d.id === id);
    if (!drink) return;

    if (amount <= 0 || !Number.isInteger(amount)) {
      error("Please enter a valid positive number");
      return;
    }

    mark(id, true);
    setDrinks((prev) => prev.map((d) => (d.id === id ? { ...d, stock: d.stock + amount } : d)));

    try {
      const res = await fetch("/api/restock", {
        method: "POST",
        body: JSON.stringify({ drinkId: id, amount }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Restock failed");
      success(`Restocked ${drink.name} by ${amount}.`);
      setRestockAmounts((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    } catch (e) {
      console.error(e);
      setDrinks((prev) => prev.map((d) => (d.id === id ? { ...d, stock: d.stock - amount } : d)));
      error("Unable to restock.");
    } finally {
      mark(id, false);
    }
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
      setDrinks((prev) => [data.drink, ...prev]);
      setNewDrink(EMPTY_FORM);
      setIsAddModalOpen(false);
    } catch (e) {
      console.error(e);
      error(e instanceof Error ? e.message : "Unable to add drink.");
    } finally {
      setIsAdding(false);
    }
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
      setDrinks((prev) => prev.map((d) => (d.id === editingDrink.id ? data.drink : d)));
      setEditingDrink(null);
      setIsEditModalOpen(false);
    } catch (e) {
      console.error(e);
      error(e instanceof Error ? e.message : "Unable to update drink.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.drinkId) return;

    const { drinkId, drinkName } = deleteConfirm;
    setIsDeleting(true);
    mark(drinkId, true);

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

      setDrinks((prev) => prev.filter((d) => d.id !== drinkId));
      success(`Deleted ${drinkName} successfully!`);
      setDeleteConfirm({ isOpen: false, drinkId: null, drinkName: "" });
    } catch (e) {
      console.error(e);
      error(e instanceof Error ? e.message : "Unable to delete drink.");
    } finally {
      setIsDeleting(false);
      mark(drinkId, false);
    }
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

  return (
    <div>
      <div className="mb-6 flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4 sm:gap-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Inventory</h2>
          <p className="text-sm text-neutral-400 mt-1">
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
            onClick={() => setResetConfirm(true)}
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
                <div className="w-full h-64 rounded-xl overflow-hidden relative flex items-center justify-center bg-gradient-to-br from-green-900/40 to-black/80 border-2 border-dashed border-green-700/40 group-hover:border-green-600/60 transition-colors">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 rounded-full bg-green-900/50 group-hover:bg-green-800/70 transition-colors">
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-green-400"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </div>
                    <span className="text-base font-semibold text-green-300 group-hover:text-green-400 transition-colors">
                      Add new drink
                    </span>
                  </div>
                </div>
              </motion.div>

              {drinks.map((d) => {
                const isPending = pendingIds.has(d.id);
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
                    <div className="absolute top-3 right-3 z-10 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(d);
                        }}
                        disabled={isPending}
                        className="buy-btn w-10 h-10 flex items-center justify-center rounded-full border border-black text-black disabled:opacity-40 disabled:pointer-events-none"
                        style={{ boxShadow: "none", animation: "none", transition: "none" }}
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ isOpen: true, drinkId: d.id, drinkName: d.name });
                        }}
                        disabled={isPending}
                        className="buy-btn w-10 h-10 flex items-center justify-center rounded-full border border-black text-black disabled:opacity-40 disabled:pointer-events-none"
                        style={{ boxShadow: "none", animation: "none", transition: "none" }}
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
                          className="absolute inset-0 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <div className="flex items-center gap-2 text-sm font-medium text-indigo-300">
                            <motion.span
                              className="inline-block h-3 w-3 rounded-full bg-indigo-500"
                              animate={{ scale: [1, 0.7, 1] }}
                              transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut" }}
                            />
                            Processing…
                          </div>
                        </motion.div>
                      )}
                    </div>
                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: "#32DE84" }}>
                        {d.brand || "Unknown"}
                      </p>
                      <h2 className="text-xl font-semibold mt-1 truncate text-neutral-100">
                        {d.name}
                      </h2>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-neutral-300">
                        €{d.price.toFixed(2)}
                      </span>
                      <span className={`stock-badge whitespace-nowrap ${d.stock === 0 ? "out" : ""}`}>
                        {d.stock === 0 ? "Out" : `${d.stock} in stock`}
                      </span>
                    </div>

                    <div className="mt-5">
                      <div className="flex gap-2 w-full">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={restockAmounts.get(d.id) || ""}
                          onChange={(e) => handleAmountChange(d.id, e.target.value)}
                          disabled={isPending}
                          placeholder="Amount"
                          className="flex-1 min-w-0 px-3 py-2 rounded-lg border-2 border-dashed border-neutral-600/40 bg-transparent text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#32de84] focus:border-[#32de84]/60 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
                        />
                        <button
                          onClick={() => {
                            const amount = restockAmounts.get(d.id);
                            if (amount && amount > 0) restockDrink(d.id, amount);
                          }}
                          disabled={
                            isPending ||
                            !restockAmounts.get(d.id) ||
                            (restockAmounts.get(d.id) ?? 0) <= 0
                          }
                          className="btn text-xs sm:text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#32de84] disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap px-2 sm:px-3 py-2 w-16 sm:w-20 shrink-0 rounded-full bg-[#32de84] text-white border-none"
                          style={{ boxShadow: "none" }}
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
          className="mt-16 text-center text-sm text-neutral-400"
        >
          No drinks found.
        </motion.div>
      )}

      <DrinkFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setNewDrink(EMPTY_FORM);
          setIsAddModalOpen(false);
        }}
        onSubmit={handleAddDrink}
        isSubmitting={isAdding}
        title="Add New Drink"
        submitLabel={isAdding ? "Adding..." : "Add"}
        value={newDrink}
        onChange={setNewDrink}
      />

      <DrinkFormModal
        isOpen={isEditModalOpen && editingDrink !== null}
        onClose={() => {
          setEditingDrink(null);
          setIsEditModalOpen(false);
        }}
        onSubmit={handleEditDrink}
        isSubmitting={isEditing}
        title="Edit Drink"
        submitLabel={isEditing ? "Saving..." : "Save Changes"}
        value={editingDrink ?? EMPTY_FORM}
        onChange={(data) =>
          editingDrink && setEditingDrink({ id: editingDrink.id, ...data })
        }
      />

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, drinkId: null, drinkName: "" })}
        onConfirm={handleDeleteConfirm}
        isConfirming={isDeleting}
        title="Delete Drink"
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        description={
          <>
            Are you sure you want to delete{" "}
            <strong>{deleteConfirm.drinkName}</strong>? This action cannot be
            undone and will permanently remove the drink from the database.
          </>
        }
      />

      <ConfirmModal
        isOpen={resetConfirm}
        onClose={() => setResetConfirm(false)}
        onConfirm={handleResetConfirm}
        isConfirming={isResetting}
        title="Reset All Stock"
        confirmLabel={isResetting ? "Resetting..." : "Reset All Stock"}
        description={
          <>
            Are you sure you want to reset the stock of{" "}
            <strong>all drinks</strong> to 0? This action cannot be undone and
            will affect all drinks in the inventory.
          </>
        }
      />
    </div>
  );
}

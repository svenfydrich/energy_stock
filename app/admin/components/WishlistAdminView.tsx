"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useToasts } from "@/app/components/ToastProvider";
import { SkeletonCard } from "@/app/components/SkeletonCard";
import { ConfirmModal } from "@/app/components/ConfirmModal";
import { CARD_ANIM } from "@/lib/animations";
import type { WishlistDrink, ConfirmState } from "@/lib/types";
import { usePendingSet } from "@/app/hooks/usePendingSet";

type WishlistAdminViewProps = {
  onDrinkAdded?: () => void;
};

export default function WishlistAdminView({ onDrinkAdded }: WishlistAdminViewProps) {
  const [wishlistDrinks, setWishlistDrinks] = useState<WishlistDrink[]>([]);
  const [loading, setLoading] = useState(true);
  const { pendingIds, mark } = usePendingSet();
  const [convertModal, setConvertModal] = useState<ConfirmState>({
    isOpen: false,
    drinkId: null,
    drinkName: "",
  });
  const [deleteConfirm, setDeleteConfirm] = useState<ConfirmState>({
    isOpen: false,
    drinkId: null,
    drinkName: "",
  });
  const [isConverting, setIsConverting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const { success, error } = useToasts();

  const fetchWishlist = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/wishlist", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Failed to load wishlist (${res.status})`);
      const data = await res.json();
      setWishlistDrinks(data.drinks ?? []);
    } catch (e) {
      console.error(e);
      error("Failed to load wishlist.");
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleConvertConfirm = async () => {
    if (!convertModal.drinkId) return;

    const wishlistId = convertModal.drinkId;

    if (price < 0 || !isFinite(price)) {
      error("Please enter a valid price");
      return;
    }
    if (!Number.isInteger(stock) || stock < 0) {
      error("Stock must be a non-negative integer");
      return;
    }

    setIsConverting(true);
    mark(wishlistId, true);

    try {
      const res = await fetch("/api/admin/convert-wishlist", {
        method: "POST",
        body: JSON.stringify({ wishlistId, price, stock }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to convert wishlist item");
      }

      success(`Converted ${convertModal.drinkName} to a drink!`);
      setWishlistDrinks((prev) => prev.filter((d) => d.id !== wishlistId));
      setConvertModal({ isOpen: false, drinkId: null, drinkName: "" });
      onDrinkAdded?.();
    } catch (e) {
      console.error(e);
      error(e instanceof Error ? e.message : "Unable to convert wishlist item.");
    } finally {
      setIsConverting(false);
      mark(wishlistId, false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.drinkId) return;

    const { drinkId, drinkName } = deleteConfirm;
    setIsDeleting(true);
    mark(drinkId, true);

    try {
      const res = await fetch("/api/admin/delete-wishlist", {
        method: "POST",
        body: JSON.stringify({ wishlistId: drinkId }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete wishlist item");
      }

      setWishlistDrinks((prev) => prev.filter((d) => d.id !== drinkId));
      success(`Deleted ${drinkName} from wishlist!`);
      setDeleteConfirm({ isOpen: false, drinkId: null, drinkName: "" });
    } catch (e) {
      console.error(e);
      error(e instanceof Error ? e.message : "Unable to delete wishlist item.");
    } finally {
      setIsDeleting(false);
      mark(drinkId, false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4 sm:gap-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Wishlist Items</h2>
          <p className="text-sm text-neutral-400 mt-1">
            Convert wishlist items to drinks by adding price and stock
          </p>
        </div>
        <button
          onClick={fetchWishlist}
          className="btn btn-outline text-xs sm:text-sm font-medium sm:font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 px-3 py-2 sm:px-4 sm:py-2 self-start sm:self-auto rounded-full"
        >
          <span className="hidden sm:inline">Refresh</span>
          <span className="sm:hidden">↻</span>
        </button>
      </div>

      <AnimatePresence>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={`skeleton-${i}`} compact />
            ))
          ) : (
            <>
              {wishlistDrinks.map((d) => {
                const isPending = pendingIds.has(d.id);
                return (
                  <motion.div
                    key={d.id}
                    layout
                    variants={CARD_ANIM}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="card bg-neutral-900 p-5 flex flex-col h-full group relative"
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
                    <h2 className="text-xl font-semibold mt-4 truncate text-neutral-100">
                      {d.name}
                    </h2>

                    <div className="mt-5 flex flex-col gap-2 items-center">
                      <button
                        onClick={() =>
                          setConvertModal({ isOpen: true, drinkId: d.id, drinkName: d.name })
                        }
                        disabled={isPending}
                        className="btn px-6 text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#32DE84] disabled:opacity-40 disabled:pointer-events-none rounded-full"
                        style={{ backgroundColor: "#32de84", color: "#000", boxShadow: "none" }}
                      >
                        Add to Inventory
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirm({ isOpen: true, drinkId: d.id, drinkName: d.name })
                        }
                        disabled={isPending}
                        className="btn bg-red-500 hover:bg-red-600 text-black border-red-500 hover:border-red-600 text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 disabled:opacity-40 disabled:pointer-events-none px-4 py-2 rounded-full"
                      >
                        Delete
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </>
          )}
        </div>
      </AnimatePresence>

      {!loading && wishlistDrinks.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-16 text-center text-sm text-neutral-400"
        >
          No wishlist items found.
        </motion.div>
      )}

      {/* Convert Modal (custom — needs price/stock inputs, not a simple confirm) */}
      {convertModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setConvertModal({ isOpen: false, drinkId: null, drinkName: "" })}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="card bg-neutral-900 p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4 text-neutral-100">
              Add to Inventory
            </h2>
            <p className="text-sm text-neutral-400 mb-6">
              Add price and stock for <strong>{convertModal.drinkName}</strong>
            </p>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="convert-price"
                  className="block text-sm font-semibold text-neutral-300 mb-2"
                >
                  Price (€) *
                </label>
                <input
                  id="convert-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price || ""}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  disabled={isConverting}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#32DE84] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label
                  htmlFor="convert-stock"
                  className="block text-sm font-semibold text-neutral-300 mb-2"
                >
                  Stock *
                </label>
                <input
                  id="convert-stock"
                  type="number"
                  min="0"
                  step="1"
                  value={stock || ""}
                  onChange={(e) => setStock(parseInt(e.target.value, 10) || 0)}
                  disabled={isConverting}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#32DE84] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleConvertConfirm}
                disabled={isConverting || price <= 0 || stock < 0}
                className="btn flex-1 text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#32de84] disabled:opacity-40 disabled:pointer-events-none"
                style={{
                  background: "linear-gradient(90deg, #32de84, #229e5c, #6fffc2, #32de84)",
                  backgroundSize: "200% 100%",
                  color: "#fff",
                  animation: "gradient-flow 4s linear infinite",
                }}
              >
                {isConverting ? "Adding..." : "Add to Inventory"}
              </button>
              <button
                onClick={() => {
                  setConvertModal({ isOpen: false, drinkId: null, drinkName: "" });
                  setPrice(0);
                  setStock(0);
                }}
                disabled={isConverting}
                className="btn btn-outline flex-1 text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:opacity-40 disabled:pointer-events-none"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, drinkId: null, drinkName: "" })}
        onConfirm={handleDeleteConfirm}
        isConfirming={isDeleting}
        title="Delete Wishlist Item"
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        description={
          <>
            Are you sure you want to delete{" "}
            <strong>{deleteConfirm.drinkName}</strong> from the wishlist? This
            action cannot be undone.
          </>
        }
      />
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useToasts } from "./ToastProvider";

type WishlistDrink = {
  id: number;
  name: string;
  imageUrl: string | null;
  createdAt: string;
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
    <div className="card bg-white dark:bg-neutral-900 p-5 flex flex-col gap-4 h-full animate-pulse">
      <div className="rounded-xl bg-neutral-200 dark:bg-neutral-800 h-64" />
      <div className="h-6 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
    </div>
  );
}

export default function WishlistView() {
  const [wishlistDrinks, setWishlistDrinks] = useState<WishlistDrink[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    drinkId: number | null;
    drinkName: string;
  }>({ isOpen: false, drinkId: null, drinkName: "" });
  const [isDeleting, setIsDeleting] = useState(false);
  const [newWishlistItem, setNewWishlistItem] = useState({
    name: "",
    imageUrl: "",
  });
  const { success, error } = useToasts();

  const fetchWishlist = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/wishlist", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`Failed to load wishlist (${res.status})`);
      }
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

  const markPending = (id: number, add: boolean) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (add) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleAddWishlist = async () => {
    if (!newWishlistItem.name.trim()) {
      error("Please enter a drink name");
      return;
    }

    setIsAdding(true);

    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        body: JSON.stringify({
          name: newWishlistItem.name.trim(),
          imageUrl: newWishlistItem.imageUrl.trim() || null,
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add wishlist item");
      }

      const data = await res.json();
      success(`Added ${data.drink.name} to wishlist!`);

      // Add the new item to the list
      setWishlistDrinks((prev) => [data.drink, ...prev]);

      // Reset form and close modal
      setNewWishlistItem({ name: "", imageUrl: "" });
      setIsAddModalOpen(false);
    } catch (e) {
      console.error(e);
      error(e instanceof Error ? e.message : "Unable to add wishlist item.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleCancelAdd = () => {
    setNewWishlistItem({ name: "", imageUrl: "" });
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
      const res = await fetch(`/api/wishlist/${drinkId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete wishlist item");
      }

      // Remove item from list
      setWishlistDrinks((prev) => prev.filter((d) => d.id !== drinkId));
      success(`Removed ${drinkName} from wishlist!`);
      setDeleteConfirm({ isOpen: false, drinkId: null, drinkName: "" });
    } catch (e) {
      console.error(e);
      error(e instanceof Error ? e.message : "Unable to delete wishlist item.");
    } finally {
      setIsDeleting(false);
      markPending(drinkId, false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, drinkId: null, drinkName: "" });
  };

  return (
    <div>
      <AnimatePresence>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={`skeleton-${i}`} />
            ))
          ) : (
            <>
              {/* Add to Wishlist Card */}
              <motion.div
                layout
                variants={CARD_ANIM}
                initial="initial"
                animate="animate"
                exit="exit"
                className="card bg-white dark:bg-neutral-900 p-5 flex flex-col h-full group relative cursor-pointer hover:scale-[1.02] transition-transform"
                onClick={() => setIsAddModalOpen(true)}
              >
                <div className="w-full h-64 rounded-xl overflow-hidden relative flex items-center justify-center bg-gradient-to-br from-green-400/30 to-black/60 dark:from-green-900/40 dark:to-black/80 border-2 border-dashed border-green-400/40 dark:border-green-700/40 group-hover:border-green-500/60 dark:group-hover:border-green-600/60 transition-colors">
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
                      Add to Wishlist
                    </span>
                  </div>
                </div>
              </motion.div>

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
                    className="card bg-white dark:bg-neutral-900 p-5 flex flex-col h-full group relative hover:scale-[1.02] transition-transform"
                  >
                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(d.id, d.name);
                      }}
                      disabled={isPending}
                      className="absolute top-3 right-3 z-10 p-2 rounded-lg border-2 border-dashed border-neutral-300/50 dark:border-neutral-600/50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm hover:border-red-400/70 dark:hover:border-red-500/70 hover:bg-red-50/80 dark:hover:bg-red-950/30 text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Delete wishlist item"
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
                          <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-300">
                            <motion.span
                              className="inline-block h-3 w-3 rounded-full bg-green-500"
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
          className="mt-16 text-center text-sm text-neutral-500 dark:text-neutral-400"
        >
          No wishlist items yet. Add your first wishlist item!
        </motion.div>
      )}

      {/* Add Wishlist Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleCancelAdd}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="card bg-white dark:bg-neutral-900 p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">
              Add to Wishlist
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="wishlist-name"
                  className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2"
                >
                  Name *
                </label>
                <input
                  id="wishlist-name"
                  type="text"
                  value={newWishlistItem.name}
                  onChange={(e) =>
                    setNewWishlistItem({
                      ...newWishlistItem,
                      name: e.target.value,
                    })
                  }
                  disabled={isAdding}
                  required
                  className="w-full px-4 py-2 rounded-lg border-2 border-dashed border-green-300/40 dark:border-green-600/40 bg-transparent text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-400/60 dark:focus:border-green-500/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  placeholder="Enter drink name"
                />
              </div>

              <div>
                <label
                  htmlFor="wishlist-imageUrl"
                  className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2"
                >
                  Image URL
                </label>
                <input
                  id="wishlist-imageUrl"
                  type="url"
                  value={newWishlistItem.imageUrl}
                  onChange={(e) =>
                    setNewWishlistItem({
                      ...newWishlistItem,
                      imageUrl: e.target.value,
                    })
                  }
                  disabled={isAdding}
                  className="w-full px-4 py-2 rounded-lg border-2 border-dashed border-green-300/40 dark:border-green-600/40 bg-transparent text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-400/60 dark:focus:border-green-500/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  placeholder="https://example.com/image.png"
                />
              </div>
            </div>

            <div className="flex justify-between gap-3 mt-6">
              <button
                onClick={handleAddWishlist}
                disabled={isAdding || !newWishlistItem.name.trim()}
                className="flex-1 px-7 py-2 rounded-full border border-black text-black text-lg font-semibold transition-all disabled:opacity-40 disabled:pointer-events-none shadow-none"
                style={{ backgroundColor: '#32de84' }}
              >
                {isAdding ? "Adding..." : "Add"}
              </button>
              <button
                onClick={handleCancelAdd}
                disabled={isAdding}
                className="flex-1 px-7 py-2 rounded-full border border-black text-black text-lg font-semibold transition-all disabled:opacity-40 disabled:pointer-events-none shadow-none"
                style={{ background: '#000000', color: '#32de84', boxShadow: 'none' }}
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
            className="card bg-white dark:bg-neutral-900 p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">
              Remove from Wishlist
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              Are you sure you want to remove{" "}
              <strong>{deleteConfirm.drinkName}</strong> from your wishlist?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="btn btn-primary flex-1 text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 disabled:opacity-40 disabled:pointer-events-none bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? "Removing..." : "Remove"}
              </button>
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className="btn btn-outline flex-1 text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 disabled:opacity-40 disabled:pointer-events-none"
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

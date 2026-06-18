"use client";

import { motion } from "framer-motion";
import type { DrinkFormData } from "@/lib/types";

type DrinkFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  title: string;
  submitLabel: string;
  value: DrinkFormData;
  onChange: (data: DrinkFormData) => void;
};

const INPUT_CLASS =
  "w-full px-4 py-2 rounded-lg border-2 border-dashed border-neutral-300/40 dark:border-neutral-600/40 bg-transparent text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#32de84] focus:border-[#32de84]/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

export function DrinkFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  title,
  submitLabel,
  value,
  onChange,
}: DrinkFormModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="card bg-white text-neutral-900 p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-neutral-900 dark:text-neutral-100">
          {title}
        </h2>

        <div className="space-y-3 sm:space-y-4">
          <div>
            <label
              htmlFor="drink-name"
              className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2"
            >
              Name *
            </label>
            <input
              id="drink-name"
              type="text"
              value={value.name}
              onChange={(e) => onChange({ ...value, name: e.target.value })}
              disabled={isSubmitting}
              required
              className={INPUT_CLASS}
              placeholder="Enter drink name"
            />
          </div>

          <div>
            <label
              htmlFor="drink-brand"
              className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2"
            >
              Brand
            </label>
            <input
              id="drink-brand"
              type="text"
              value={value.brand}
              onChange={(e) => onChange({ ...value, brand: e.target.value })}
              disabled={isSubmitting}
              className={INPUT_CLASS}
              placeholder="Enter brand name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="drink-stock"
                className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2"
              >
                Stock *
              </label>
              <input
                id="drink-stock"
                type="number"
                min="0"
                step="1"
                value={value.stock || ""}
                onChange={(e) =>
                  onChange({ ...value, stock: parseInt(e.target.value, 10) || 0 })
                }
                disabled={isSubmitting}
                required
                className={INPUT_CLASS}
                placeholder="0"
              />
            </div>

            <div>
              <label
                htmlFor="drink-price"
                className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2"
              >
                Price (€) *
              </label>
              <input
                id="drink-price"
                type="number"
                min="0"
                step="0.01"
                value={value.price || ""}
                onChange={(e) =>
                  onChange({ ...value, price: parseFloat(e.target.value) || 0 })
                }
                disabled={isSubmitting}
                required
                className={INPUT_CLASS}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="drink-imageUrl"
              className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2"
            >
              Image URL
            </label>
            <input
              id="drink-imageUrl"
              type="url"
              value={value.imageUrl}
              onChange={(e) => onChange({ ...value, imageUrl: e.target.value })}
              disabled={isSubmitting}
              className={INPUT_CLASS}
              placeholder="https://example.com/image.png"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="drink-sugarFree"
              type="checkbox"
              checked={value.sugarFree}
              onChange={(e) => onChange({ ...value, sugarFree: e.target.checked })}
              disabled={isSubmitting}
              className="w-5 h-5 rounded border-2 border-[#32de84] text-[#32de84] focus:ring-2 focus:ring-[#32de84] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            />
            <label
              htmlFor="drink-sugarFree"
              className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer"
            >
              Sugar Free
            </label>
          </div>
        </div>

        <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
          <button
            onClick={onSubmit}
            disabled={isSubmitting || !value.name.trim()}
            className="btn flex-1 text-xs sm:text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#32de84] disabled:opacity-40 disabled:pointer-events-none rounded-full bg-[#32de84] text-white border-none"
            style={{ boxShadow: "none" }}
          >
            {submitLabel}
          </button>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="btn btn-outline flex-1 text-xs sm:text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none rounded-full border"
            style={{ boxShadow: "none" }}
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

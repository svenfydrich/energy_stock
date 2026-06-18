"use client";

import React from "react";
import { motion } from "framer-motion";

type ConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isConfirming: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "danger" | "primary";
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isConfirming,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="card bg-neutral-900 p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 text-neutral-100">{title}</h2>
        <div className="text-sm text-neutral-400 mb-6">{description}</div>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={isConfirming}
            className={`btn flex-1 text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none rounded-full ${
              confirmVariant === "danger"
                ? "bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600 focus:ring-red-400"
                : "btn-primary focus:ring-indigo-400"
            }`}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onClose}
            disabled={isConfirming}
            className="btn btn-outline flex-1 text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:opacity-40 disabled:pointer-events-none rounded-full"
          >
            {cancelLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

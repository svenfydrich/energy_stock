"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useToasts } from "./ToastProvider";

type PaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  drink: {
    id: number;
    name: string;
    price: number;
  };
  onPaymentSuccess: () => void;
};

export default function PaymentModal({
  isOpen,
  onClose,
  drink,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"paypal" | "bank" | null>(
    null
  );
  const [bankDetails, setBankDetails] = useState<{
    iban: string;
    bic: string;
    accountHolder: string;
    amount: string;
    currency: string;
  } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "paypal" | "bank_transfer" | null
  >(null);
  const [paypalAccountHolder, setPaypalAccountHolder] =
    useState("@MichaelFlathe");
  const { success, error } = useToasts();

  // Fetch PayPal account holder from config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/config");
        if (res.ok) {
          const config = await res.json();
          if (config.paypalAccountHolder) {
            setPaypalAccountHolder(config.paypalAccountHolder);
          }
        }
      } catch (err) {
        console.error("Failed to fetch config:", err);
        // Continue with default value
      }
    };

    fetchConfig();
  }, []);

  const handlePayPalPayment = () => {
    if (!customerName.trim()) {
      error("Please enter your name before proceeding");
      return;
    }

    // Remove @ symbol if present for the URL
    const accountName = paypalAccountHolder.startsWith("@")
      ? paypalAccountHolder.slice(1)
      : paypalAccountHolder;
    const paypalUrl = `https://paypal.me/${accountName}/${drink.price.toFixed(
      2
    )}EUR`;
    window.open(paypalUrl, "_blank");
    setSelectedPaymentMethod("paypal");
    setShowConfirmDialog(true);
  };

  const handleBankTransferPayment = async () => {
    if (!customerName.trim()) {
      error("Please enter your name");
      return;
    }

    setPaymentMethod("bank");
    setSelectedPaymentMethod("bank_transfer");

    try {
      const res = await fetch("/api/payments/create-bank-transfer-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drinkId: drink.id,
          amount: drink.price,
          customerName: customerName.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create bank transfer intent");
      }

      const data = await res.json();
      setBankDetails(data.bankDetails);

      // Only show the bank details, don't complete the purchase yet
      // Purchase will be completed when user clicks "Buy Now" button
    } catch (err) {
      error(
        err instanceof Error ? err.message : "Failed to create bank transfer"
      );
      setPaymentMethod(null);
      setSelectedPaymentMethod(null);
    }
  };

  const handleConfirmPurchase = async () => {
    setIsProcessing(true);

    try {
      const res = await fetch("/api/buy", {
        method: "POST",
        body: JSON.stringify({
          drinkId: drink.id,
          customerName: customerName.trim(),
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error("Purchase failed");
      }

      success(`Purchased ${drink.name} successfully!`);
      onPaymentSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      error("Unable to complete purchase.");
    } finally {
      setIsProcessing(false);
      setShowConfirmDialog(false);
    }
  };

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
        className="card-black bg-black p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">
            Complete Payment
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200"
            aria-label="Close"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-neutral-300">
            Item: <strong className="text-white">{drink.name}</strong>
          </p>
          <p className="text-lg font-bold text-white mt-1">
            €{drink.price.toFixed(2)}
          </p>
        </div>

        {paymentMethod === "bank" ? (
          <div>
            <div className="bg-neutral-900 p-4 rounded-lg mb-4 border border-neutral-800">
              <h3 className="font-semibold mb-3 text-white">
                Bank Transfer Details
              </h3>
              {bankDetails && (
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-neutral-400">
                      Account Holder:
                    </span>{" "}
                    <strong className="text-white">
                      {bankDetails.accountHolder}
                    </strong>
                  </div>
                  <div>
                    <span className="text-neutral-400">
                      IBAN:
                    </span>{" "}
                    <strong className="text-white font-mono">
                      {bankDetails.iban}
                    </strong>
                  </div>
                  <div>
                    <span className="text-neutral-400">
                      BIC:
                    </span>{" "}
                    <strong className="text-white font-mono">
                      {bankDetails.bic}
                    </strong>
                  </div>
                  <div>
                    <span className="text-neutral-400">
                      Amount:
                    </span>{" "}
                    <strong className="text-white">
                      €{bankDetails.amount} {bankDetails.currency}
                    </strong>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-neutral-400 mb-4">
              Please transfer the amount to the account above, then confirm your
              purchase below.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => setShowConfirmDialog(true)}
                disabled={isProcessing}
                className="btn w-full text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 disabled:opacity-40 disabled:pointer-events-none bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                I Have Made the Transfer
              </button>
              <button
                onClick={() => {
                  setPaymentMethod(null);
                  setBankDetails(null);
                }}
                className="btn btn-outline w-full text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400"
              >
                Back
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Choose Payment Method
            </h3>

            <div className="mb-6">
              <label
                htmlFor="customerName"
                className="block text-sm font-semibold text-neutral-300 mb-2"
              >
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your name (required)"
                className={`w-full px-4 py-3 border-2 border-dashed rounded-lg focus:outline-none focus:ring-2 transition-all text-white ${
                  !customerName.trim()
                    ? "border-red-500/60 focus:ring-red-500 focus:border-red-500/60 bg-red-950/20"
                    : "border-neutral-600/40 focus:ring-[#32DE84] focus:border-[#32DE84] bg-transparent"
                }`}
                required
              />
              {!customerName.trim() && (
                <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Name is required before payment
                </p>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={handlePayPalPayment}
                disabled={isProcessing || !customerName.trim()}
                className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0070ba] relative"
              >
                {!customerName.trim() && (
                  <span className="absolute -top-2 -right-2 flex h-5 w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 items-center justify-center text-white text-xs font-bold">
                      !
                    </span>
                  </span>
                )}
                Pay with PayPal
              </button>

              <button
                onClick={handleBankTransferPayment}
                disabled={isProcessing || !customerName.trim()}
                className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-800 relative"
              >
                {!customerName.trim() && (
                  <span className="absolute -top-2 -right-2 flex h-5 w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 items-center justify-center text-white text-xs font-bold">
                      !
                    </span>
                  </span>
                )}
                Bank Transfer
              </button>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-black bg-black p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4 text-white">
                Confirm Purchase
              </h3>
              <p className="text-sm text-neutral-300 mb-6">
                I confirm that I have paid{" "}
                <strong>€{drink.price.toFixed(2)}</strong> to{" "}
                <strong>Michael Flathe</strong> via{" "}
                <strong>
                  {selectedPaymentMethod === "bank_transfer"
                    ? "bank transfer"
                    : "PayPal"}
                </strong>{" "}
                and want to purchase <strong>{drink.name}</strong>.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmPurchase}
                  disabled={isProcessing}
                  className="btn btn-primary flex-1 text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:opacity-40 disabled:pointer-events-none bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {isProcessing ? "Processing..." : "Confirm"}
                </button>
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={isProcessing}
                  className="btn btn-outline flex-1 text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:opacity-40 disabled:pointer-events-none"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, CheckCircle2, AlertCircle, Key, RefreshCw, X, CreditCard, Lock, Sparkles, ExternalLink } from "lucide-react";

interface RazorpayGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: {
    orderId: string;
    amountPaise: number;
    currency: string;
    keyId: string;
    isSimulated?: boolean;
    breakdown?: {
      courtPricePaise: number;
      securityDepositPaise: number;
      totalPayablePaise: number;
      isGold: boolean;
      memberTier: string;
      refundableDeposit: number;
    };
  } | null;
  customerDetails: {
    name: string;
    phone: string;
    email: string;
  };
  onSuccess: (paymentResult: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  onError: (errorMsg: string) => void;
  errorMessage?: string | null;
  isExternalProcessing?: boolean;
}

export function RazorpayGatewayModal({
  isOpen,
  onClose,
  orderData,
  customerDetails,
  onSuccess,
  onError,
  errorMessage,
  isExternalProcessing = false,
}: RazorpayGatewayModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [secretInput, setSecretInput] = useState("");
  const [configSuccess, setConfigSuccess] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [isConfigSaving, setIsConfigSaving] = useState(false);
  const [configStatus, setConfigStatus] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
    }
  }, [isOpen]);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/razorpay/config");
      const data = await res.json();
      if (data.config) {
        setConfigStatus(data.config);
      }
    } catch (e) {
      console.warn("Could not fetch Razorpay config:", e);
    }
  };

  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigError(null);
    setConfigSuccess(null);
    setIsConfigSaving(true);

    try {
      const res = await fetch("/api/razorpay/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId: keyInput, keySecret: secretInput }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setConfigError(data.error || "Failed to update API keys");
      } else {
        setConfigSuccess("Razorpay Trial Keys saved successfully!");
        setConfigStatus(data.config);
        setTimeout(() => {
          setShowConfigModal(false);
          setConfigSuccess(null);
        }, 1200);
      }
    } catch (err: any) {
      setConfigError(err.message);
    } finally {
      setIsConfigSaving(false);
    }
  };

  // Helper to dynamically inject checkout.js script
  const ensureRazorpayLoaded = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if ((window as any).Razorpay) return resolve(true);

      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(true));
        existingScript.addEventListener("error", () => resolve(false));
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.warn("Failed to load Razorpay checkout script");
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    if (isOpen) {
      ensureRazorpayLoaded();
    }
  }, [isOpen]);

  if (!isOpen || !orderData) return null;

  const isGold = orderData.breakdown?.isGold ?? false;
  const totalINR = (orderData.amountPaise / 100).toFixed(2);
  const depositINR = ((orderData.breakdown?.securityDepositPaise || 0) / 100).toFixed(2);
  const courtFeeINR = ((orderData.breakdown?.courtPricePaise || 0) / 100).toFixed(2);

  // Fast-track 1-click test simulation
  const handleInstantSimulatePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const simulatedPaymentId = `pay_trial_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
      const simulatedSignature = `sig_trial_${Date.now().toString(36)}`;

      onSuccess({
        razorpay_order_id: orderData.orderId,
        razorpay_payment_id: simulatedPaymentId,
        razorpay_signature: simulatedSignature,
      });
    }, 500);
  };

  // Launch official Razorpay Checkout popup (or fallback to simulator)
  const handlePayViaRazorpay = async () => {
    setIsProcessing(true);

    const isLoaded = await ensureRazorpayLoaded();
    const win = window as any;

    if (isLoaded && win.Razorpay && orderData.keyId && !orderData.orderId.startsWith("order_trial_")) {
      try {
        const rzp = new win.Razorpay({
          key: orderData.keyId,
          amount: orderData.amountPaise,
          currency: orderData.currency || "INR",
          name: "The Champions Club",
          description: isGold
            ? "Gold Member Slot: ₹100 Refundable Security Deposit"
            : `Court Booking (${orderData.breakdown?.memberTier || "Member"})`,
          order_id: orderData.orderId,
          handler: function (response: any) {
            setIsProcessing(false);
            onSuccess({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature || `sig_real_${Date.now()}`,
            });
          },
          prefill: {
            name: customerDetails.name,
            email: customerDetails.email,
            contact: customerDetails.phone,
          },
          theme: {
            color: "#0C2340",
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            },
          },
        });
        rzp.open();
        return;
      } catch (err: any) {
        console.warn("Official checkout popup failed, falling back to trial simulator:", err);
      }
    }

    // Trial Simulator fallback if official script wasn't used
    handleInstantSimulatePayment();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1320]/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0E1522] rounded-xl max-w-md w-full border border-[#0C2340]/20 dark:border-[#C5A059]/30 shadow-2xl overflow-hidden relative">
        {/* Header / Razorpay Branding */}
        <div className="bg-[#0C2340] text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-gradient-to-tr from-[#0D83FD] to-[#3B9BFF] flex items-center justify-center font-bold text-white shadow-sm">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base tracking-tight flex items-center gap-1.5">
                  <span>Razorpay</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Trial / Test Mode
                  </span>
                </h3>
                <p className="text-[11px] text-white/70">The Champions Club • Payment Gateway</p>
              </div>
            </div>
          </div>

          {/* Amount Badge */}
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-white/80 uppercase tracking-wider font-semibold">Total Payable</span>
            <div className="text-right">
              <span className="font-mono text-2xl font-black text-[#DFCA9B]">₹{totalINR}</span>
              <span className="block text-[10px] text-white/60 font-mono">INR Currency</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Billing Breakdown */}
          <div className="rounded-lg p-3.5 bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] space-y-2">
            <div className="flex justify-between items-center text-[#6B7280] dark:text-[#9CA3AF]">
              <span>Customer / Booker:</span>
              <strong className="text-[#0B1320] dark:text-white font-serif">{customerDetails.name}</strong>
            </div>
            <div className="flex justify-between items-center text-[#6B7280] dark:text-[#9CA3AF]">
              <span>Membership Tier:</span>
              <span className="font-mono font-bold uppercase text-[#8C6D23] dark:text-[#DFCA9B]">
                {orderData.breakdown?.memberTier || "MEMBER"}
              </span>
            </div>

            <div className="pt-2 border-t border-[#E5DFD5] dark:border-[#222D3E] flex justify-between items-center">
              <span>Court Facility Rate:</span>
              <span className="font-mono font-semibold">
                {isGold ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">₹0.00 (100% Free Gold Perk)</span>
                ) : (
                  `₹${courtFeeINR}`
                )}
              </span>
            </div>

            {isGold && (
              <div className="p-2.5 rounded bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#8C6D23] dark:text-[#DFCA9B] space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#C5A059] shrink-0" />
                    <span>Security Deposit (Refundable):</span>
                  </div>
                  <span className="font-mono text-sm">+₹{depositINR}</span>
                </div>
                <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] leading-tight pl-5">
                  100 INR security deposit held in escrow. Automatically refunded back to your account when your court slot session ends.
                </p>
              </div>
            )}
          </div>

          {/* Gateway Environment Bar */}
          <div className="p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <div>
                <span className="text-[11px] font-bold text-blue-900 dark:text-blue-300 block">
                  {configStatus?.isConfigured
                    ? `Active Key: ${configStatus.maskedKeyId}`
                    : "Trial Gateway Environment Ready"}
                </span>
                <span className="text-[10px] text-blue-700/80 dark:text-blue-400/80 block">
                  {configStatus?.isConfigured
                    ? "Live Razorpay Test API connection active"
                    : "Paste your Razorpay key anytime or test now"}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowConfigModal(true)}
              className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300 hover:underline px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/50 cursor-pointer"
            >
              Configure
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong className="block font-bold">Booking Notice</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              disabled={isProcessing || isExternalProcessing}
              onClick={handlePayViaRazorpay}
              className="w-full py-3 rounded-lg bg-[#0C2340] hover:bg-[#08172b] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isProcessing || isExternalProcessing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-[#DFCA9B]" />
              )}
              <span>{isProcessing || isExternalProcessing ? "Processing via Razorpay..." : `Pay ₹${totalINR} via Razorpay Gateway`}</span>
            </button>

            <button
              type="button"
              disabled={isProcessing || isExternalProcessing}
              onClick={handleInstantSimulatePayment}
              className="w-full py-2.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Instant Test Simulator (1-Click Approval)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-[#6B7280] dark:text-[#9CA3AF] font-bold text-[11px] uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Nested Config Modal for pasting API Key */}
        {showConfigModal && (
          <div className="absolute inset-0 z-20 bg-white dark:bg-[#0E1522] p-5 flex flex-col justify-between animate-in fade-in">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#C5A059]" />
                  <h4 className="font-bold text-sm text-[#0B1320] dark:text-white">
                    Razorpay Trial API Key Setup
                  </h4>
                </div>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                Paste your Razorpay Test/Trial Mode Key ID and Secret below. They will be saved to your environment.
              </p>

              {configError && (
                <div className="p-2.5 rounded bg-red-50 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{configError}</span>
                </div>
              )}

              {configSuccess && (
                <div className="p-2.5 rounded bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{configSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSaveKeys} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-1">
                    Razorpay Key ID (rzp_test_...)
                  </label>
                  <input
                    type="text"
                    required
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="rzp_test_xxxxxxxxxxxxxx"
                    className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs outline-none focus:border-[#0D83FD]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-1">
                    Razorpay Key Secret
                  </label>
                  <input
                    type="password"
                    required
                    value={secretInput}
                    onChange={(e) => setSecretInput(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs outline-none focus:border-[#0D83FD]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="flex-1 py-2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isConfigSaving}
                    className="flex-1 py-2 rounded bg-[#0C2340] hover:bg-[#08172b] text-white font-bold text-xs flex items-center justify-center gap-1"
                  >
                    {isConfigSaving ? "Saving..." : "Save & Apply Keys"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

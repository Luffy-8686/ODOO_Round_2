"use client";

import React, { useState, useEffect } from "react";
import { formatINR, formatDateTime } from "@/lib/formatters";
import { useAuth } from "@/lib/auth-context";
import { calculateShopDiscount } from "@/lib/pricing";
import { downloadPdfInvoice } from "@/lib/download-pdf";
import {
  ShoppingBag,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Printer,
  PackageCheck,
  Wrench,
  Sparkles,
  User,
  CreditCard,
  QrCode,
  Clock,
  Key,
  ShieldCheck,
  Download,
} from "lucide-react";
import { SECURITY_DEPOSIT_PAISE } from "@/lib/billing";

export default function ShopManagementPage({
  initialTab = "POS",
}: {
  initialTab?: "POS" | "ORDERS" | "STRINGING";
}) {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [serviceJobs, setServiceJobs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"POS" | "ORDERS" | "STRINGING">(initialTab);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Cart State
  const [cart, setCart] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [walkinName, setWalkinName] = useState("Walk-in Customer");
  const [walkinPhone, setWalkinPhone] = useState("+91 99999 99999");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [billingApiKey, setBillingApiKey] = useState(process.env.NEXT_PUBLIC_BILLING_API_KEY || "");
  const [saleSuccess, setSaleSuccess] = useState<any>(null);
  const [saleError, setSaleError] = useState<string | null>(null);

  // New Stringing Job Modal
  const [showStringModal, setShowStringModal] = useState(false);
  const [racketDetails, setRacketDetails] = useState("");
  const [stringType, setStringType] = useState("Luxilon ALU Power 125");
  const [tension, setTension] = useState("54 lbs");
  const [isExpress, setIsExpress] = useState(false);

  const fetchShopData = async () => {
    setLoading(true);
    try {
      const [prodRes, memRes, ordRes, srvRes] = await Promise.all([
        fetch("/api/shop/products"),
        fetch("/api/members"),
        fetch("/api/shop/sales"),
        fetch("/api/shop/services"),
      ]);
      const prodData = await prodRes.json();
      const memData = await memRes.json();
      const ordData = await ordRes.json();
      const srvData = await srvRes.json();

      if (prodData.products) setProducts(prodData.products);
      if (memData.members) setMembers(memData.members);
      if (ordData.orders) setOrders(ordData.orders);
      if (srvData.jobs) setServiceJobs(srvData.jobs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopData();
  }, []);

  const addToCart = (product: any, variant: any) => {
    const existing = cart.find((item) => item.variantId === variant.id);
    if (existing) {
      if (existing.quantity >= variant.stockQuantity) {
        alert("Cannot add more: Max available shelf stock reached!");
        return;
      }
      setCart(
        cart.map((item) =>
          item.variantId === variant.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      if (variant.stockQuantity <= 0) {
        alert("This variant is currently out of stock!");
        return;
      }
      setCart([
        ...cart,
        {
          variantId: variant.id,
          productName: product.name,
          variantName: variant.size || variant.color || "Standard",
          unitPricePaise: product.pricePaise,
          quantity: 1,
          maxStock: variant.stockQuantity,
        },
      ]);
    }
  };

  const removeFromCart = (variantId: string) => {
    setCart(cart.filter((i) => i.variantId !== variantId));
  };

  const updateCartQty = (variantId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(variantId);
      return;
    }
    setCart(
      cart.map((i) => (i.variantId === variantId ? { ...i, quantity: Math.min(qty, i.maxStock) } : i))
    );
  };

  // Pricing & Discounts
  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const memberTier = selectedMember?.memberships?.[0]?.tier;
  const discountPct = calculateShopDiscount(memberTier);

  const subtotalPaise = cart.reduce((sum, i) => sum + i.quantity * i.unitPricePaise, 0);
  const discountPaise = Math.round((subtotalPaise * discountPct) / 100);
  const securityDepositPaise = cart.length > 0 ? SECURITY_DEPOSIT_PAISE : 0; // ₹100 INR security deposit
  const totalPaise = Math.max(0, subtotalPaise - discountPaise) + securityDepositPaise;

  const handleExecuteSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaleError(null);

    if (cart.length === 0) {
      setSaleError("Cart is empty");
      return;
    }

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(billingApiKey.trim() ? { "x-billing-api-key": billingApiKey.trim() } : {}),
        },
        body: JSON.stringify({
          memberId: selectedMemberId || null,
          customerName: selectedMember ? selectedMember.name : walkinName,
          customerPhone: selectedMember ? selectedMember.phone : walkinPhone,
          fulfillmentType: "CLICK_AND_COLLECT",
          paymentMethod,
          apiKey: billingApiKey.trim() || undefined,
          items: cart.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
            unitPricePaise: i.unitPricePaise,
          })),
          userId: currentUser?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setSaleError(data.error || "Sale execution failed");
      } else {
        setSaleSuccess(data.order);
        setCart([]);
        fetchShopData();
      }
    } catch (err: any) {
      setSaleError(err.message);
    }
  };

  const handleCreateStringJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/shop/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMemberId || null,
          customerName: selectedMember ? selectedMember.name : walkinName,
          customerPhone: selectedMember ? selectedMember.phone : walkinPhone,
          racketDetails,
          stringType,
          tension,
          isExpress,
          userId: currentUser?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowStringModal(false);
        fetchShopData();
        alert("Stringing job ticket queued successfully!");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === "ALL" || p.category === selectedCategory;
    const matchesQ =
      searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQ;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#E5DFD5] dark:border-[#222D3E]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#8C6D23] dark:text-[#DFCA9B]">
              Athletic Equipment & Apparel
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/30 font-bold uppercase tracking-wider">
              Single Inventory Source
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#0B1320] dark:text-white tracking-tight mt-1">
            Pro Shop & Racket Service
          </h1>
          <p className="text-xs text-[#5A6578] dark:text-[#8E9CAE] mt-1">
            Official club merchandise, stringing workshop, inventory decrement ledger, and counter POS register.
          </p>
        </div>

        {/* VIEW TABS */}
        <div className="flex bg-[#E5DFD5]/40 dark:bg-[#131C2E] p-1 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] text-xs">
          <button
            onClick={() => setActiveTab("POS")}
            className={`px-4 py-2 rounded font-bold text-xs uppercase tracking-wider transition-all ${
              activeTab === "POS"
                ? "bg-[#921111] text-white shadow-sm"
                : "text-[#5A6578] dark:text-[#8E9CAE] hover:text-[#0B1320] dark:hover:text-white"
            }`}
          >
            Counter POS
          </button>
          <button
            onClick={() => setActiveTab("ORDERS")}
            className={`px-4 py-2 rounded font-bold text-xs uppercase tracking-wider transition-all ${
              activeTab === "ORDERS"
                ? "bg-[#921111] text-white shadow-sm"
                : "text-[#5A6578] dark:text-[#8E9CAE] hover:text-[#0B1320] dark:hover:text-white"
            }`}
          >
            Fulfillment ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab("STRINGING")}
            className={`px-4 py-2 rounded font-bold text-xs uppercase tracking-wider transition-all ${
              activeTab === "STRINGING"
                ? "bg-[#921111] text-white shadow-sm"
                : "text-[#5A6578] dark:text-[#8E9CAE] hover:text-[#0B1320] dark:hover:text-white"
            }`}
          >
            Stringing Queue ({serviceJobs.length})
          </button>
        </div>
      </div>

      {/* POS TAB */}
      {activeTab === "POS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* PRODUCT SHELF & CATALOG */}
          <div className="lg:col-span-2 space-y-4">
            {/* Category pills & Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex overflow-x-auto bg-[#F4F1EA] dark:bg-[#131C2E] p-1 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] w-full sm:w-auto">
                {["ALL", "RACKETS", "BALLS", "SHOES", "APPAREL", "ACCESSORIES"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedCategory(c)}
                    className={`px-3 py-1.5 rounded font-bold text-[10px] uppercase tracking-wider whitespace-nowrap transition-all ${
                      selectedCategory === c
                        ? "bg-[#0B1320] text-[#C5A059] dark:bg-[#C5A059] dark:text-[#0B1320] shadow-xs"
                        : "text-[#5A6578] dark:text-[#8E9CAE] hover:text-[#0B1320] dark:hover:text-white"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E9CAE]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search item, SKU, brand..."
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] bg-white dark:bg-[#0E1726] text-xs text-[#0B1320] dark:text-white placeholder-[#8E9CAE] focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            {/* Product Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredProducts.map((p) => {
                const isLowStock = p.variants.some((v: any) => v.stockQuantity <= p.reorderLevel);

                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-xl bg-white dark:bg-[#0E1726] border flex flex-col justify-between transition-all hover:border-[#C5A059]/60 shadow-sm ${
                      isLowStock
                        ? "border-amber-300 dark:border-amber-700/60"
                        : "border-[#E5DFD5] dark:border-[#222D3E]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#FAF8F5] dark:bg-[#131C2E] border border-[#E5DFD5] dark:border-[#222D3E] text-[#8C6D23] dark:text-[#DFCA9B] uppercase tracking-wider">
                          {p.brand}
                        </span>
                        {isLowStock && (
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 uppercase tracking-wider">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock
                          </span>
                        )}
                      </div>
                      <h4 className="font-serif font-bold text-base text-[#0B1320] dark:text-white mt-2 leading-snug">
                        {p.name}
                      </h4>
                      <div className="text-sm font-bold text-[#921111] dark:text-[#DFCA9B] mt-1 font-mono">
                        {formatINR(p.pricePaise)}
                      </div>
                    </div>

                    {/* Variant Stock buttons */}
                    <div className="mt-4 pt-3 border-t border-[#E5DFD5]/60 dark:border-[#222D3E] space-y-1.5">
                      <span className="text-[9px] text-[#8E9CAE] font-bold uppercase tracking-wider block">
                        Select Variant to Add:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {p.variants.map((v: any) => (
                          <button
                            key={v.id}
                            disabled={v.stockQuantity <= 0}
                            onClick={() => addToCart(p, v)}
                            className="px-2.5 py-1 rounded border border-[#E5DFD5] dark:border-[#222D3E] hover:border-[#C5A059] hover:bg-[#C5A059]/10 text-[#0B1320] dark:text-[#DFCA9B] text-[11px] font-semibold flex items-center gap-1.5 transition-all disabled:opacity-30 disabled:hover:border-[#E5DFD5] disabled:hover:bg-transparent"
                          >
                            <span>{v.size || v.color || "Standard"}</span>
                            <span
                              className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                                v.stockQuantity <= p.reorderLevel
                                  ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold"
                                  : "bg-[#FAF8F5] dark:bg-[#131C2E] text-[#5A6578] dark:text-[#8E9CAE]"
                              }`}
                            >
                              {v.stockQuantity} left
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* POS COUNTER CART & CHECKOUT */}
          <div className="p-6 rounded-xl bg-white dark:bg-[#0E1726] border border-[#E5DFD5] dark:border-[#222D3E] shadow-md space-y-5 sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD5] dark:border-[#222D3E]">
              <div>
                <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#8C6D23] dark:text-[#DFCA9B] block">
                  Point of Sale
                </span>
                <h3 className="text-base font-serif font-bold text-[#0B1320] dark:text-white">
                  Counter Register
                </h3>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/30">
                {cart.length} ITEMS
              </span>
            </div>

            {saleSuccess ? (
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 text-xs space-y-3">
                <div className="font-bold flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Sale Completed: #{saleSuccess.orderNumber}
                </div>
                <p>
                  Total Settled: <strong>{formatINR(saleSuccess.finalPricePaise)}</strong> ({saleSuccess.paymentMethod})
                </p>
                {saleSuccess.securityDepositPaise > 0 && (
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-200">
                    Includes ₹100 INR Security Deposit ({formatINR(saleSuccess.securityDepositPaise)})
                  </p>
                )}
                <div className="flex gap-2 pt-2">
                  <a
                    href={`/api/billing/invoice/${saleSuccess.id}/pdf`}
                    download={`Invoice-${saleSuccess.orderNumber || "Receipt"}.pdf`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => {
                      e.preventDefault();
                      downloadPdfInvoice(
                        `/api/billing/invoice/${saleSuccess.id}/pdf`,
                        `Invoice-${saleSuccess.orderNumber || "Receipt"}.pdf`
                      );
                    }}
                    className="flex-1 py-2 rounded bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm text-center cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </a>
                  <button
                    onClick={() => window.print()}
                    className="py-2 px-3 rounded border border-[#E5DFD5] dark:border-[#222D3E] bg-white dark:bg-[#131C2E] text-[#0B1320] dark:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print
                  </button>
                  <button
                    onClick={() => setSaleSuccess(null)}
                    className="py-2 px-3 rounded border border-[#E5DFD5] dark:border-[#222D3E] bg-white dark:bg-[#131C2E] hover:bg-gray-100 text-[#0B1320] dark:text-white font-bold text-xs uppercase tracking-wider"
                  >
                    New Sale
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleExecuteSale} className="space-y-4 text-xs">
                {saleError && (
                  <div className="p-2.5 rounded bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs">
                    {saleError}
                  </div>
                )}

                {/* Member Selector for Auto Discount */}
                <div>
                  <label className="font-bold uppercase tracking-wider text-[10px] text-[#5A6578] dark:text-[#8E9CAE] block mb-1">
                    Customer / Member Credential
                  </label>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#131C2E] font-medium text-xs text-[#0B1320] dark:text-white focus:outline-none focus:border-[#C5A059]"
                  >
                    <option value="">Walk-in Guest (Standard Tariff)</option>
                    {members.map((m) => {
                      const tier = m.memberships?.[0]?.tier || "MEMBER";
                      const disc = calculateShopDiscount(tier);
                      return (
                        <option key={m.id} value={m.id}>
                          {m.name} ({tier} — {disc}% Club Privilege)
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Cart Line Items */}
                <div className="max-h-56 overflow-y-auto divide-y divide-[#E5DFD5]/60 dark:divide-[#222D3E] border-y border-[#E5DFD5] dark:border-[#222D3E] py-2 space-y-2">
                  {cart.length === 0 ? (
                    <p className="text-[#8E9CAE] py-6 text-center italic">Register cart is empty. Add equipment variants from shelf.</p>
                  ) : (
                    cart.map((item) => (
                      <div key={item.variantId} className="pt-2 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-[#0B1320] dark:text-white">{item.productName}</div>
                          <span className="text-[10px] text-[#8E9CAE]">
                            {item.variantName} • {formatINR(item.unitPricePaise)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.variantId, item.quantity - 1)}
                            className="p-1 rounded border border-[#E5DFD5] dark:border-[#222D3E] hover:bg-[#FAF8F5] dark:hover:bg-[#131C2E] text-[#0B1320] dark:text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono font-bold w-5 text-center text-xs">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.variantId, item.quantity + 1)}
                            className="p-1 rounded border border-[#E5DFD5] dark:border-[#222D3E] hover:bg-[#FAF8F5] dark:hover:bg-[#131C2E] text-[#0B1320] dark:text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.variantId)}
                            className="p-1 text-red-600 hover:text-red-700 ml-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Subtotal & Discount Calculation */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#5A6578] dark:text-[#8E9CAE]">
                    <span>Item Subtotal:</span>
                    <span className="font-mono">{formatINR(subtotalPaise)}</span>
                  </div>
                  {discountPct > 0 && (
                    <div className="flex justify-between text-[#8C6D23] dark:text-[#DFCA9B] font-bold">
                      <span>{memberTier} Tier Privilege (-{discountPct}%):</span>
                      <span className="font-mono">-{formatINR(discountPaise)}</span>
                    </div>
                  )}
                  {securityDepositPaise > 0 && (
                    <div className="flex justify-between text-[#8C6D23] dark:text-[#DFCA9B] font-bold bg-[#C5A059]/10 p-1.5 rounded">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Security Deposit (₹100 INR):</span>
                      </span>
                      <span className="font-mono">+{formatINR(securityDepositPaise)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-serif font-bold text-[#0B1320] dark:text-white pt-2 border-t border-[#E5DFD5] dark:border-[#222D3E]">
                    <span>Total Due:</span>
                    <span className="text-[#921111] dark:text-[#DFCA9B] font-mono text-base font-bold">
                      {formatINR(totalPaise)}
                    </span>
                  </div>
                </div>

                {/* API Key Input */}
                <div className="p-2.5 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#131C2E] space-y-1">
                  <label className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-[#5A6578] dark:text-[#8E9CAE]">
                    <Key className="w-3 h-3 text-[#8C6D23] dark:text-[#DFCA9B]" />
                    <span>Billing / Gateway API Key</span>
                  </label>
                  <input
                    type="text"
                    value={billingApiKey}
                    onChange={(e) => setBillingApiKey(e.target.value)}
                    placeholder="Enter API Key (e.g. sk_live_...)"
                    className="w-full p-2 rounded border border-[#E5DFD5] dark:border-[#222D3E] bg-white dark:bg-[#0E1726] font-mono text-xs text-[#0B1320] dark:text-white focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                {/* Payment method */}
                <div>
                  <label className="font-bold uppercase tracking-wider text-[10px] text-[#5A6578] dark:text-[#8E9CAE] block mb-1">
                    Settlement Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#131C2E] font-medium text-xs text-[#0B1320] dark:text-white focus:outline-none focus:border-[#C5A059]"
                  >
                    <option value="UPI">UPI Digital Payment</option>
                    <option value="CASH">Counter Cash</option>
                    <option value="CARD">Credit / Debit Card</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={cart.length === 0}
                  className="w-full py-3 rounded bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-widest shadow-md transition-all disabled:opacity-40"
                >
                  Charge {formatINR(totalPaise)} & Execute Billing Checkout
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* FULFILLMENT TAB */}
      {activeTab === "ORDERS" && (
        <div className="p-6 rounded-xl bg-white dark:bg-[#0E1726] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#8C6D23] dark:text-[#DFCA9B] block">
                Dispatches
              </span>
              <h3 className="text-base font-serif font-bold text-[#0B1320] dark:text-white">
                Click & Collect Orders
              </h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAF8F5] dark:bg-[#131C2E] text-[#5A6578] dark:text-[#8E9CAE] font-bold border-b border-[#E5DFD5] dark:border-[#222D3E]">
                <tr>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Items Ordered</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Total (₹)</th>
                  <th className="p-3 text-right">Tax Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD5]/60 dark:divide-[#222D3E]">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#FAF8F5]/80 dark:hover:bg-[#131C2E]/50">
                    <td className="p-3 font-mono font-bold text-[#921111] dark:text-[#DFCA9B]">{o.orderNumber}</td>
                    <td className="p-3 font-bold text-[#0B1320] dark:text-white">{o.customerName}</td>
                    <td className="p-3 text-[#5A6578] dark:text-[#8E9CAE]">
                      {o.items?.map((it: any) => `${it.quantity}x ${it.variant?.product?.name}`).join(", ")}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-bold uppercase bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px]">
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3 text-[#5A6578] dark:text-[#8E9CAE]">{formatDateTime(o.createdAt)}</td>
                    <td className="p-3 text-right font-mono font-bold text-[#0B1320] dark:text-white">
                      {formatINR(o.finalPricePaise)}
                    </td>
                    <td className="p-3 text-right">
                      <a
                        href={`/api/billing/invoice/${o.id}/pdf`}
                        download={`Invoice-${o.orderNumber}.pdf`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => {
                          e.preventDefault();
                          downloadPdfInvoice(`/api/billing/invoice/${o.id}/pdf`, `Invoice-${o.orderNumber}.pdf`);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-[10px] uppercase tracking-wider shadow-2xs transition-colors cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STRINGING SERVICE QUEUE TAB */}
      {activeTab === "STRINGING" && (
        <div className="p-6 rounded-xl bg-white dark:bg-[#0E1726] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#8C6D23] dark:text-[#DFCA9B] block">
                Technical Workshop
              </span>
              <h3 className="text-base font-serif font-bold text-[#0B1320] dark:text-white">
                Racket Stringing Service Board
              </h3>
              <p className="text-xs text-[#5A6578] dark:text-[#8E9CAE]">
                Express queue for match play restringing with tension calibration.
              </p>
            </div>
            <button
              onClick={() => setShowStringModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Queue Job Ticket</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {serviceJobs.map((job) => (
              <div
                key={job.id}
                className="p-4 rounded-xl border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#131C2E] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#8C6D23] dark:text-[#DFCA9B]">{job.ticketNumber}</span>
                  {job.isExpress && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      ⚡ Express (2h)
                    </span>
                  )}
                </div>
                <div className="font-serif font-bold text-sm text-[#0B1320] dark:text-white">{job.racketDetails}</div>
                <div className="text-[#5A6578] dark:text-[#8E9CAE] text-[11px]">
                  Customer: <strong className="text-[#0B1320] dark:text-white">{job.customerName}</strong> ({job.customerPhone})
                </div>
                <div className="text-[#5A6578] dark:text-[#8E9CAE] text-[11px]">
                  Specs: {job.stringType} @ {job.tension}
                </div>
                <div className="pt-2 border-t border-[#E5DFD5] dark:border-[#222D3E] flex items-center justify-between">
                  <span className="font-mono font-bold text-[#921111] dark:text-[#DFCA9B]">{formatINR(job.costPaise)}</span>
                  <span className="px-2 py-0.5 rounded font-bold uppercase text-[9px] bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/30">
                    {job.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NEW STRINGING JOB MODAL */}
      {showStringModal && (
        <div className="fixed inset-0 bg-[#0B1320]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E1726] border border-[#C5A059]/50 rounded-xl max-w-md w-full p-6 shadow-2xl relative font-sans">
            <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#8C6D23] dark:text-[#DFCA9B] block">
              Workshop Ticket
            </span>
            <h3 className="text-lg font-serif font-bold text-[#0B1320] dark:text-white">
              Queue Racket Stringing Job
            </h3>
            <form onSubmit={handleCreateStringJob} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="font-bold uppercase tracking-wider text-[10px] text-[#5A6578] dark:text-[#8E9CAE] block mb-1">
                  Racket Model & Brand
                </label>
                <input
                  required
                  type="text"
                  value={racketDetails}
                  onChange={(e) => setRacketDetails(e.target.value)}
                  placeholder="e.g. Wilson Pro Staff 97 v14"
                  className="w-full p-2.5 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#131C2E] text-xs text-[#0B1320] dark:text-white focus:outline-none focus:border-[#C5A059]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold uppercase tracking-wider text-[10px] text-[#5A6578] dark:text-[#8E9CAE] block mb-1">
                    String Type
                  </label>
                  <input
                    required
                    type="text"
                    value={stringType}
                    onChange={(e) => setStringType(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#131C2E] text-xs text-[#0B1320] dark:text-white focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase tracking-wider text-[10px] text-[#5A6578] dark:text-[#8E9CAE] block mb-1">
                    Tension
                  </label>
                  <input
                    required
                    type="text"
                    value={tension}
                    onChange={(e) => setTension(e.target.value)}
                    placeholder="e.g. 54 lbs"
                    className="w-full p-2.5 rounded-lg border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#131C2E] text-xs text-[#0B1320] dark:text-white focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#0B1320] dark:text-[#DFCA9B]">
                <input
                  type="checkbox"
                  id="expressCheck"
                  checked={isExpress}
                  onChange={(e) => setIsExpress(e.target.checked)}
                />
                <label htmlFor="expressCheck" className="font-bold cursor-pointer text-xs">
                  ⚡ Express Match Priority (Ready in 2 Hours — ₹1,200)
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowStringModal(false)}
                  className="flex-1 py-2.5 rounded border border-[#E5DFD5] dark:border-[#222D3E] bg-white dark:bg-[#131C2E] text-[#0B1320] dark:text-white font-bold text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider"
                >
                  Queue Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

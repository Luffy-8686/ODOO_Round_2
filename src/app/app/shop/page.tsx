"use client";

import React, { useState, useEffect } from "react";
import { formatINR, formatDateTime } from "@/lib/formatters";
import { useAuth } from "@/lib/auth-context";
import { calculateShopDiscount } from "@/lib/pricing";
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
} from "lucide-react";

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
  const totalPaise = Math.max(0, subtotalPaise - discountPaise);

  const handleExecuteSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaleError(null);

    if (cart.length === 0) {
      setSaleError("Cart is empty");
      return;
    }

    try {
      const res = await fetch("/api/shop/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMemberId || null,
          customerName: selectedMember ? selectedMember.name : walkinName,
          customerPhone: selectedMember ? selectedMember.phone : walkinPhone,
          fulfillmentType: "CLICK_AND_COLLECT",
          paymentMethod,
          items: cart.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
            unitPricePaise: i.unitPricePaise,
          })),
          discountPaise,
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER & TABS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Gear Shop & Inventory
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold">
              ONE INVENTORY TRUTH
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Counter POS checkout, stock decrement ledger, click & collect orders, and racket stringing service.
          </p>
        </div>

        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab("POS")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "POS"
                ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-sm font-bold"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Counter POS
          </button>
          <button
            onClick={() => setActiveTab("ORDERS")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "ORDERS"
                ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-sm font-bold"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Fulfillment ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab("STRINGING")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "STRINGING"
                ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-sm font-bold"
                : "text-slate-600 dark:text-slate-400"
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
              <div className="flex overflow-x-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs w-full sm:w-auto">
                {["ALL", "RACKETS", "BALLS", "SHOES", "APPAREL", "ACCESSORIES"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedCategory(c)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap ${
                      selectedCategory === c
                        ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-xs"
                        : "text-slate-500"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search item, SKU, brand..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
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
                    className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border shadow-xs flex flex-col justify-between ${
                      isLowStock
                        ? "border-amber-300 dark:border-amber-800/80"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                          {p.brand}
                        </span>
                        {isLowStock && (
                          <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-2">{p.name}</h4>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block mt-1">
                        {formatINR(p.pricePaise)}
                      </span>
                    </div>

                    {/* Variant Stock buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                        Select Variant to Add:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {p.variants.map((v: any) => (
                          <button
                            key={v.id}
                            disabled={v.stockQuantity <= 0}
                            onClick={() => addToCart(p, v)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-purple-950/60 text-slate-700 dark:text-slate-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
                          >
                            <span>{v.size || v.color || "Standard"}</span>
                            <span
                              className={`text-[9px] px-1 rounded font-mono ${
                                v.stockQuantity <= p.reorderLevel
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
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
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Counter Register</h3>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                {cart.length} ITEMS
              </span>
            </div>

            {saleSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-100 text-xs space-y-3">
                <div className="font-bold flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Sale Completed: #{saleSuccess.orderNumber}
                </div>
                <p>Total Paid: <strong>{formatINR(saleSuccess.finalPricePaise)}</strong> ({saleSuccess.paymentMethod})</p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 py-2 rounded-lg bg-white dark:bg-slate-800 border text-slate-800 dark:text-slate-200 font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Receipt
                  </button>
                  <button
                    onClick={() => setSaleSuccess(null)}
                    className="flex-1 py-2 rounded-lg bg-emerald-600 text-white font-bold"
                  >
                    New Sale
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleExecuteSale} className="space-y-4 text-xs">
                {saleError && (
                  <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950 text-red-700 text-xs">
                    {saleError}
                  </div>
                )}

                {/* Member Selector for Auto Discount */}
                <div>
                  <label className="font-semibold block mb-1">Customer / Member</label>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-semibold"
                  >
                    <option value="">Walk-in Customer (0% Discount)</option>
                    {members.map((m) => {
                      const tier = m.memberships?.[0]?.tier || "MEMBER";
                      const disc = calculateShopDiscount(tier);
                      return (
                        <option key={m.id} value={m.id}>
                          {m.name} ({tier} — {disc}% Off)
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Cart Line Items */}
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border-y border-slate-100 dark:border-slate-800 py-2 space-y-2">
                  {cart.length === 0 ? (
                    <p className="text-slate-400 py-6 text-center">Cart is empty. Click a variant on the left.</p>
                  ) : (
                    cart.map((item) => (
                      <div key={item.variantId} className="pt-2 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">{item.productName}</div>
                          <span className="text-[10px] text-slate-400">
                            {item.variantName} • {formatINR(item.unitPricePaise)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.variantId, item.quantity - 1)}
                            className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono font-bold w-4 text-center">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.variantId, item.quantity + 1)}
                            className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.variantId)}
                            className="p-1 text-red-500 hover:text-red-700"
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
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span>{formatINR(subtotalPaise)}</span>
                  </div>
                  {discountPct > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>{memberTier} Tier Discount ({discountPct}%):</span>
                      <span>-{formatINR(discountPaise)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span>Total Payable:</span>
                    <span className="text-purple-600">{formatINR(totalPaise)}</span>
                  </div>
                </div>

                {/* Payment method */}
                <div>
                  <label className="font-semibold block mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-semibold"
                  >
                    <option value="UPI">UPI (QR Code)</option>
                    <option value="CASH">Cash Drawer</option>
                    <option value="CARD">Credit / Debit Card</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={cart.length === 0}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-md shadow-purple-600/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  Charge {formatINR(totalPaise)} & Decrement Stock
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* FULFILLMENT TAB */}
      {activeTab === "ORDERS" && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Click & Collect Orders</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b">
                <tr>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-purple-600">{o.orderNumber}</td>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{o.customerName}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {o.items?.map((it: any) => `${it.quantity}x ${it.variant?.product?.name}`).join(", ")}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-bold uppercase bg-emerald-50 text-emerald-700 text-[10px]">
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{formatDateTime(o.createdAt)}</td>
                    <td className="p-3 text-right font-bold">{formatINR(o.finalPricePaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STRINGING SERVICE QUEUE TAB */}
      {activeTab === "STRINGING" && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Racket Stringing Service Board</h3>
              <p className="text-xs text-slate-500">"My string snapped 10 mins before play" express queue</p>
            </div>
            <button
              onClick={() => setShowStringModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white font-bold text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Stringing Job</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {serviceJobs.map((job) => (
              <div
                key={job.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-purple-600">{job.ticketNumber}</span>
                  {job.isExpress && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      ⚡ Express (2h)
                    </span>
                  )}
                </div>
                <div className="font-bold text-slate-900 dark:text-white">{job.racketDetails}</div>
                <div className="text-slate-500 text-[11px]">
                  Customer: <strong>{job.customerName}</strong> ({job.customerPhone})
                </div>
                <div className="text-slate-500 text-[11px]">
                  Specs: {job.stringType} @ {job.tension}
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="font-bold text-emerald-600">{formatINR(job.costPaise)}</span>
                  <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-purple-100 text-purple-800">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Racket Stringing Job Ticket</h3>
            <form onSubmit={handleCreateStringJob} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Racket Model</label>
                <input
                  required
                  type="text"
                  value={racketDetails}
                  onChange={(e) => setRacketDetails(e.target.value)}
                  placeholder="e.g. Wilson Pro Staff 97"
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">String Type</label>
                  <input
                    required
                    type="text"
                    value={stringType}
                    onChange={(e) => setStringType(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Tension</label>
                  <input
                    required
                    type="text"
                    value={tension}
                    onChange={(e) => setTension(e.target.value)}
                    placeholder="e.g. 54 lbs"
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200">
                <input
                  type="checkbox"
                  id="expressCheck"
                  checked={isExpress}
                  onChange={(e) => setIsExpress(e.target.checked)}
                />
                <label htmlFor="expressCheck" className="font-bold cursor-pointer">
                  ⚡ Express Priority (Ready in 2 Hours — ₹1,200)
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowStringModal(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-purple-600 text-white font-bold"
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

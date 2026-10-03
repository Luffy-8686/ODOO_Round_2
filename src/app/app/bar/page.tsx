"use client";

import React, { useState, useEffect } from "react";
import { formatINR, formatDateTime, formatTime } from "@/lib/formatters";
import { useAuth } from "@/lib/auth-context";
import { calculateBarDiscount } from "@/lib/pricing";
import {
  Coffee,
  Utensils,
  CheckCircle2,
  Clock,
  QrCode,
  DollarSign,
  Printer,
  FileSpreadsheet,
  AlertTriangle,
  Plus,
  Minus,
  Sparkles,
  Layers,
  Split,
  ChevronRight,
  UserCheck,
} from "lucide-react";

export default function BarManagementPage(props: any) {
  const initialView: "TABLES" | "POS" | "KDS" | "TABS" | "SHIFTS" | "EOD" = props?.initialView || "TABLES";
  const { currentUser } = useAuth();
  const [tables, setTables] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [openTabs, setOpenTabs] = useState<any[]>([]);
  const [kdsOrders, setKdsOrders] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<"TABLES" | "POS" | "KDS" | "TABS" | "SHIFTS" | "EOD">(initialView);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // Table selection & POS state
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<any>(null);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [posCart, setPosCart] = useState<any[]>([]);
  const [orderNotes, setOrderNotes] = useState("");

  // Settle Bill Modal
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [tabToSettle, setTabToSettle] = useState<any>(null);
  const [cashAmount, setCashAmount] = useState(0);
  const [upiAmount, setUpiAmount] = useState(0);
  const [cardAmount, setCardAmount] = useState(0);
  const [manualDiscount, setManualDiscount] = useState(0);
  const [discountReason, setDiscountReason] = useState("");

  // Shift Modal
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftAction, setShiftAction] = useState<"CLOCK_IN" | "CLOCK_OUT">("CLOCK_IN");
  const [openingFloat, setOpeningFloat] = useState(5000);
  const [closingCash, setClosingCash] = useState(0);
  const [eodReport, setEodReport] = useState<any>(null);

  const fetchBarData = async () => {
    setLoading(true);
    try {
      const [tblRes, mnuRes, tabRes, kdsRes, memRes] = await Promise.all([
        fetch("/api/bar/tables"),
        fetch("/api/bar/menu"),
        fetch("/api/bar/tabs?status=OPEN"),
        fetch("/api/bar/orders"),
        fetch("/api/members"),
      ]);
      const tblData = await tblRes.json();
      const mnuData = await mnuRes.json();
      const tabData = await tabRes.json();
      const kdsData = await kdsRes.json();
      const memData = await memRes.json();

      if (tblData.tables) setTables(tblData.tables);
      if (mnuData.items) setMenuItems(mnuData.items);
      if (tabData.tabs) setOpenTabs(tabData.tabs);
      if (kdsData.orders) setKdsOrders(kdsData.orders);
      if (memData.members) setMembers(memData.members);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchEodReport = async () => {
    try {
      const res = await fetch("/api/bar/shifts?report=eod");
      const data = await res.json();
      setEodReport(data);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchBarData();
    if (activeView === "EOD") fetchEodReport();

    // Auto-refresh KDS every 10 seconds for real-time kitchen updates
    const interval = setInterval(fetchBarData, 10000);
    return () => clearInterval(interval);
  }, [activeView]);

  const addToCart = (item: any) => {
    const existing = posCart.find((c) => c.menuItemId === item.id);
    if (existing) {
      setPosCart(
        posCart.map((c) =>
          c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      );
    } else {
      setPosCart([
        ...posCart,
        {
          menuItemId: item.id,
          name: item.name,
          unitPricePaise: item.pricePaise,
          quantity: 1,
        },
      ]);
    }
  };

  const updateCartQty = (menuItemId: string, qty: number) => {
    if (qty <= 0) {
      setPosCart(posCart.filter((c) => c.menuItemId !== menuItemId));
    } else {
      setPosCart(posCart.map((c) => (c.menuItemId === menuItemId ? { ...c, quantity: qty } : c)));
    }
  };

  const handleSendToKitchen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (posCart.length === 0) {
      alert("Cart is empty");
      return;
    }

    try {
      const res = await fetch("/api/bar/tabs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tabId: selectedTab?.id,
          tableId: selectedTable?.id,
          memberId: selectedMemberId || null,
          guestName: selectedTable ? `Table ${selectedTable.tableNumber}` : guestName,
          orderNotes,
          items: posCart.map((c) => ({
            menuItemId: c.menuItemId,
            quantity: c.quantity,
            unitPricePaise: c.unitPricePaise,
          })),
          staffUserId: currentUser?.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Order sent straight to Kitchen Display System (KDS) & added to Tab!");
        setPosCart([]);
        setOrderNotes("");
        fetchBarData();
        setActiveView("KDS");
      }
    } catch (e: any) {
      alert("Error sending order: " + e.message);
    }
  };

  const handleUpdateKdsStatus = async (orderId: string, nextStatus: string) => {
    try {
      await fetch("/api/bar/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: nextStatus }),
      });
      fetchBarData();
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleOpenSettleModal = (tab: any) => {
    setTabToSettle(tab);
    setCashAmount(Math.round(tab.finalAmountPaise / 100));
    setUpiAmount(0);
    setCardAmount(0);
    setManualDiscount(0);
    setShowSettleModal(true);
  };

  const handleExecuteSettlement = async () => {
    if (!tabToSettle) return;

    const payments: any[] = [];
    if (cashAmount > 0) payments.push({ method: "CASH", amountPaise: cashAmount * 100 });
    if (upiAmount > 0) payments.push({ method: "UPI", amountPaise: upiAmount * 100 });
    if (cardAmount > 0) payments.push({ method: "CARD", amountPaise: cardAmount * 100 });

    try {
      const res = await fetch("/api/bar/tabs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SETTLE",
          tabId: tabToSettle.id,
          payments,
          manualDiscountPaise: manualDiscount * 100,
          discountReason,
          staffUserId: currentUser?.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`Tab #${tabToSettle.tabNumber} settled successfully! Table is now FREE.`);
        setShowSettleModal(false);
        fetchBarData();
      } else {
        alert("Settlement error: " + data.error);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const filteredMenuItems = menuItems.filter((i) => {
    if (selectedCategory === "ALL") return true;
    return i.category === selectedCategory;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER & VIEW SELECTOR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DFD5] dark:border-[#222D3E]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-2xl font-bold text-[#0B1320] dark:text-white tracking-tight">
              Clubhouse Dining, Bar & KDS
            </h1>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded font-bold uppercase tracking-wider bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/40">
              KDS & RUNNING TABS
            </span>
          </div>
          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
            Interactive table floor map, tablet ordering POS, live kitchen display system, member running tabs, and EOD closing reconciliation.
          </p>
        </div>

        <div className="flex bg-[#FAF8F5] dark:bg-[#121A28] p-1 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveView("TABLES")}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap text-xs font-bold uppercase tracking-wider ${
              activeView === "TABLES" ? "bg-[#921111] text-white shadow-xs font-bold" : "text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#0B1320]"
            }`}
          >
            Floor Map ({tables.length})
          </button>
          <button
            onClick={() => setActiveView("POS")}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap text-xs font-bold uppercase tracking-wider ${
              activeView === "POS" ? "bg-[#921111] text-white shadow-xs font-bold" : "text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#0B1320]"
            }`}
          >
            Tablet POS
          </button>
          <button
            onClick={() => setActiveView("KDS")}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap text-xs font-bold uppercase tracking-wider ${
              activeView === "KDS" ? "bg-[#921111] text-white shadow-xs font-bold" : "text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#0B1320]"
            }`}
          >
            Live KDS ({kdsOrders.length})
          </button>
          <button
            onClick={() => setActiveView("TABS")}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap text-xs font-bold uppercase tracking-wider ${
              activeView === "TABS" ? "bg-[#921111] text-white shadow-xs font-bold" : "text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#0B1320]"
            }`}
          >
            Open Tabs ({openTabs.length})
          </button>
          <button
            onClick={() => {
              setActiveView("EOD");
              fetchEodReport();
            }}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap text-xs font-bold uppercase tracking-wider ${
              activeView === "EOD" ? "bg-[#921111] text-white shadow-xs font-bold" : "text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#0B1320]"
            }`}
          >
            EOD Report
          </button>
        </div>
      </div>

      {/* 1. TABLE FLOOR MAP VIEW */}
      {activeView === "TABLES" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] text-xs">
            <div className="flex items-center gap-4">
              <span className="font-bold text-[#8C6D23] dark:text-[#DFCA9B] uppercase text-[10px] tracking-wider">Table Status:</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#C5A059]" />
                <span className="text-[#0B1320] dark:text-white font-medium">Free (Tap to seat)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#921111]" />
                <span className="text-[#0B1320] dark:text-white font-medium">Occupied / Active Tab</span>
              </div>
            </div>
            <span className="text-[#6B7280] dark:text-[#9CA3AF] font-mono">Total Club Dining Capacity: 48 Seats</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {tables.map((tbl) => {
              const activeTab = tbl.tabs?.[0];
              const isOccupied = tbl.status === "OCCUPIED" || !!activeTab;

              return (
                <div
                  key={tbl.id}
                  onClick={() => {
                    setSelectedTable(tbl);
                    setSelectedTab(activeTab);
                    setActiveView("POS");
                  }}
                  className={`p-5 rounded-lg border cursor-pointer transition-all shadow-xs hover:border-[#C5A059] flex flex-col justify-between h-40 ${
                    isOccupied
                      ? "bg-[#FAF8F5]/80 dark:bg-[#121A28]/80 border-[#C5A059]/60"
                      : "bg-white dark:bg-[#0E1522] border-[#E5DFD5] dark:border-[#222D3E]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-base text-[#0B1320] dark:text-white">
                      Table {tbl.tableNumber}
                    </span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isOccupied ? "bg-[#921111]" : "bg-[#C5A059]"
                      }`}
                    />
                  </div>

                  <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                    <div className="font-serif text-[#0B1320] dark:text-white">{tbl.name}</div>
                    <span className="text-[10px] text-[#8C6D23] dark:text-[#DFCA9B] uppercase font-bold tracking-wider">Capacity: {tbl.capacity} Persons</span>
                  </div>

                  <div className="pt-2 border-t border-[#E5DFD5] dark:border-[#222D3E] flex items-center justify-between text-xs">
                    {isOccupied ? (
                      <>
                        <span className="font-mono font-bold text-[#921111] dark:text-[#DFCA9B]">
                          {formatINR(activeTab?.finalAmountPaise || 0)}
                        </span>
                        <span className="text-[10px] text-[#8C6D23] dark:text-[#DFCA9B] uppercase tracking-wider font-bold">Active Tab →</span>
                      </>
                    ) : (
                      <span className="text-[#8C6D23] dark:text-[#DFCA9B] font-bold text-[11px] uppercase tracking-wider">+ Order</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. TABLET POS TAP SCREEN */}
      {activeView === "POS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* MENU ITEMS SHELF */}
          <div className="lg:col-span-2 space-y-4">
            {/* Category pills */}
            <div className="flex overflow-x-auto bg-[#FAF8F5] dark:bg-[#121A28] p-1 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] text-xs">
              {["ALL", "HOT_BEVERAGES", "COLD_BEVERAGES", "HEALTH_SHAKES", "SNACKS", "MEALS", "DESSERTS"].map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-3 py-1.5 rounded-md font-bold text-[11px] uppercase tracking-wider whitespace-nowrap transition-all ${
                    selectedCategory === c ? "bg-[#921111] text-white shadow-xs" : "text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#0B1320]"
                  }`}
                >
                  {c.replace("_", " ")}
                </button>
              ))}
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredMenuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="p-4 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] hover:border-[#C5A059] text-left transition-all shadow-xs flex flex-col justify-between h-28 active:scale-98"
                >
                  <div>
                    <span className="font-serif font-bold text-xs text-[#0B1320] dark:text-white line-clamp-2">{item.name}</span>
                    <span className="text-[9px] font-mono text-[#8C6D23] dark:text-[#DFCA9B] uppercase tracking-wider block mt-0.5">{item.category}</span>
                  </div>
                  <span className="font-serif font-bold text-xs text-[#921111] dark:text-[#DFCA9B]">{formatINR(item.pricePaise)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* POS TAB CART & KITCHEN DISPATCH */}
          <div className="p-6 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm space-y-4 sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD5] dark:border-[#222D3E]">
              <div>
                <h3 className="font-serif text-base font-bold text-[#0B1320] dark:text-white">
                  {selectedTable ? `Table ${selectedTable.tableNumber}` : "Bar Counter"}
                </h3>
                <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">Route to Kitchen & Add to Tab</span>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/30">
                {posCart.length} ITEMS
              </span>
            </div>

            {/* Member selector for tier discount */}
            <div>
              <label className="text-[10px] uppercase font-bold text-[#8C6D23] dark:text-[#DFCA9B] tracking-wider block mb-1">Linked Member (For Tier Privilege)</label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full p-2 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#121A28] text-xs font-serif font-bold text-[#0B1320] dark:text-white"
              >
                <option value="">Walk-in Guest (0% Discount)</option>
                {members.map((m) => {
                  const tier = m.memberships?.[0]?.tier || "MEMBER";
                  const disc = calculateBarDiscount(tier);
                  return (
                    <option key={m.id} value={m.id}>
                      {m.name} ({tier} — {disc}% Off F&B)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Cart Line Items */}
            <div className="max-h-48 overflow-y-auto divide-y divide-[#E5DFD5] dark:divide-[#222D3E] py-1 space-y-1.5 text-xs">
              {posCart.length === 0 ? (
                <p className="text-[#6B7280] dark:text-[#9CA3AF] py-6 text-center">Select any food or beverage item on the left to add.</p>
              ) : (
                posCart.map((c) => (
                  <div key={c.menuItemId} className="pt-1.5 flex items-center justify-between">
                    <div>
                      <div className="font-serif font-bold text-[#0B1320] dark:text-white">{c.name}</div>
                      <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">{formatINR(c.unitPricePaise)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateCartQty(c.menuItemId, c.quantity - 1)}
                        className="p-1 rounded bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E]"
                      >
                        <Minus className="w-3 h-3 text-[#0B1320] dark:text-white" />
                      </button>
                      <span className="font-mono font-bold w-4 text-center text-[#0B1320] dark:text-white">{c.quantity}</span>
                      <button
                        onClick={() => updateCartQty(c.menuItemId, c.quantity + 1)}
                        className="p-1 rounded bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E]"
                      >
                        <Plus className="w-3 h-3 text-[#0B1320] dark:text-white" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-[#8C6D23] dark:text-[#DFCA9B] tracking-wider block mb-1">Kitchen Instructions / Priority</label>
              <input
                type="text"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="e.g. Less spicy, priority rush"
                className="w-full p-2 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#121A28] text-xs text-[#0B1320] dark:text-white"
              />
            </div>

            <button
              onClick={handleSendToKitchen}
              disabled={posCart.length === 0}
              className="w-full py-3 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-widest shadow-sm active:scale-98 transition-all disabled:opacity-50"
            >
              Route to Kitchen Display (KDS) & Add to Tab
            </button>
          </div>
        </div>
      )}

      {/* 3. LIVE KITCHEN DISPLAY SYSTEM (KDS) */}
      {activeView === "KDS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD5] dark:border-[#222D3E]">
            <h3 className="font-serif text-base font-bold text-[#0B1320] dark:text-white">Live Kitchen Display System (KDS)</h3>
            <span className="text-[10px] font-mono text-[#8C6D23] dark:text-[#DFCA9B] font-bold uppercase tracking-wider animate-pulse">
              ● Live Kitchen Dispatch
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {kdsOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-5 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm flex flex-col justify-between text-xs space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-[#E5DFD5] dark:border-[#222D3E]">
                    <span className="font-mono font-bold text-[#921111] dark:text-[#DFCA9B]">#{ord.orderNumber}</span>
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold uppercase text-[9px] tracking-wider ${
                        ord.status === "NEW"
                          ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200"
                          : ord.status === "PREPARING"
                          ? "bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/30"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200"
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>

                  <div className="mt-2 font-serif font-bold text-sm text-[#0B1320] dark:text-white">
                    {ord.table ? `Table ${ord.table.tableNumber}` : "Bar Counter"}
                  </div>
                  {ord.notes && (
                    <div className="text-[11px] text-[#8C6D23] bg-[#FAF8F5] dark:bg-[#121A28] p-1.5 rounded mt-1 border border-[#E5DFD5] dark:border-[#222D3E]">
                      Note: {ord.notes}
                    </div>
                  )}

                  <div className="mt-3 space-y-1.5 divide-y divide-[#E5DFD5] dark:divide-[#222D3E]">
                    {ord.items?.map((it: any) => (
                      <div key={it.id} className="pt-1 flex items-center justify-between">
                        <span className="font-serif font-bold text-[#0B1320] dark:text-white">
                          {it.quantity}x {it.menuItem?.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status action buttons */}
                <div className="pt-3 border-t border-[#E5DFD5] dark:border-[#222D3E] flex gap-2">
                  {ord.status === "NEW" && (
                    <button
                      onClick={() => handleUpdateKdsStatus(ord.id, "PREPARING")}
                      className="w-full py-2 rounded-md bg-[#C5A059] hover:bg-[#A8843D] text-white font-bold text-xs uppercase tracking-wider transition-colors"
                    >
                      Start Preparation
                    </button>
                  )}
                  {ord.status === "PREPARING" && (
                    <button
                      onClick={() => handleUpdateKdsStatus(ord.id, "READY")}
                      className="w-full py-2 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider transition-colors"
                    >
                      Ready for Server
                    </button>
                  )}
                  {ord.status === "READY" && (
                    <button
                      onClick={() => handleUpdateKdsStatus(ord.id, "SERVED")}
                      className="w-full py-2 rounded-md bg-[#0B1320] dark:bg-white text-white dark:text-[#0B1320] font-bold text-xs uppercase tracking-wider transition-colors"
                    >
                      Mark as Served
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. OPEN TABS LEDGER */}
      {activeView === "TABS" && (
        <div className="p-6 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD5] dark:border-[#222D3E]">
            <div>
              <h3 className="font-serif text-base font-bold text-[#0B1320] dark:text-white">Active Member Running Tabs</h3>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Clubhouse F&B charges awaiting final settlement</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/30 font-bold uppercase tracking-wider">
              {openTabs.length} OPEN TABS
            </span>
          </div>

          <div className="overflow-x-auto border border-[#E5DFD5] dark:border-[#222D3E] rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAF8F5] dark:bg-[#121A28] text-[#8C6D23] dark:text-[#DFCA9B] font-bold text-[10px] uppercase tracking-wider border-b border-[#E5DFD5] dark:border-[#222D3E]">
                <tr>
                  <th className="p-3">Tab #</th>
                  <th className="p-3">Table / Guest</th>
                  <th className="p-3">Member / Tier</th>
                  <th className="p-3">Opened At</th>
                  <th className="p-3">Total (₹)</th>
                  <th className="p-3">Privilege (₹)</th>
                  <th className="p-3">Final Due (₹)</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD5] dark:divide-[#222D3E] font-medium">
                {openTabs.map((tab) => (
                  <tr key={tab.id} className="hover:bg-[#FAF8F5]/50 dark:hover:bg-[#121A28]/50">
                    <td className="p-3 font-mono font-bold text-[#921111] dark:text-[#DFCA9B]">{tab.tabNumber}</td>
                    <td className="p-3 font-serif font-bold text-[#0B1320] dark:text-white">{tab.table ? `Table ${tab.table.tableNumber}` : tab.guestName}</td>
                    <td className="p-3">
                      {tab.member ? (
                        <span className="font-serif font-bold text-[#0B1320] dark:text-white">
                          {tab.member.name} ({tab.member.memberships?.[0]?.tier || 'MEMBER'})
                        </span>
                      ) : (
                        <span className="text-[#6B7280]">Walk-in</span>
                      )}
                    </td>
                    <td className="p-3 text-[#6B7280] dark:text-[#9CA3AF]">{formatDateTime(tab.openedAt)}</td>
                    <td className="p-3 text-[#6B7280] dark:text-[#9CA3AF] font-mono">{formatINR(tab.totalAmountPaise)}</td>
                    <td className="p-3 text-[#8C6D23] dark:text-[#DFCA9B] font-mono">-{formatINR(tab.discountAmountPaise)}</td>
                    <td className="p-3 font-bold font-mono text-[#921111] dark:text-[#DFCA9B] text-sm">
                      {formatINR(tab.finalAmountPaise)}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleOpenSettleModal(tab)}
                        className="px-3.5 py-1.5 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-colors"
                      >
                        Settle Tab →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. END OF DAY CLOSING REPORT */}
      {activeView === "EOD" && eodReport && (
        <div className="p-6 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E5DFD5] dark:border-[#222D3E]">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#0B1320] dark:text-white">End-of-Day Clubhouse Dining & Lounge Closing Summary</h3>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Date: {formatDateTime(eodReport.date)}</p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-md border border-[#C5A059] text-[#0B1320] dark:text-[#DFCA9B] hover:bg-[#C5A059]/10 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4 text-[#8C6D23]" />
              Print Closing Report
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] text-xs">
              <span className="text-[#8C6D23] dark:text-[#DFCA9B] uppercase font-bold tracking-wider block">Total Revenue</span>
              <span className="text-xl font-serif font-bold text-[#0B1320] dark:text-white mt-1 block">
                {formatINR(eodReport.totalRevenuePaise)}
              </span>
            </div>
            <div className="p-4 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] text-xs">
              <span className="text-[#8C6D23] dark:text-[#DFCA9B] uppercase font-bold tracking-wider block">Orders Count</span>
              <span className="text-xl font-serif font-bold text-[#0B1320] dark:text-white mt-1 block">
                {eodReport.ordersCount}
              </span>
            </div>
            <div className="p-4 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] text-xs">
              <span className="text-[#8C6D23] dark:text-[#DFCA9B] uppercase font-bold tracking-wider block">Average Ticket</span>
              <span className="text-xl font-serif font-bold text-[#0B1320] dark:text-white mt-1 block">
                {formatINR(eodReport.averageTicketPaise)}
              </span>
            </div>
            <div className="p-4 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] text-xs">
              <span className="text-[#8C6D23] dark:text-[#DFCA9B] uppercase font-bold tracking-wider block">Unsettled Tabs</span>
              <span className="text-xl font-serif font-bold text-[#921111] dark:text-[#DFCA9B] mt-1 block">
                {eodReport.openTabsCount} ({formatINR(eodReport.openTabsAmountPaise)})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SETTLE BILL MODAL */}
      {showSettleModal && tabToSettle && (
        <div className="fixed inset-0 bg-[#0B1320]/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E1522] border border-[#C5A059]/40 rounded-xl max-w-md w-full p-6 shadow-2xl relative text-xs space-y-4">
            <h3 className="font-serif text-base font-bold text-[#0B1320] dark:text-white">
              Settle Tab #{tabToSettle.tabNumber}
            </h3>

            <div className="p-4 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] space-y-1.5">
              <div className="flex justify-between text-[#6B7280] dark:text-[#9CA3AF]">
                <span>Items Subtotal:</span>
                <span className="font-mono">{formatINR(tabToSettle.totalAmountPaise)}</span>
              </div>
              <div className="flex justify-between text-[#8C6D23] dark:text-[#DFCA9B] font-semibold">
                <span>Member Tier Privilege:</span>
                <span className="font-mono">-{formatINR(tabToSettle.discountAmountPaise)}</span>
              </div>
              <div className="flex justify-between font-serif font-bold text-sm pt-2 border-t border-[#E5DFD5] dark:border-[#222D3E]">
                <span className="text-[#0B1320] dark:text-white">Net Due:</span>
                <span className="text-[#921111] dark:text-[#DFCA9B] font-mono">{formatINR(tabToSettle.finalAmountPaise)}</span>
              </div>
            </div>

            {/* Split Payment Inputs */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-[#8C6D23] dark:text-[#DFCA9B] tracking-wider block">Split Payment Settlement (₹)</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] block font-bold">Cash (₹)</span>
                  <input
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(Number(e.target.value))}
                    className="w-full p-2 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#121A28] font-bold text-[#0B1320] dark:text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] block font-bold">UPI QR (₹)</span>
                  <input
                    type="number"
                    value={upiAmount}
                    onChange={(e) => setUpiAmount(Number(e.target.value))}
                    className="w-full p-2 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#121A28] font-bold text-[#0B1320] dark:text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] block font-bold">Card (₹)</span>
                  <input
                    type="number"
                    value={cardAmount}
                    onChange={(e) => setCardAmount(Number(e.target.value))}
                    className="w-full p-2 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#121A28] font-bold text-[#0B1320] dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* UPI Dynamic QR Preview */}
            {upiAmount > 0 && (
              <div className="p-3 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] text-center space-y-1">
                <span className="text-[10px] text-[#8C6D23] dark:text-[#DFCA9B] font-bold uppercase tracking-wider block">
                  Scan to Pay ₹{upiAmount} via Club Gateway
                </span>
                <div className="w-24 h-24 bg-white mx-auto rounded-md flex items-center justify-center p-2 border border-[#C5A059]/40">
                  <QrCode className="w-20 h-20 text-[#0B1320]" />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSettleModal(false)}
                className="flex-1 py-2.5 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] text-[#4B5563] dark:text-[#9CA3AF] font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteSettlement}
                className="flex-1 py-2.5 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
              >
                Confirm Settlement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

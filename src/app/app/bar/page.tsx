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

export default function BarManagementPage({
  initialView = "TABLES",
}: {
  initialView?: "TABLES" | "POS" | "KDS" | "TABS" | "SHIFTS" | "EOD";
}) {
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Bar, Lounge & Cafeteria
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 font-bold">
              KDS & RUNNING TABS
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Interactive table floor map, tablet ordering POS, live kitchen display, member running tabs, and EOD closing report.
          </p>
        </div>

        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveView("TABLES")}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeView === "TABLES" ? "bg-white dark:bg-slate-700 text-orange-600 shadow-sm font-bold" : "text-slate-600"
            }`}
          >
            Floor Map ({tables.length})
          </button>
          <button
            onClick={() => setActiveView("POS")}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeView === "POS" ? "bg-white dark:bg-slate-700 text-orange-600 shadow-sm font-bold" : "text-slate-600"
            }`}
          >
            Tablet POS
          </button>
          <button
            onClick={() => setActiveView("KDS")}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeView === "KDS" ? "bg-white dark:bg-slate-700 text-orange-600 shadow-sm font-bold" : "text-slate-600"
            }`}
          >
            Live KDS ({kdsOrders.length})
          </button>
          <button
            onClick={() => setActiveView("TABS")}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeView === "TABS" ? "bg-white dark:bg-slate-700 text-orange-600 shadow-sm font-bold" : "text-slate-600"
            }`}
          >
            Open Tabs ({openTabs.length})
          </button>
          <button
            onClick={() => {
              setActiveView("EOD");
              fetchEodReport();
            }}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeView === "EOD" ? "bg-white dark:bg-slate-700 text-orange-600 shadow-sm font-bold" : "text-slate-600"
            }`}
          >
            EOD Report
          </button>
        </div>
      </div>

      {/* 1. TABLE FLOOR MAP VIEW */}
      {activeView === "TABLES" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900 border text-xs">
            <div className="flex items-center gap-4">
              <span className="font-bold text-slate-500 uppercase text-[10px]">Table Status:</span>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>Free (Tap to seat)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span>Occupied / Active Tab</span>
              </div>
            </div>
            <span className="text-slate-400">Total Capacity: 48 Seats</span>
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
                  className={`p-5 rounded-2xl border cursor-pointer transition-all shadow-xs hover:shadow-md flex flex-col justify-between h-40 ${
                    isOccupied
                      ? "bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-base text-slate-900 dark:text-white">
                      Table {tbl.tableNumber}
                    </span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isOccupied ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                    />
                  </div>

                  <div className="text-xs text-slate-500">
                    <div>{tbl.name}</div>
                    <span className="text-[10px] text-slate-400">Capacity: {tbl.capacity} Persons</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    {isOccupied ? (
                      <>
                        <span className="font-bold text-amber-700 dark:text-amber-400">
                          {formatINR(activeTab?.finalAmountPaise || 0)}
                        </span>
                        <span className="text-[10px] text-amber-600">Active Tab →</span>
                      </>
                    ) : (
                      <span className="text-emerald-600 font-bold text-[11px]">+ Tap to Order</span>
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
            <div className="flex overflow-x-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
              {["ALL", "HOT_BEVERAGES", "COLD_BEVERAGES", "HEALTH_SHAKES", "SNACKS", "MEALS", "DESSERTS"].map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-[11px] whitespace-nowrap ${
                    selectedCategory === c ? "bg-white dark:bg-slate-700 text-orange-600 shadow-xs" : "text-slate-500"
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
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-orange-500 text-left transition-all shadow-xs flex flex-col justify-between h-28 active:scale-98"
                >
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2">{item.name}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{item.category}</span>
                  </div>
                  <span className="font-extrabold text-xs text-orange-600">{formatINR(item.pricePaise)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* POS TAB CART & KITCHEN DISPATCH */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedTable ? `Table ${selectedTable.tableNumber}` : "Bar Counter"}
                </h3>
                <span className="text-[11px] text-slate-400">Add to Running Tab & Route to KDS</span>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                {posCart.length} ITEMS
              </span>
            </div>

            {/* Member selector for tier discount */}
            <div>
              <label className="font-semibold block mb-1 text-xs">Linked Member (For Discount)</label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
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
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 py-1 space-y-1.5 text-xs">
              {posCart.length === 0 ? (
                <p className="text-slate-400 py-6 text-center">Tap any food/beverage on the left to add.</p>
              ) : (
                posCart.map((c) => (
                  <div key={c.menuItemId} className="pt-1.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{c.name}</div>
                      <span className="text-[10px] text-slate-400">{formatINR(c.unitPricePaise)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartQty(c.menuItemId, c.quantity - 1)}
                        className="p-1 rounded bg-slate-100 dark:bg-slate-800"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono font-bold w-4 text-center">{c.quantity}</span>
                      <button
                        onClick={() => updateCartQty(c.menuItemId, c.quantity + 1)}
                        className="p-1 rounded bg-slate-100 dark:bg-slate-800"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div>
              <label className="font-semibold block mb-1 text-xs">Kitchen Notes / Priority</label>
              <input
                type="text"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="e.g. Less spicy, rush table"
                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>

            <button
              onClick={handleSendToKitchen}
              disabled={posCart.length === 0}
              className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md shadow-orange-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              Send to Kitchen Display (KDS) & Add to Tab
            </button>
          </div>
        </div>
      )}

      {/* 3. LIVE KITCHEN DISPLAY SYSTEM (KDS) */}
      {activeView === "KDS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Live Kitchen Order Tickets</h3>
            <span className="text-xs font-mono text-emerald-600 font-bold animate-pulse">
              ● Live Auto-Syncing
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {kdsOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-xs space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-mono font-bold text-orange-600">#{ord.orderNumber}</span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                        ord.status === "NEW"
                          ? "bg-red-100 text-red-800 animate-pulse"
                          : ord.status === "PREPARING"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>

                  <div className="mt-2 font-bold text-sm text-slate-900 dark:text-white">
                    {ord.table ? `Table ${ord.table.tableNumber}` : "Bar Counter"}
                  </div>
                  {ord.notes && (
                    <div className="text-[11px] text-amber-600 bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded mt-1">
                      Note: {ord.notes}
                    </div>
                  )}

                  <div className="mt-3 space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800">
                    {ord.items?.map((it: any) => (
                      <div key={it.id} className="pt-1 flex items-center justify-between">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {it.quantity}x {it.menuItem?.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status action buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                  {ord.status === "NEW" && (
                    <button
                      onClick={() => handleUpdateKdsStatus(ord.id, "PREPARING")}
                      className="w-full py-2 rounded-lg bg-amber-500 text-slate-950 font-bold"
                    >
                      Start Preparing
                    </button>
                  )}
                  {ord.status === "PREPARING" && (
                    <button
                      onClick={() => handleUpdateKdsStatus(ord.id, "READY")}
                      className="w-full py-2 rounded-lg bg-emerald-600 text-white font-bold"
                    >
                      Mark Ready for Server
                    </button>
                  )}
                  {ord.status === "READY" && (
                    <button
                      onClick={() => handleUpdateKdsStatus(ord.id, "SERVED")}
                      className="w-full py-2 rounded-lg bg-slate-700 text-white font-bold"
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
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Member Running Tabs</h3>
            <span className="text-xs text-slate-400">Total Open Tabs: {openTabs.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b">
                <tr>
                  <th className="p-3">Tab #</th>
                  <th className="p-3">Table / Guest</th>
                  <th className="p-3">Member / Tier</th>
                  <th className="p-3">Opened At</th>
                  <th className="p-3">Total (₹)</th>
                  <th className="p-3">Discount (₹)</th>
                  <th className="p-3">Final Due (₹)</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {openTabs.map((tab) => (
                  <tr key={tab.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-orange-600">{tab.tabNumber}</td>
                    <td className="p-3 font-bold">{tab.table ? `Table ${tab.table.tableNumber}` : tab.guestName}</td>
                    <td className="p-3">
                      {tab.member ? (
                        <span className="font-bold text-emerald-600">
                          {tab.member.name} ({tab.member.memberships?.[0]?.tier || 'MEMBER'})
                        </span>
                      ) : (
                        <span className="text-slate-400">Walk-in</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-500">{formatDateTime(tab.openedAt)}</td>
                    <td className="p-3 text-slate-500">{formatINR(tab.totalAmountPaise)}</td>
                    <td className="p-3 text-emerald-600">-{formatINR(tab.discountAmountPaise)}</td>
                    <td className="p-3 font-black text-slate-900 dark:text-white text-sm">
                      {formatINR(tab.finalAmountPaise)}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleOpenSettleModal(tab)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs"
                      >
                        Settle Bill →
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
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">End-of-Day Bar & Lounge Closing Summary</h3>
              <p className="text-xs text-slate-500">Date: {formatDateTime(eodReport.date)}</p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800"
            >
              <Printer className="w-4 h-4" />
              Print Closing Report
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
              <span className="text-slate-400 block uppercase">Total Revenue</span>
              <span className="text-xl font-black text-orange-600 mt-1 block">
                {formatINR(eodReport.totalRevenuePaise)}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
              <span className="text-slate-400 block uppercase">Orders Count</span>
              <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
                {eodReport.ordersCount}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
              <span className="text-slate-400 block uppercase">Average Ticket</span>
              <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
                {formatINR(eodReport.averageTicketPaise)}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
              <span className="text-slate-400 block uppercase">Unsettled Tabs</span>
              <span className="text-xl font-black text-amber-600 mt-1 block">
                {eodReport.openTabsCount} ({formatINR(eodReport.openTabsAmountPaise)})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SETTLE BILL MODAL */}
      {showSettleModal && tabToSettle && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Settle Tab #{tabToSettle.tabNumber}
            </h3>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatINR(tabToSettle.totalAmountPaise)}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Member Tier Discount:</span>
                <span>-{formatINR(tabToSettle.discountAmountPaise)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm pt-2 border-t">
                <span>Net Total Due:</span>
                <span className="text-orange-600">{formatINR(tabToSettle.finalAmountPaise)}</span>
              </div>
            </div>

            {/* Split Payment Inputs */}
            <div className="space-y-2">
              <label className="font-bold block">Split Payment Distribution (₹)</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block">Cash (₹)</span>
                  <input
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">UPI QR (₹)</span>
                  <input
                    type="number"
                    value={upiAmount}
                    onChange={(e) => setUpiAmount(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Card (₹)</span>
                  <input
                    type="number"
                    value={cardAmount}
                    onChange={(e) => setCardAmount(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* UPI Dynamic QR Preview */}
            {upiAmount > 0 && (
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-center space-y-1">
                <span className="text-[10px] text-slate-500 font-semibold block">
                  Scan to Pay ₹{upiAmount} via PhonePe / GPay / Paytm
                </span>
                <div className="w-24 h-24 bg-white mx-auto rounded-lg flex items-center justify-center p-2 border">
                  <QrCode className="w-20 h-20 text-slate-900" />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSettleModal(false)}
                className="flex-1 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteSettlement}
                className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white font-bold"
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

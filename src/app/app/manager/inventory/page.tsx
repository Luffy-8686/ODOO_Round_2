"use client";

import React, { useState, useEffect } from "react";
import { formatINR, formatDateTime } from "@/lib/formatters";
import { ShoppingBag, AlertTriangle, Search, PackageCheck, RefreshCw } from "lucide-react";

export default function ManagerInventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shop/products");
      const data = await res.json();
      if (data.products) setProducts(data.products);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filtered = products.filter((p) => {
    const matchesQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const isLow = p.variants.some((v: any) => v.stockQuantity <= p.reorderLevel);
    return matchesQuery && (!showLowStockOnly || isLow);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Pro Shop Inventory & Restock Alerts
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
              📦 OPERATIONS INVENTORY
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor stock health, reorder levels, variants, and price points.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              showLowStockOnly
                ? "bg-red-600 text-white shadow-xs"
                : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
            }`}
          >
            ⚠️ Low Stock Alert Filter
          </button>
          <button
            onClick={fetchProducts}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-500"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products by title, brand, category, or SKU..."
          className="w-full text-xs bg-transparent border-none outline-none text-slate-900 dark:text-white"
        />
      </div>

      {/* INVENTORY TABLE */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold border-b">
              <tr>
                <th className="p-3">Product Name & Brand</th>
                <th className="p-3">Category</th>
                <th className="p-3">Variants & Stock</th>
                <th className="p-3">Reorder Threshold</th>
                <th className="p-3">Retail Price (₹)</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((prod) => {
                const totalStock = prod.variants.reduce((sum: number, v: any) => sum + v.stockQuantity, 0);
                const isLowStock = totalStock <= prod.reorderLevel;

                return (
                  <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-white">{prod.name}</div>
                      <div className="text-[10px] text-slate-400">{prod.brand} • SKU: {prod.sku}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-mono uppercase text-[10px] bg-slate-100 dark:bg-slate-800">
                        {prod.category}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="space-y-1">
                        {prod.variants.map((v: any) => (
                          <div key={v.id} className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold">{v.name}:</span>
                            <span
                              className={`font-mono font-bold px-1.5 py-0.2 rounded text-[10px] ${
                                v.stockQuantity <= prod.reorderLevel
                                  ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              }`}
                            >
                              {v.stockQuantity} in stock
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-500">{prod.reorderLevel} units</td>
                    <td className="p-3 font-black text-slate-900 dark:text-white">
                      {formatINR(prod.retailPricePaise)}
                    </td>
                    <td className="p-3 text-right">
                      {isLowStock ? (
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] uppercase bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                          Reorder Required
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Optimal Stock
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

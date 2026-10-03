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
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#E5DFD5] dark:border-[#222D3E]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#8C6D23] dark:text-[#DFCA9B]">
              Logistics & Shelf Stock
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/30 font-bold uppercase tracking-wider">
              Real-time Ledger
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#0B1320] dark:text-white tracking-tight mt-1">
            Pro Shop Inventory & Restock Alerts
          </h1>
          <p className="text-xs text-[#5A6578] dark:text-[#8E9CAE] mt-1">
            Monitor equipment inventory, variant balance, reorder thresholds, and retail tariff pricing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`px-3.5 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all border ${
              showLowStockOnly
                ? "bg-[#921111] text-white border-[#921111] shadow-sm"
                : "border-[#E5DFD5] dark:border-[#222D3E] bg-white dark:bg-[#131C2E] text-[#0B1320] dark:text-white hover:border-[#C5A059]"
            }`}
          >
            ⚠️ Low Stock Filter
          </button>
          <button
            onClick={fetchProducts}
            className="p-2 rounded border border-[#E5DFD5] dark:border-[#222D3E] bg-white dark:bg-[#131C2E] hover:border-[#C5A059] text-[#8C6D23] dark:text-[#DFCA9B]"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#0E1726] border border-[#E5DFD5] dark:border-[#222D3E] shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-[#8E9CAE]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products by title, brand, category, or SKU..."
          className="w-full text-xs bg-transparent border-none outline-none text-[#0B1320] dark:text-white placeholder-[#8E9CAE]"
        />
      </div>

      {/* INVENTORY TABLE */}
      <div className="p-6 rounded-xl bg-white dark:bg-[#0E1726] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#FAF8F5] dark:bg-[#131C2E] text-[#5A6578] dark:text-[#8E9CAE] font-bold border-b border-[#E5DFD5] dark:border-[#222D3E]">
              <tr>
                <th className="p-3">Product Name & Brand</th>
                <th className="p-3">Category</th>
                <th className="p-3">Variants & Shelf Stock</th>
                <th className="p-3">Reorder Point</th>
                <th className="p-3">Retail Tariff (₹)</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DFD5]/60 dark:divide-[#222D3E]">
              {filtered.map((prod) => {
                const totalStock = prod.variants.reduce((sum: number, v: any) => sum + v.stockQuantity, 0);
                const isLowStock = totalStock <= prod.reorderLevel;

                return (
                  <tr key={prod.id} className="hover:bg-[#FAF8F5]/80 dark:hover:bg-[#131C2E]/50">
                    <td className="p-3">
                      <div className="font-serif font-bold text-sm text-[#0B1320] dark:text-white">{prod.name}</div>
                      <div className="text-[10px] text-[#8E9CAE] font-mono mt-0.5">{prod.brand} • SKU: {prod.sku}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-mono uppercase text-[9px] bg-[#FAF8F5] dark:bg-[#131C2E] border border-[#E5DFD5] dark:border-[#222D3E] text-[#8C6D23] dark:text-[#DFCA9B]">
                        {prod.category}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="space-y-1">
                        {prod.variants.map((v: any) => (
                          <div key={v.id} className="flex items-center gap-2">
                            <span className="text-[11px] font-medium text-[#0B1320] dark:text-white">{v.name}:</span>
                            <span
                              className={`font-mono font-bold px-1.5 py-0.2 rounded text-[10px] ${
                                v.stockQuantity <= prod.reorderLevel
                                  ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              }`}
                            >
                              {v.stockQuantity} in stock
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-[#5A6578] dark:text-[#8E9CAE]">{prod.reorderLevel} units</td>
                    <td className="p-3 font-mono font-bold text-[#0B1320] dark:text-white text-sm">
                      {formatINR(prod.retailPricePaise)}
                    </td>
                    <td className="p-3 text-right">
                      {isLowStock ? (
                        <span className="px-2 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-800">
                          Reorder Required
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
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

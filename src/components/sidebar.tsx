"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Calendar,
  Users,
  ShoppingBag,
  Coffee,
  Target,
  FileText,
  UserCheck,
  Settings,
  Lock,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser } = useAuth();

  const links = [
    {
      href: "/app/dashboard",
      label: "Owner Command Center",
      icon: LayoutDashboard,
      badge: "KPIs",
      roles: ["OWNER", "MANAGER"],
    },
    {
      href: "/app/courts",
      label: "Court Booking Engine",
      icon: Calendar,
      badge: "Grid",
      roles: ["OWNER", "MANAGER", "FRONT_DESK", "COACH"],
    },
    {
      href: "/app/members",
      label: "Members & 360",
      icon: Users,
      badge: "Pass / QR",
      roles: ["OWNER", "MANAGER", "FRONT_DESK"],
    },
    {
      href: "/app/shop",
      label: "Gear Shop & POS",
      icon: ShoppingBag,
      badge: "Stock",
      roles: ["OWNER", "MANAGER", "SHOP_STAFF", "FRONT_DESK"],
    },
    {
      href: "/app/bar",
      label: "Bar & Cafeteria (KDS)",
      icon: Coffee,
      badge: "Tabs",
      roles: ["OWNER", "MANAGER", "BAR_STAFF"],
    },
    {
      href: "/app/crm",
      label: "Enquiry CRM & Leads",
      icon: Target,
      badge: "SLA",
      roles: ["OWNER", "MANAGER", "FRONT_DESK"],
    },
    {
      href: "/app/finance",
      label: "Finance & GST Ledger",
      icon: FileText,
      badge: "P&L",
      roles: ["OWNER", "MANAGER"],
    },
    {
      href: "/app/hr",
      label: "HR & Staff Payroll",
      icon: UserCheck,
      badge: "Shifts",
      roles: ["OWNER", "MANAGER"],
    },
    {
      href: "/app/settings",
      label: "Club Admin & Audit",
      icon: Settings,
      roles: ["OWNER", "MANAGER"],
    },
  ];

  return (
    <aside className="w-64 border-r border-[#E5DFD5] dark:border-[#1F293D] bg-[#FAF8F5] dark:bg-[#0B1320] min-h-[calc(100vh-4.5rem)] p-4 flex flex-col justify-between shrink-0 transition-colors">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[9px] font-bold text-[#8C6D23] dark:text-[#DFCA9B] uppercase tracking-[0.22em] flex items-center justify-between">
          <span>Operations Modules</span>
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#FAF7EE] dark:bg-[#1C1608] border border-[#DFCA9B] dark:border-[#4B3C18] text-[#8C6D23]">
            {currentUser?.role || "PORTAL"}
          </span>
        </div>

        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          const userRole = currentUser?.role || "";
          const hasAccess =
            link.roles.includes(userRole) || userRole === "OWNER" || userRole === "MANAGER";

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold tracking-wide transition-all ${
                isActive
                  ? "bg-[#921111] text-white shadow-sm"
                  : hasAccess
                  ? "text-[#374151] dark:text-[#D1D5DB] hover:bg-[#E5DFD5]/40 dark:hover:bg-[#162032] hover:text-[#921111] dark:hover:text-[#FAF8F5]"
                  : "text-[#9CA3AF] dark:text-[#4B5563] opacity-40 hover:opacity-60 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? "text-[#C5A059]" : hasAccess ? "text-[#8C6D23] dark:text-[#DFCA9B]" : "text-[#9CA3AF]"}`} />
                <span className={!hasAccess ? "line-through text-[#9CA3AF]" : ""}>{link.label}</span>
              </div>
              {!hasAccess ? (
                <Lock className="w-3 h-3 text-[#9CA3AF]" />
              ) : link.badge ? (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-bold tracking-wider ${
                    isActive
                      ? "bg-[#720C0C] text-[#DFCA9B] border border-[#A81E24]"
                      : "bg-[#E5DFD5]/50 dark:bg-[#1E293B] text-[#6B7280] dark:text-[#9CA3AF] border border-[#D8CFBF] dark:border-[#334155]"
                  }`}
                >
                  {link.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      {/* Role badge card */}
      <div className="mt-8 p-3 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] text-xs shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#C5A059] animate-pulse" />
          <span className="font-serif font-bold text-[#0B1320] dark:text-white uppercase tracking-wider text-[11px]">Quarters Connected</span>
        </div>
        <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] mt-1">
          Authenticated: <strong className="text-[#0B1320] dark:text-[#FAF8F5]">{currentUser?.name || "User"}</strong> (
          {currentUser?.role || "GUEST"})
        </p>
      </div>
    </aside>
  );
}

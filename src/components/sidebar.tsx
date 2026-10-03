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
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
          <span>Operations Modules</span>
          <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
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
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : hasAccess
                  ? "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  : "text-slate-400 dark:text-slate-600 opacity-50 hover:opacity-80 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : hasAccess ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`} />
                <span className={!hasAccess ? "line-through text-slate-400 dark:text-slate-600" : ""}>{link.label}</span>
              </div>
              {!hasAccess ? (
                <Lock className="w-3 h-3 text-slate-400" />
              ) : link.badge ? (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${
                    isActive
                      ? "bg-emerald-700/50 text-emerald-100"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
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
      <div className="mt-8 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">System Online</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          Logged in as <strong className="text-slate-700 dark:text-slate-300">{currentUser?.name || "User"}</strong> (
          {currentUser?.role || "GUEST"})
        </p>
      </div>
    </aside>
  );
}

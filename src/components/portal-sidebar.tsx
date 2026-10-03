"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Role, ROLE_METADATA } from "@/lib/roles";
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
  ShieldCheck,
  CreditCard,
  UploadCloud,
  Monitor,
  Scissors,
  DollarSign,
  Activity,
  Award,
  LogOut,
  ChevronRight,
  Plus,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: any;
  badge?: string;
}

const ROLE_NAV_ITEMS: Record<Role, NavItem[]> = {
  OWNER: [
    { href: "/app/owner", label: "Executive Command", icon: LayoutDashboard, badge: "KPIs" },
    { href: "/app/owner/finance", label: "Financial P&L & Ledger", icon: FileText, badge: "GST" },
    { href: "/app/owner/hr", label: "HR & Executive Payroll", icon: UserCheck, badge: "Salaries" },
    { href: "/app/owner/users", label: "User & Role Privileges", icon: ShieldCheck, badge: "RBAC" },
    { href: "/app/owner/plans", label: "Membership Plans", icon: Award },
    { href: "/app/owner/audit", label: "System Audit Logs", icon: Activity },
  ],
  MANAGER: [
    { href: "/app/manager", label: "Operations Overview", icon: LayoutDashboard, badge: "Live" },
    { href: "/app/manager/courts", label: "Master Court Schedule", icon: Calendar, badge: "Grid" },
    { href: "/app/manager/members", label: "Member Directory & 360", icon: Users },
    { href: "/app/manager/crm", label: "Leads & Sales CRM", icon: Target, badge: "SLA" },
    { href: "/app/manager/leaves", label: "Staff Leave Approvals", icon: UserCheck },
    { href: "/app/manager/inventory", label: "Inventory Restock", icon: ShoppingBag, badge: "Alerts" },
  ],
  FRONT_DESK: [
    { href: "/app/desk", label: "Front Desk Overview", icon: LayoutDashboard },
    { href: "/app/desk/courts", label: "Court Booking Grid", icon: Calendar, badge: "Book" },
    { href: "/app/desk/members", label: "Member Onboarding", icon: Users, badge: "Pass" },
    { href: "/app/desk/tabs", label: "Member Tabs & Bills", icon: CreditCard },
    { href: "/app/desk/import", label: "CSV Member Import", icon: UploadCloud },
  ],
  BAR_STAFF: [
    { href: "/app/bar", label: "Bar & Cafe Overview", icon: LayoutDashboard },
    { href: "/app/bar/kds", label: "Kitchen Display (KDS)", icon: Monitor, badge: "Live" },
    { href: "/app/bar/pos", label: "Table Floor Map & POS", icon: Coffee, badge: "Touch" },
    { href: "/app/bar/tabs", label: "Member Tabs & Pay", icon: CreditCard },
    { href: "/app/bar/shifts", label: "Shift Cash Drawer", icon: DollarSign },
  ],
  SHOP_STAFF: [
    { href: "/app/shop-admin", label: "Pro Shop Overview", icon: LayoutDashboard },
    { href: "/app/shop-admin/pos", label: "Counter POS Register", icon: ShoppingBag, badge: "Fast" },
    { href: "/app/shop-admin/inventory", label: "Stock Inventory", icon: ShoppingBag, badge: "SKUs" },
    { href: "/app/shop-admin/stringing", label: "Stringing & Repairs", icon: Scissors, badge: "Queue" },
  ],
  COACH: [
    { href: "/app/coach", label: "Coach Dashboard", icon: LayoutDashboard },
    { href: "/app/coach/sessions", label: "My Coaching Sessions", icon: Calendar, badge: "Slots" },
    { href: "/app/coach/students", label: "Student Roster", icon: Users },
    { href: "/app/coach/courts", label: "Court Schedule", icon: Calendar },
  ],
  MEMBER: [
    { href: "/portal", label: "Member Dashboard", icon: LayoutDashboard },
    { href: "/portal/bookings", label: "My Slot Bookings", icon: Calendar, badge: "Slots" },
    { href: "/portal/book", label: "Book a Court", icon: Plus, badge: "Book" },
    { href: "/portal/cafe", label: "Bar & Cafe Ordering", icon: Coffee, badge: "Order" },
    { href: "/portal/card", label: "Digital Membership Pass", icon: Award, badge: "QR" },
    { href: "/portal/tab", label: "My Tab & Invoices", icon: CreditCard },
  ],
};

export function PortalSidebar({ portalRole }: { portalRole: Role }) {
  const pathname = usePathname();
  const { currentUser, role, logout } = useAuth();
  const meta = ROLE_METADATA[portalRole];
  const navItems = ROLE_NAV_ITEMS[portalRole] || [];

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0 shadow-sm">
      <div className="space-y-4">
        {/* Portal Header Badge */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Portal
            </span>
            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold border ${meta?.badgeClass}`}>
              {portalRole}
            </span>
          </div>
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1">
            {meta?.label || portalRole}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
            {meta?.description}
          </p>
        </div>

        {/* Nav Links */}
        <nav className="space-y-1">
          <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Navigation Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-white" : "text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-bold ${
                      isActive
                        ? "bg-emerald-700/60 text-emerald-100"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer Profile & Sign Out */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs px-1">
          <div className="truncate pr-2">
            <p className="font-bold text-slate-900 dark:text-white truncate">
              {currentUser?.name || "Authenticated User"}
            </p>
            <p className="text-[10px] text-slate-400 truncate">{currentUser?.email}</p>
          </div>
          <button
            onClick={() => logout()}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

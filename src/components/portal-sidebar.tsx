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
    <aside className="w-64 border-r border-[#E5DFD5] dark:border-[#1F293D] bg-[#FAF8F5] dark:bg-[#0B1320] min-h-[calc(100vh-4.5rem)] p-4 flex flex-col justify-between shrink-0 transition-colors">
      <div className="space-y-4">
        {/* Portal Header Badge - NYAC Athletic Quarters Style */}
        <div className="p-3.5 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8C6D23] dark:text-[#DFCA9B]">
              Assigned Quarters
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded font-bold border border-[#DFCA9B] bg-[#FAF7EE] text-[#8C6D23] dark:bg-[#1C1608] dark:text-[#E3CEA4] dark:border-[#4B3C18]">
              {portalRole}
            </span>
          </div>
          <h3 className="font-serif font-bold text-sm text-[#0B1320] dark:text-white mt-1.5">
            {meta?.label || portalRole}
          </h3>
          <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] line-clamp-1 mt-0.5">
            {meta?.description}
          </p>
        </div>

        {/* Nav Links */}
        <nav className="space-y-1">
          <div className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-[0.22em] text-[#6B7280] dark:text-[#9CA3AF]">
            Quarters Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold tracking-wide transition-all group ${
                  isActive
                    ? "bg-[#921111] text-white shadow-sm"
                    : "text-[#374151] dark:text-[#D1D5DB] hover:bg-[#E5DFD5]/40 dark:hover:bg-[#162032] hover:text-[#921111] dark:hover:text-[#FAF8F5]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-[#C5A059]" : "text-[#6B7280] group-hover:text-[#921111] dark:group-hover:text-[#C5A059]"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-bold tracking-wider ${
                      isActive
                        ? "bg-[#720C0C] text-[#DFCA9B] border border-[#A81E24]"
                        : "bg-[#E5DFD5]/50 dark:bg-[#1E293B] text-[#6B7280] dark:text-[#9CA3AF] border border-[#D8CFBF] dark:border-[#334155]"
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
      <div className="pt-4 border-t border-[#E5DFD5] dark:border-[#1F293D] space-y-3">
        <div className="flex items-center justify-between text-xs px-1">
          <div className="truncate pr-2">
            <p className="font-serif font-bold text-[#0B1320] dark:text-white truncate">
              {currentUser?.name || "Authenticated User"}
            </p>
            <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] truncate">{currentUser?.email}</p>
          </div>
          <button
            onClick={() => logout()}
            title="Sign Out"
            className="p-1.5 text-[#6B7280] hover:text-[#921111] dark:hover:text-[#F87171] rounded-md hover:bg-[#FDF4F4] dark:hover:bg-[#1E0E10] transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

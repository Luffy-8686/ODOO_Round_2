import { z } from "zod";

export const ROLES = [
  "OWNER",
  "MANAGER",
  "FRONT_DESK",
  "BAR_STAFF",
  "SHOP_STAFF",
  "COACH",
  "MEMBER",
] as const;

export type Role = (typeof ROLES)[number];

export const RoleSchema = z.enum(ROLES);

export const ROLE_HOME_MAP: Record<Role, string> = {
  OWNER: "/app/owner",
  MANAGER: "/app/manager",
  FRONT_DESK: "/app/desk",
  BAR_STAFF: "/app/bar",
  SHOP_STAFF: "/app/shop-admin",
  COACH: "/app/coach",
  MEMBER: "/portal",
};

export interface RoleMeta {
  role: Role;
  label: string;
  description: string;
  portalPath: string;
  accentColor: string;
  badgeClass: string;
  sidebarTheme: string;
}

export const ROLE_METADATA: Record<Role, RoleMeta> = {
  OWNER: {
    role: "OWNER",
    label: "Owner / Executive",
    description: "Complete executive governance, financial P&L, HR payroll, and platform audits",
    portalPath: "/app/owner",
    accentColor: "purple",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
    sidebarTheme: "from-purple-900 to-slate-900",
  },
  MANAGER: {
    role: "MANAGER",
    label: "Club Manager",
    description: "Daily operations, court schedules, staff leaves, leads CRM, and maintenance",
    portalPath: "/app/manager",
    accentColor: "blue",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
    sidebarTheme: "from-blue-900 to-slate-900",
  },
  FRONT_DESK: {
    role: "FRONT_DESK",
    label: "Front Desk",
    description: "Member onboarding, court bookings, walk-in check-in, and guest passes",
    portalPath: "/app/desk",
    accentColor: "emerald",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
    sidebarTheme: "from-emerald-900 to-slate-900",
  },
  BAR_STAFF: {
    role: "BAR_STAFF",
    label: "Bar & Cafe",
    description: "Touch POS terminal, Kitchen Display System (KDS), member tabs, and bar stock",
    portalPath: "/app/bar",
    accentColor: "rose",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
    sidebarTheme: "from-rose-900 to-slate-900",
  },
  SHOP_STAFF: {
    role: "SHOP_STAFF",
    label: "Pro Shop",
    description: "Gear retail POS, stock inventory, racket stringing tracker, and equipment rentals",
    portalPath: "/app/shop-admin",
    accentColor: "amber",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
    sidebarTheme: "from-amber-900 to-slate-900",
  },
  COACH: {
    role: "COACH",
    label: "Coach",
    description: "Training sessions, student rosters, court allocations, and coaching schedules",
    portalPath: "/app/coach",
    accentColor: "cyan",
    badgeClass: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800",
    sidebarTheme: "from-cyan-900 to-slate-900",
  },
  MEMBER: {
    role: "MEMBER",
    label: "Member",
    description: "Personal court bookings, digital membership card, tab balance, and invoices",
    portalPath: "/portal",
    accentColor: "teal",
    badgeClass: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800",
    sidebarTheme: "from-teal-900 to-slate-900",
  },
};

export function isValidRole(role: string): role is Role {
  return (ROLES as readonly string[]).includes(role);
}

export function getRoleHome(role?: string | null): string {
  if (role && isValidRole(role)) {
    return ROLE_HOME_MAP[role];
  }
  return "/login";
}

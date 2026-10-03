import { Role, ROLES } from "./roles";

export const PERMISSIONS = [
  // Bookings
  "booking:read",
  "booking:read_own",
  "booking:create",
  "booking:create_own",
  "booking:cancel",
  "booking:override",

  // Members
  "member:read_all",
  "member:read_own",
  "member:create",
  "member:update",
  "member:delete",

  // POS & Operations
  "pos:bar",
  "pos:shop",
  "kds:read",
  "kds:update",
  "stringing:manage",

  // Member Tabs & Invoices
  "tab:read_all",
  "tab:read_own",
  "tab:charge",
  "tab:settle",
  "invoice:read_all",
  "invoice:read_own",

  // Inventory & Pricing
  "inventory:read",
  "inventory:update",
  "inventory:cost_price",

  // HR & Staff
  "hr:read",
  "hr:payroll",
  "hr:leaves_approve",
  "hr:staff_manage",

  // Coaching
  "coach:read_own",
  "coach:update_session",
  "coach:read_all",

  // Finance & Executive
  "finance:pnl",
  "finance:ledger",
  "finance:export",

  // Settings & System
  "settings:plans",
  "settings:courts",
  "settings:users",
  "settings:audit_logs",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  OWNER: PERMISSIONS, // Owner has all permissions

  MANAGER: [
    "booking:read",
    "booking:create",
    "booking:cancel",
    "booking:override",
    "member:read_all",
    "member:create",
    "member:update",
    "pos:bar",
    "pos:shop",
    "kds:read",
    "kds:update",
    "stringing:manage",
    "tab:read_all",
    "tab:charge",
    "tab:settle",
    "invoice:read_all",
    "inventory:read",
    "inventory:update",
    "hr:read",
    "hr:leaves_approve",
    "coach:read_all",
    "settings:courts",
  ],

  FRONT_DESK: [
    "booking:read",
    "booking:create",
    "booking:cancel",
    "member:read_all",
    "member:create",
    "member:update",
    "tab:read_all",
    "tab:charge",
    "tab:settle",
    "invoice:read_all",
    "pos:shop",
    "inventory:read",
  ],

  BAR_STAFF: [
    "pos:bar",
    "kds:read",
    "kds:update",
    "tab:read_all",
    "tab:charge",
    "tab:settle",
    "inventory:read",
  ],

  SHOP_STAFF: [
    "pos:shop",
    "stringing:manage",
    "tab:read_all",
    "tab:charge",
    "tab:settle",
    "inventory:read",
    "inventory:update",
  ],

  COACH: [
    "coach:read_own",
    "coach:update_session",
    "booking:read",
  ],

  MEMBER: [
    "booking:read_own",
    "booking:create_own",
    "member:read_own",
    "tab:read_own",
    "invoice:read_own",
  ],
};

export function can(role: Role | string | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  const userRole = role as Role;
  const perms = ROLE_PERMISSIONS[userRole];
  if (!perms) return false;
  return perms.includes(permission);
}

export function hasRole(role: Role | string | undefined | null, allowedRoles: Role[]): boolean {
  if (!role) return false;
  return allowedRoles.includes(role as Role);
}

/**
 * Filter data payload to strip privileged fields based on role
 */
export function sanitizeForRole<T extends Record<string, any>>(data: T, role: Role | string | undefined): T {
  const isPrivileged = role === "OWNER" || role === "MANAGER";
  if (isPrivileged) return data;

  const copy = { ...data };
  if ("costPricePaise" in copy) delete copy.costPricePaise;
  if ("monthlySalaryPaise" in copy) delete copy.monthlySalaryPaise;
  if ("hourlyRatePaise" in copy && role !== "COACH") delete copy.hourlyRatePaise;
  if ("balancePaise" in copy && role !== "OWNER") delete copy.balancePaise;

  return copy;
}

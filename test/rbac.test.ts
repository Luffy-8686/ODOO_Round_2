import { describe, it, expect } from "vitest";
import { ROLES, Role, ROLE_HOME_MAP, getRoleHome, isValidRole } from "../src/lib/roles";
import { can, hasRole, sanitizeForRole, ROLE_PERMISSIONS } from "../src/lib/permissions";
import bcrypt from "bcryptjs";

describe("RBAC & Multi-Portal Security Suite", () => {
  describe("1. Role Definitions and Route Matrix", () => {
    it("Defines exactly the 7 required business roles", () => {
      expect(ROLES).toEqual([
        "OWNER",
        "MANAGER",
        "FRONT_DESK",
        "BAR_STAFF",
        "SHOP_STAFF",
        "COACH",
        "MEMBER",
      ]);
    });

    it("Maps each role to its dedicated role portal home", () => {
      expect(getRoleHome("OWNER")).toBe("/app/owner");
      expect(getRoleHome("MANAGER")).toBe("/app/manager");
      expect(getRoleHome("FRONT_DESK")).toBe("/app/desk");
      expect(getRoleHome("BAR_STAFF")).toBe("/app/bar");
      expect(getRoleHome("SHOP_STAFF")).toBe("/app/shop-admin");
      expect(getRoleHome("COACH")).toBe("/app/coach");
      expect(getRoleHome("MEMBER")).toBe("/portal");
      expect(getRoleHome(null)).toBe("/login");
      expect(getRoleHome("INVALID_ROLE")).toBe("/login");
    });

    it("Validates allowed roles correctly with type guards", () => {
      expect(isValidRole("OWNER")).toBe(true);
      expect(isValidRole("MEMBER")).toBe(true);
      expect(isValidRole("SUPER_ADMIN")).toBe(false);
      expect(isValidRole("GUEST")).toBe(false);
    });
  });

  describe("2. Granular Permissions Enforcement", () => {
    it("OWNER has full executive access across all modules", () => {
      expect(can("OWNER", "finance:pnl")).toBe(true);
      expect(can("OWNER", "finance:ledger")).toBe(true);
      expect(can("OWNER", "hr:payroll")).toBe(true);
      expect(can("OWNER", "settings:users")).toBe(true);
      expect(can("OWNER", "booking:create")).toBe(true);
      expect(can("OWNER", "pos:bar")).toBe(true);
      expect(can("OWNER", "pos:shop")).toBe(true);
    });

    it("MANAGER has operational access but is strictly blocked from executive P&L, HR payroll, and User roles", () => {
      expect(can("MANAGER", "booking:create")).toBe(true);
      expect(can("MANAGER", "member:read_all")).toBe(true);
      expect(can("MANAGER", "hr:leaves_approve")).toBe(true);

      // Blocked executive privileges
      expect(can("MANAGER", "finance:pnl")).toBe(false);
      expect(can("MANAGER", "finance:ledger")).toBe(false);
      expect(can("MANAGER", "hr:payroll")).toBe(false);
      expect(can("MANAGER", "settings:users")).toBe(false);
    });

    it("FRONT_DESK can manage court bookings and member onboarding but cannot access Bar POS or Executive P&L", () => {
      expect(can("FRONT_DESK", "booking:create")).toBe(true);
      expect(can("FRONT_DESK", "member:create")).toBe(true);
      expect(can("FRONT_DESK", "tab:read_all")).toBe(true);

      expect(can("FRONT_DESK", "finance:pnl")).toBe(false);
      expect(can("FRONT_DESK", "hr:payroll")).toBe(false);
      expect(can("FRONT_DESK", "pos:bar")).toBe(false);
      expect(can("FRONT_DESK", "settings:users")).toBe(false);
    });

    it("BAR_STAFF has POS and KDS access but cannot book courts or access HR/Finance", () => {
      expect(can("BAR_STAFF", "pos:bar")).toBe(true);
      expect(can("BAR_STAFF", "kds:update")).toBe(true);
      expect(can("BAR_STAFF", "tab:charge")).toBe(true);

      expect(can("BAR_STAFF", "booking:create")).toBe(false);
      expect(can("BAR_STAFF", "pos:shop")).toBe(false);
      expect(can("BAR_STAFF", "finance:pnl")).toBe(false);
      expect(can("BAR_STAFF", "hr:payroll")).toBe(false);
    });

    it("COACH can only view coaching sessions and student schedule", () => {
      expect(can("COACH", "coach:read_own")).toBe(true);
      expect(can("COACH", "coach:update_session")).toBe(true);
      expect(can("COACH", "booking:read")).toBe(true);

      expect(can("COACH", "pos:bar")).toBe(false);
      expect(can("COACH", "pos:shop")).toBe(false);
      expect(can("COACH", "finance:pnl")).toBe(false);
      expect(can("COACH", "hr:payroll")).toBe(false);
    });

    it("MEMBER is restricted to self-service actions and cannot access staff directory", () => {
      expect(can("MEMBER", "booking:create_own")).toBe(true);
      expect(can("MEMBER", "member:read_own")).toBe(true);
      expect(can("MEMBER", "tab:read_own")).toBe(true);

      expect(can("MEMBER", "member:read_all")).toBe(false);
      expect(can("MEMBER", "booking:create")).toBe(false);
      expect(can("MEMBER", "pos:bar")).toBe(false);
      expect(can("MEMBER", "finance:pnl")).toBe(false);
      expect(can("MEMBER", "settings:users")).toBe(false);
    });
  });

  describe("3. Field-Level Data Redaction & Sanitization", () => {
    it("Redacts costPricePaise from product data for SHOP_STAFF and MEMBER", () => {
      const product = {
        id: "prod-1",
        name: "Wilson Blade 98 V8",
        retailPricePaise: 2499900,
        costPricePaise: 1600000,
      };

      const shopView = sanitizeForRole(product, "SHOP_STAFF");
      expect(shopView.costPricePaise).toBeUndefined();
      expect(shopView.retailPricePaise).toBe(2499900);

      const memberView = sanitizeForRole(product, "MEMBER");
      expect(memberView.costPricePaise).toBeUndefined();

      const ownerView = sanitizeForRole(product, "OWNER");
      expect(ownerView.costPricePaise).toBe(1600000);
    });

    it("Redacts monthlySalaryPaise from employee data for non-owner roles", () => {
      const employee = {
        id: "emp-1",
        name: "Rahul Verma",
        role: "FRONT_DESK",
        monthlySalaryPaise: 3500000,
      };

      const managerView = sanitizeForRole(employee, "FRONT_DESK");
      expect(managerView.monthlySalaryPaise).toBeUndefined();

      const ownerView = sanitizeForRole(employee, "OWNER");
      expect(ownerView.monthlySalaryPaise).toBe(3500000);
    });
  });

  describe("4. Password Verification & Authentication Security", () => {
    it("Verifies bcrypt hashes securely for demo credentials", async () => {
      const demoPass = "Demo@1234";
      const hash = await bcrypt.hash(demoPass, 10);

      expect(await bcrypt.compare(demoPass, hash)).toBe(true);
      expect(await bcrypt.compare("WrongPassword", hash)).toBe(false);
    });
  });
});

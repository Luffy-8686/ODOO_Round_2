import { describe, it, expect } from "vitest";
import { prisma } from "../src/lib/prisma";

describe("Dashboard Financial Invariants", () => {
  it("verifies today, 7d, and 30d views have positive revenues, positive net surplus, and healthy margins", async () => {
    const ranges = ["today", "7d", "30d"];

    for (const range of ranges) {
      const now = new Date();
      let startDate: Date;
      let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      let prevStartDate: Date;
      let prevEndDate: Date;

      if (range === "today") {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        prevStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
        prevEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      } else if (range === "7d") {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
        prevStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13, 0, 0, 0, 0);
        prevEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 23, 59, 59, 999);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
        prevStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 59, 0, 0, 0, 0);
        prevEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30, 23, 59, 59, 999);
      }

      const txs = await prisma.ledgerTransaction.findMany({
        where: {
          date: { gte: startDate, lte: endDate },
          creditPaise: { gt: 0 },
        },
      });

      const revenueByStream: Record<string, number> = {
        COURTS: 0,
        MEMBERSHIPS: 0,
        SHOP: 0,
        BAR: 0,
      };

      let totalRevenuePaise = 0;
      for (const tx of txs) {
        totalRevenuePaise += tx.creditPaise;
        const mod = tx.module ? tx.module.toUpperCase() : "OTHER";
        if (mod === "COURT" || mod === "COURTS") {
          revenueByStream.COURTS = (revenueByStream.COURTS || 0) + tx.creditPaise;
        } else if (mod === "MEMBERSHIP" || mod === "MEMBERSHIPS") {
          revenueByStream.MEMBERSHIPS = (revenueByStream.MEMBERSHIPS || 0) + tx.creditPaise;
        } else if (mod === "SHOP" || mod === "RETAIL") {
          revenueByStream.SHOP = (revenueByStream.SHOP || 0) + tx.creditPaise;
        } else if (mod === "BAR" || mod === "CAFE" || mod === "DINING") {
          revenueByStream.BAR = (revenueByStream.BAR || 0) + tx.creditPaise;
        } else {
          revenueByStream[mod] = (revenueByStream[mod] || 0) + tx.creditPaise;
        }
      }

      const expenses = await prisma.expense.findMany({
        where: {
          OR: [
            { paymentDate: { gte: startDate, lte: endDate } },
            { paymentDate: null, createdAt: { gte: startDate, lte: endDate } },
          ],
        },
      });
      const totalExpensesPaise = expenses.reduce((sum, e) => sum + e.amountPaise, 0);
      const netProfitPaise = totalRevenuePaise - totalExpensesPaise;
      const marginPercent = totalRevenuePaise > 0 ? Math.round((netProfitPaise / totalRevenuePaise) * 100) : 0;

      console.log(`[${range.toUpperCase()}] Gross: ₹${(totalRevenuePaise / 100).toLocaleString()}, Exp: ₹${(totalExpensesPaise / 100).toLocaleString()}, Net: ₹${(netProfitPaise / 100).toLocaleString()} (${marginPercent}%), Streams:`, revenueByStream);

      expect(totalRevenuePaise).toBeGreaterThan(0);
      expect(netProfitPaise).toBeGreaterThan(0);
      expect(marginPercent).toBeGreaterThan(0);
      expect(revenueByStream.MEMBERSHIPS).toBeGreaterThan(0);
      expect(revenueByStream.COURTS).toBeGreaterThan(0);
      expect(revenueByStream.SHOP).toBeGreaterThan(0);
      expect(revenueByStream.BAR).toBeGreaterThan(0);
    }
  });
});

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerAuthSession();
    if (!session || session.user?.role !== "OWNER") {
      return NextResponse.json(
        { error: "Forbidden. Executive analytics dashboard is reserved exclusively for Club Owners." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "30d"; // today, 7d, 30d

    const now = new Date();
    let startDate = new Date();
    if (range === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "7d") {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setDate(startDate.getDate() - 30);
    }

    // 1. Revenue by Stream
    const txs = await prisma.ledgerTransaction.findMany({
      where: { date: { gte: startDate } },
    });

    const revenueByStream: Record<string, number> = {
      COURTS: 0,
      MEMBERSHIPS: 0,
      SHOP: 0,
      BAR: 0,
    };

    let totalRevenuePaise = 0;
    for (const tx of txs) {
      if (tx.creditPaise > 0) {
        totalRevenuePaise += tx.creditPaise;
        const mod = tx.module.toUpperCase();
        revenueByStream[mod] = (revenueByStream[mod] || 0) + tx.creditPaise;
      }
    }

    // 2. Expenses & Net Profit
    const expenses = await prisma.expense.findMany({
      where: { createdAt: { gte: startDate } },
    });
    const totalExpensesPaise = expenses.reduce((sum, e) => sum + e.amountPaise, 0);
    const netProfitPaise = totalRevenuePaise - totalExpensesPaise;

    // 3. Member counts by status & tier
    const members = await prisma.member.findMany({
      include: { memberships: { where: { status: "ACTIVE" }, include: { plan: true } } },
    });

    const activeMembers = members.filter((m) => m.status === "ACTIVE").length;
    const expiringSoon = members.filter((m) => m.status === "EXPIRING_SOON").length;
    const expiredMembers = members.filter((m) => m.status === "EXPIRED").length;

    const tierBreakdown = {
      GOLD: members.filter((m) => m.memberships[0]?.tier === "GOLD").length,
      SILVER: members.filter((m) => m.memberships[0]?.tier === "SILVER").length,
      JUNIOR: members.filter((m) => m.memberships[0]?.tier === "JUNIOR").length,
    };

    // 4. Court Utilization & Peak hours (Hourly breakdown 6am - 10pm)
    const bookings = await prisma.booking.findMany({
      where: { startTime: { gte: startDate }, status: { in: ["CONFIRMED", "COMPLETED"] } },
      include: { court: true },
    });

    const hourlyUtilization: Record<number, number> = {};
    for (let h = 6; h <= 22; h++) hourlyUtilization[h] = 0;

    for (const b of bookings) {
      const h = new Date(b.startTime).getHours();
      if (hourlyUtilization[h] !== undefined) {
        hourlyUtilization[h]++;
      }
    }

    // 5. Low Stock Alert Count
    const products = await prisma.product.findMany({
      include: { variants: true },
    });
    const lowStockCount = products.filter((p) =>
      p.variants.some((v) => v.stockQuantity <= p.reorderLevel)
    ).length;

    // 6. Lead Conversion Rate
    const leads = await prisma.lead.findMany({
      where: { createdAt: { gte: startDate } },
    });
    const convertedLeads = leads.filter((l) => l.status === "CONVERTED").length;
    const conversionRate = leads.length > 0 ? Math.round((convertedLeads / leads.length) * 100) : 0;

    // 7. Recent Transactions & Activity feed
    const recentLedger = await prisma.ledgerTransaction.findMany({
      orderBy: { date: "desc" },
      take: 8,
    });

    return NextResponse.json({
      range,
      totalRevenuePaise,
      totalExpensesPaise,
      netProfitPaise,
      revenueByStream,
      activeMembers,
      expiringSoon,
      expiredMembers,
      tierBreakdown,
      hourlyUtilization,
      totalBookings: bookings.length,
      lowStockCount,
      totalLeads: leads.length,
      convertedLeads,
      conversionRate,
      recentLedger,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

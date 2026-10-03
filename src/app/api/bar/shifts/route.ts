import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get("report"); // e.g. "eod" for end-of-day summary

    if (reportType === "eod") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const payments = await prisma.payment.findMany({
        where: {
          module: "BAR",
          createdAt: { gte: todayStart, lte: todayEnd },
          status: "SUCCESS",
        },
      });

      const totalRevenuePaise = payments.reduce((sum, p) => sum + p.amountPaise, 0);

      const byMethod: Record<string, number> = {};
      for (const p of payments) {
        byMethod[p.method] = (byMethod[p.method] || 0) + p.amountPaise;
      }

      const orders = await prisma.barOrder.findMany({
        where: {
          createdAt: { gte: todayStart, lte: todayEnd },
          status: { not: "CANCELLED" },
        },
        include: { items: { include: { menuItem: true } } },
      });

      const openTabs = await prisma.tab.findMany({
        where: { status: "OPEN" },
        include: { table: true, member: true },
      });

      const shifts = await prisma.shift.findMany({
        where: { createdAt: { gte: todayStart, lte: todayEnd } },
        include: { employee: true },
      });

      return NextResponse.json({
        date: todayStart.toISOString(),
        totalRevenuePaise,
        ordersCount: orders.length,
        averageTicketPaise: orders.length > 0 ? Math.round(totalRevenuePaise / orders.length) : 0,
        revenueByMethod: byMethod,
        openTabsCount: openTabs.length,
        openTabsAmountPaise: openTabs.reduce((sum, t) => sum + t.finalAmountPaise, 0),
        shifts,
        openTabs,
      });
    }

    const shifts = await prisma.shift.findMany({
      include: { employee: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ shifts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.action === "CLOCK_IN") {
      const shift = await prisma.shift.create({
        data: {
          employeeId: body.employeeId,
          role: body.role || "BAR_STAFF",
          openingFloatPaise: body.openingFloatPaise || 500000, // ₹5,000 default float
          status: "OPEN",
          notes: body.notes,
        },
      });
      return NextResponse.json({ success: true, shift });
    }

    if (body.action === "CLOCK_OUT") {
      const shift = await prisma.shift.findUnique({ where: { id: body.shiftId } });
      if (!shift) {
        return NextResponse.json({ error: "Shift not found" }, { status: 404 });
      }

      const actualCashCountPaise = body.actualCashCountPaise || 0;
      const expectedCashPaise = shift.openingFloatPaise + (body.shiftCashSalesPaise || 0);
      const variancePaise = actualCashCountPaise - expectedCashPaise;

      const closed = await prisma.shift.update({
        where: { id: body.shiftId },
        data: {
          clockOut: new Date(),
          closingFloatPaise: actualCashCountPaise,
          actualCashCountPaise,
          variancePaise,
          status: "CLOSED",
          notes: body.notes,
        },
      });

      return NextResponse.json({ success: true, shift: closed });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

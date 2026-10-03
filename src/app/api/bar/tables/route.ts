import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const tables = await prisma.table.findMany({
      include: {
        tabs: {
          where: { status: "OPEN" },
          include: {
            member: true,
            orders: {
              where: { status: { not: "CANCELLED" } },
              include: { items: { include: { menuItem: true } } },
            },
          },
        },
      },
      orderBy: { tableNumber: "asc" },
    });
    return NextResponse.json({ tables });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, tableId, memberId, reservationName, guestCount, reservationTime, notes, userId } = body;

    if (action === "RESERVE_TABLE") {
      if (!tableId) {
        return NextResponse.json({ error: "Missing tableId" }, { status: 400 });
      }

      const table = await prisma.table.update({
        where: { id: tableId },
        data: {
          status: "RESERVED",
        },
      });

      const reservationCode = `TBL-RES-${table.tableNumber}-${Math.floor(1000 + Math.random() * 9000)}`;

      if (userId) {
        await logAudit({
          userId,
          action: "UPDATE_COURT_RATE", // Log operational update
          entityType: "Table",
          entityId: table.id,
          details: {
            reservationCode,
            tableNumber: table.tableNumber,
            tableName: table.name,
            memberId,
            reservationName,
            guestCount,
            reservationTime,
            notes,
          },
        });
      }

      return NextResponse.json({
        success: true,
        table,
        reservationCode,
        message: `Table ${table.name} reserved successfully for ${reservationName || "Member"} (${guestCount || 2} guests).`,
      });
    }

    if (action === "RELEASE_TABLE") {
      const table = await prisma.table.update({
        where: { id: tableId },
        data: { status: "FREE" },
      });
      return NextResponse.json({ success: true, table });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveHolds } from "@/lib/concurrency";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date"); // YYYY-MM-DD
    const sportId = searchParams.get("sportId");

    const courts = await prisma.court.findMany({
      where: {
        ...(sportId ? { sportId } : {}),
      },
      include: {
        sport: true,
      },
      orderBy: { name: "asc" },
    });

    // If date provided, also fetch bookings for that date
    let bookings: any[] = [];
    let maintenance: any[] = [];
    let socialSessions: any[] = [];
    let holds: any[] = [];

    if (dateStr) {
      holds = getActiveHolds(dateStr);
      const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
      const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

      bookings = await prisma.booking.findMany({
        where: {
          startTime: { gte: startOfDay, lte: endOfDay },
          status: { in: ["CONFIRMED", "PENDING"] },
        },
        include: {
          member: {
            include: { memberships: { where: { status: "ACTIVE" }, include: { plan: true } } },
          },
        },
        orderBy: { startTime: "asc" },
      });

      maintenance = await prisma.maintenanceBlock.findMany({
        where: {
          startTime: { lte: endOfDay },
          endTime: { gte: startOfDay },
        },
      });

      socialSessions = await prisma.socialSession.findMany({
        where: {
          startTime: { gte: startOfDay, lte: endOfDay },
          status: "ACTIVE",
        },
        include: { participants: true },
      });
    }

    return NextResponse.json({ courts, bookings, maintenance, socialSessions, holds });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

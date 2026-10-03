import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureFridaySocialSession, seedUpcomingFridaySocialSessions } from "@/lib/social";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");

    const whereClause: any = { status: "ACTIVE" };
    if (dateStr) {
      await ensureFridaySocialSession(dateStr);
      const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
      const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);
      whereClause.startTime = { gte: startOfDay, lte: endOfDay };
    } else {
      await seedUpcomingFridaySocialSessions(12);
    }

    const sessions = await prisma.socialSession.findMany({
      where: whereClause,
      include: {
        court: { include: { sport: true } },
        participants: {
          include: {
            member: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json({ sessions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { socialSessionId, memberId, guestName, guestPhone, paymentMethod } = body;

    if (!socialSessionId || !guestName) {
      return NextResponse.json(
        { error: "Missing required fields: socialSessionId, guestName" },
        { status: 400 }
      );
    }

    const session = await prisma.socialSession.findUnique({
      where: { id: socialSessionId },
      include: { participants: true, court: true },
    });

    if (!session || session.status !== "ACTIVE") {
      return NextResponse.json({ error: "Social Session not found or inactive" }, { status: 404 });
    }

    if (session.participants.length >= session.capacity) {
      return NextResponse.json(
        { error: `Session is fully booked (${session.capacity}/${session.capacity} players).` },
        { status: 400 }
      );
    }

    // Check if member is already enrolled
    if (memberId) {
      const existing = session.participants.find((p) => p.memberId === memberId && p.status !== "CANCELLED");
      if (existing) {
        return NextResponse.json(
          { error: "You are already enrolled in this Social Play session!" },
          { status: 400 }
        );
      }
    }

    const participant = await prisma.socialParticipant.create({
      data: {
        socialSessionId,
        memberId: memberId || null,
        guestName,
        guestPhone: guestPhone || "+91 99999 99999",
        status: "CONFIRMED",
        paidPaise: session.pricePerPersonPaise,
      },
      include: {
        member: true,
        socialSession: {
          include: { court: true },
        },
      },
    });

    return NextResponse.json({ success: true, participant });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

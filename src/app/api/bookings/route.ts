import { NextResponse } from "next/server";
import { createCourtBookingAtomic, cancelBookingAtomic } from "@/lib/concurrency";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    const limit = parseInt(searchParams.get("limit") || "50");

    const bookings = await prisma.booking.findMany({
      where: {
        ...(memberId ? { memberId } : {}),
      },
      include: {
        court: { include: { sport: true } },
        member: true,
      },
      orderBy: { startTime: "desc" },
      take: limit,
    });

    return NextResponse.json({ bookings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.courtId || !body.startTime || !body.bookerName) {
      return NextResponse.json(
        { error: "Missing required fields: courtId, startTime, bookerName" },
        { status: 400 }
      );
    }

    const booking = await createCourtBookingAtomic({
      courtId: body.courtId,
      memberId: body.memberId,
      bookerName: body.bookerName,
      bookerPhone: body.bookerPhone || "+91 99999 99999",
      bookerEmail: body.bookerEmail || "guest@championsclub.in",
      bookerType: body.bookerType,
      startTime: new Date(body.startTime),
      durationMinutes: body.durationMinutes || 60,
      source: body.source || "FRONT_DESK",
      paymentMethod: body.paymentMethod,
      notes: body.notes,
      userId: body.userId,
      userName: body.userName,
    });

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("id");
    const reason = searchParams.get("reason") || "Cancelled by user/staff";
    const userId = searchParams.get("userId") || undefined;

    if (!bookingId) {
      return NextResponse.json({ error: "Missing booking id" }, { status: 400 });
    }

    const cancelled = await cancelBookingAtomic(bookingId, reason, userId);
    return NextResponse.json({ success: true, booking: cancelled });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

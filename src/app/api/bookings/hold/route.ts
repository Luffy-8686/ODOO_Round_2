import { NextResponse } from "next/server";
import { holdCourtSlot, releaseCourtSlotHold, getActiveHolds } from "@/lib/concurrency";
import { getServerAuthSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date") || undefined;
    const holds = getActiveHolds(dateStr);
    return NextResponse.json({ success: true, holds });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const session = await getServerAuthSession();

    if (!body.courtId || !body.startTime) {
      return NextResponse.json(
        { error: "Missing required fields: courtId, startTime" },
        { status: 400 }
      );
    }

    const hold = await holdCourtSlot({
      courtId: body.courtId,
      startTime: body.startTime,
      durationMinutes: body.durationMinutes || 60,
      userId: body.userId || session?.user?.id || null,
      memberId: body.memberId || session?.user?.memberId || null,
      holderName: body.holderName || session?.user?.name || "Guest Customer",
    });

    return NextResponse.json({ success: true, hold });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, isHeldByOther: true }, { status: 409 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const holdId = searchParams.get("holdId");
    const session = await getServerAuthSession();

    if (!holdId) {
      return NextResponse.json({ error: "Missing holdId" }, { status: 400 });
    }

    const released = releaseCourtSlotHold(holdId, session?.user?.id);
    return NextResponse.json({ success: true, released });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import {
  acquireSlotLock,
  releaseSlotLock,
  SLOT_LOCK_TTL_SECONDS,
} from "@/lib/slot-lock";
import { isSlotLocked } from "@/lib/slot-lock";

/**
 * POST /api/slot-lock
 * Body: { courtId, slotTime (ISO string), sessionId, memberId? }
 *
 * Acquires (or refreshes) a 300-second TTL lock on the requested slot.
 * Returns 200 with { acquired: true, expiresAt, ttlSeconds } on success,
 * or 409 with { acquired: false, secondsRemaining } when slot is already locked.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { courtId, slotTime, sessionId, memberId } = body;

    if (!courtId || !slotTime || !sessionId) {
      return NextResponse.json(
        { error: "Missing required fields: courtId, slotTime, sessionId" },
        { status: 400 }
      );
    }

    const slotDate = new Date(slotTime);
    if (isNaN(slotDate.getTime())) {
      return NextResponse.json({ error: "Invalid slotTime" }, { status: 400 });
    }

    const result = await acquireSlotLock(courtId, slotDate, sessionId, memberId);

    if (result.acquired) {
      return NextResponse.json({
        acquired: true,
        lockId: result.lockId,
        sessionId: result.sessionId,
        expiresAt: result.expiresAt,
        ttlSeconds: SLOT_LOCK_TTL_SECONDS,
        lockedByMe: result.lockedByMe,
      });
    } else {
      return NextResponse.json(
        {
          acquired: false,
          secondsRemaining: result.secondsRemaining,
          message: `This slot is temporarily reserved by another user. Please try again in ${result.secondsRemaining} seconds.`,
        },
        { status: 409 }
      );
    }
  } catch (error: any) {
    console.error("[slot-lock POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/slot-lock
 * Body: { courtId, slotTime (ISO string), sessionId }
 *
 * Releases the lock — only the owning session can release it.
 */
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { courtId, slotTime, sessionId } = body;

    if (!courtId || !slotTime || !sessionId) {
      return NextResponse.json(
        { error: "Missing required fields: courtId, slotTime, sessionId" },
        { status: 400 }
      );
    }

    const slotDate = new Date(slotTime);
    const result = await releaseSlotLock(courtId, slotDate, sessionId);

    return NextResponse.json({ released: result.released });
  } catch (error: any) {
    console.error("[slot-lock DELETE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/slot-lock?courtId=X&slotTime=ISO&sessionId=Y
 *
 * Check the live status of a specific slot lock.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courtId = searchParams.get("courtId");
    const slotTime = searchParams.get("slotTime");
    const sessionId = searchParams.get("sessionId") ?? undefined;

    if (!courtId || !slotTime) {
      return NextResponse.json(
        { error: "Missing courtId or slotTime" },
        { status: 400 }
      );
    }

    const slotDate = new Date(slotTime);
    const status = await isSlotLocked(courtId, slotDate, sessionId);

    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

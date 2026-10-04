import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/lib/prisma";
import {
  acquireSlotLock,
  releaseSlotLock,
  isSlotLocked,
  getActiveLocksForDate,
  purgeExpiredLocks,
} from "../src/lib/slot-lock";
import { createCourtBookingAtomic } from "../src/lib/concurrency";

describe("TTL / Ephemeral Slot Locking Suite (300s lock)", () => {
  let court: any;
  const testSlotTime = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days in future
  testSlotTime.setHours(10, 0, 0, 0);
  const sessionUserA = "session_user_A_12345";
  const sessionUserB = "session_user_B_67890";

  beforeAll(async () => {
    court = await prisma.court.findFirst({ where: { status: "ACTIVE" } });
    // Clean up any test locks/bookings
    await prisma.slotLock.deleteMany({
      where: { courtId: court.id },
    });
    await prisma.booking.deleteMany({
      where: { bookerEmail: { contains: "slotlocktest.com" } },
    });
  });

  afterAll(async () => {
    await prisma.slotLock.deleteMany({
      where: { courtId: court.id },
    });
    await prisma.booking.deleteMany({
      where: { bookerEmail: { contains: "slotlocktest.com" } },
    });
    await prisma.$disconnect();
  });

  it("1. User A successfully acquires lock on a slot for 300 seconds", async () => {
    const res = await acquireSlotLock(court.id, testSlotTime, sessionUserA);

    expect(res.acquired).toBe(true);
    expect(res.sessionId).toBe(sessionUserA);
    expect(res.expiresAt).toBeDefined();

    const expiresAt = new Date(res.expiresAt!).getTime();
    const now = Date.now();
    const diffSecs = Math.round((expiresAt - now) / 1000);
    expect(diffSecs).toBeGreaterThanOrEqual(295);
    expect(diffSecs).toBeLessThanOrEqual(305);
  });

  it("2. User B fails to acquire lock on the same slot while User A's lock is active", async () => {
    const res = await acquireSlotLock(court.id, testSlotTime, sessionUserB);

    expect(res.acquired).toBe(false);
    expect(res.secondsRemaining).toBeGreaterThan(0);
    expect(res.lockedByMe).toBe(false);
  });

  it("3. isSlotLocked returns true for User B and false for User A (owner bypass)", async () => {
    const lockedForUserB = await isSlotLocked(court.id, testSlotTime, sessionUserB);
    expect(lockedForUserB.locked).toBe(true);
    expect(lockedForUserB.secondsRemaining).toBeGreaterThan(0);

    const lockedForUserA = await isSlotLocked(court.id, testSlotTime, sessionUserA);
    expect(lockedForUserA.locked).toBe(false);
  });

  it("4. User B booking attempt is rejected because slot is locked by User A", async () => {
    await expect(
      createCourtBookingAtomic({
        courtId: court.id,
        bookerName: "User B",
        bookerPhone: "+91 99000 11111",
        bookerEmail: "userb@slotlocktest.com",
        startTime: testSlotTime,
        durationMinutes: 60,
        sessionId: sessionUserB,
      })
    ).rejects.toThrow(/temporarily reserved by another user/);
  });

  it("5. User A booking attempt succeeds with matching sessionId", async () => {
    const booking = await createCourtBookingAtomic({
      courtId: court.id,
      bookerName: "User A",
      bookerPhone: "+91 99000 22222",
      bookerEmail: "usera@slotlocktest.com",
      startTime: testSlotTime,
      durationMinutes: 60,
      sessionId: sessionUserA,
    });

    expect(booking).toBeDefined();
    expect(booking.id).toBeDefined();
    expect(booking.bookerEmail).toBe("usera@slotlocktest.com");
  });

  it("6. User A releases the lock after booking", async () => {
    const { released } = await releaseSlotLock(court.id, testSlotTime, sessionUserA);
    expect(released).toBe(true);

    const checkLock = await prisma.slotLock.findFirst({
      where: { courtId: court.id, slotTime: testSlotTime },
    });
    expect(checkLock).toBeNull();
  });

  it("7. getActiveLocksForDate retrieves active locks correctly", async () => {
    const slot2 = new Date(testSlotTime.getTime() + 60 * 60 * 1000);
    await acquireSlotLock(court.id, slot2, sessionUserA);

    const dateStr = slot2.toISOString().split("T")[0];
    const locks = await getActiveLocksForDate([court.id], dateStr);
    expect(locks.length).toBeGreaterThanOrEqual(1);
    expect(locks.some((l) => l.courtId === court.id && l.sessionId === sessionUserA)).toBe(true);

    // Clean up
    await releaseSlotLock(court.id, slot2, sessionUserA);
  });

  it("8. Expired locks are purged by purgeExpiredLocks", async () => {
    const expiredSlot = new Date(testSlotTime.getTime() + 2 * 60 * 60 * 1000);
    // Create an already-expired lock manually
    await prisma.slotLock.create({
      data: {
        courtId: court.id,
        slotTime: expiredSlot,
        sessionId: "expired_session",
        expiresAt: new Date(Date.now() - 1000), // 1 sec ago
      },
    });

    const purgedCount = await purgeExpiredLocks();
    expect(purgedCount).toBeGreaterThanOrEqual(1);

    const remaining = await prisma.slotLock.findFirst({
      where: { courtId: court.id, slotTime: expiredSlot },
    });
    expect(remaining).toBeNull();
  });
});

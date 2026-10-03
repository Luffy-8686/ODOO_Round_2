import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/lib/prisma";
import { createCourtBookingAtomic } from "../src/lib/concurrency";

describe("Hard Concurrency Invariant — Simultaneous Slot Collision Test", () => {
  let court: any;

  beforeAll(async () => {
    // Clean test bookings
    await prisma.booking.deleteMany({
      where: { bookerEmail: { contains: "collisiontest.com" } },
    });
    court = await prisma.court.findFirst({ where: { status: "ACTIVE" } });
  });

  afterAll(async () => {
    await prisma.booking.deleteMany({
      where: { bookerEmail: { contains: "collisiontest.com" } },
    });
    await prisma.$disconnect();
  });

  it("Fires 10 concurrent booking requests at the EXACT same court and slot, asserting EXACTLY 1 succeeds and 9 fail with conflict", async () => {
    const targetSlot = new Date(Date.now() + 300 * 24 * 60 * 60 * 1000 + Math.random() * 10000000);
    targetSlot.setHours(18, 0, 0, 0); // 6:00 PM peak rush

    const attempts = Array.from({ length: 10 }, (_, i) => ({
      courtId: court.id,
      bookerName: `Simultaneous Contender #${i + 1}`,
      bookerPhone: `+91 99000 ${String(10000 + i).slice(-5)}`,
      bookerEmail: `contender${i + 1}@collisiontest.com`,
      startTime: targetSlot,
      durationMinutes: 60,
    }));

    // Fire all 10 simultaneously
    const results = await Promise.allSettled(
      attempts.map((req) => createCourtBookingAtomic(req))
    );

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    console.log(`[CONCURRENCY STRESS TEST RESULT] Succeeded: ${fulfilled.length}, Rejected: ${rejected.length}`);

    // EXACTLY 1 must succeed
    expect(fulfilled.length).toBe(1);
    // EXACTLY 9 must be rejected due to collision guard
    expect(rejected.length).toBe(9);

    // Verify error messages indicate collision
    for (const r of rejected) {
      if (r.status === "rejected") {
        expect(r.reason.message).toMatch(/Double-booking prevented|Slot conflict/);
      }
    }
  });

  describe("TTL Slot Hold Engine (300-Second Movie-Theater Locking)", () => {
    it("Acquires a 300-second exclusive hold and blocks conflicting hold requests from other users", async () => {
      const { holdCourtSlot, releaseCourtSlotHold, getActiveHolds } = await import("../src/lib/concurrency");
      const targetSlot = new Date(Date.now() + 400 * 24 * 60 * 60 * 1000);
      targetSlot.setHours(19, 0, 0, 0);

      const testUser = await prisma.user.findFirst();

      // User 1 acquires hold
      const hold1 = await holdCourtSlot({
        courtId: court.id,
        startTime: targetSlot,
        durationMinutes: 60,
        userId: testUser?.id || "user-111",
        holderName: "Customer One",
      });

      expect(hold1.id).toBeDefined();
      expect(hold1.ttlSeconds).toBe(300);
      expect(hold1.expiresAt).toBeGreaterThan(Date.now());

      // User 2 attempts to hold same slot -> must be rejected
      await expect(
        holdCourtSlot({
          courtId: court.id,
          startTime: targetSlot,
          durationMinutes: 60,
          userId: "different-user-id",
          holderName: "Customer Two",
        })
      ).rejects.toThrow(/Slot is currently locked by another customer/);

      // User 1 confirms booking using holdId
      const booking = await createCourtBookingAtomic({
        courtId: court.id,
        bookerName: "Customer One",
        bookerPhone: "+91 99999 22222",
        bookerEmail: "c1@collisiontest.com",
        startTime: targetSlot,
        durationMinutes: 60,
        holdId: hold1.id,
        userId: testUser?.id,
      });

      expect(booking.id).toBeDefined();
      expect(booking.bookingNumber).toBeDefined();

      // Ensure hold was consumed/pruned
      const activeHolds = getActiveHolds();
      expect(activeHolds.some((h) => h.id === hold1.id)).toBe(false);
    });

    it("Releasing a TTL hold frees the slot for another customer immediately", async () => {
      const { holdCourtSlot, releaseCourtSlotHold } = await import("../src/lib/concurrency");
      const targetSlot = new Date(Date.now() + 401 * 24 * 60 * 60 * 1000);
      targetSlot.setHours(20, 0, 0, 0);

      const hold = await holdCourtSlot({
        courtId: court.id,
        startTime: targetSlot,
        durationMinutes: 60,
        userId: "user-alpha",
        holderName: "User Alpha",
      });

      expect(hold.id).toBeDefined();

      // Release hold
      const released = releaseCourtSlotHold(hold.id, "user-alpha");
      expect(released).toBe(true);

      // User Beta can now hold the slot
      const holdBeta = await holdCourtSlot({
        courtId: court.id,
        startTime: targetSlot,
        durationMinutes: 60,
        userId: "user-beta",
        holderName: "User Beta",
      });

      expect(holdBeta.id).toBeDefined();
      releaseCourtSlotHold(holdBeta.id);
    });
  });
});

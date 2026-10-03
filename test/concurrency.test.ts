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
});

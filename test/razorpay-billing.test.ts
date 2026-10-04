import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/lib/prisma";
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
  refundRazorpayPayment,
  processSlotDepositRefund,
  getRazorpayConfig,
} from "../src/lib/razorpay";
import { createCourtBookingAtomic } from "../src/lib/concurrency";
import { runBackgroundWorker } from "../src/lib/cron";

describe("Razorpay Trial Gateway & Membership Billing Rules", () => {
  let court: any;
  let goldMember: any;
  let silverMember: any;

  beforeAll(async () => {
    // 1. Fetch active court
    court = await prisma.court.findFirst({
      where: { status: "ACTIVE" },
      include: { sport: true },
    });

    // 2. Fetch or verify members
    goldMember = await prisma.member.findFirst({
      where: { memberships: { some: { tier: "GOLD", status: "ACTIVE" } } },
      include: { memberships: { include: { plan: true } } },
    });

    silverMember = await prisma.member.findFirst({
      where: { memberships: { some: { tier: "SILVER", status: "ACTIVE" } } },
      include: { memberships: { include: { plan: true } } },
    });

    // Clean up any previous test bookings
    await prisma.payment.deleteMany({
      where: { booking: { bookerEmail: { contains: "test-rp" } } },
    });
    await prisma.booking.deleteMany({
      where: { bookerEmail: { contains: "test-rp" } },
    });
  });

  afterAll(async () => {
    await prisma.payment.deleteMany({
      where: { booking: { bookerEmail: { contains: "test-rp" } } },
    });
    await prisma.booking.deleteMany({
      where: { bookerEmail: { contains: "test-rp" } },
    });
    await prisma.$disconnect();
  });

  describe("1. Environment & Gateway Status", () => {
    it("reports configuration status and allows trial simulation", () => {
      const config = getRazorpayConfig();
      expect(config).toBeDefined();
      expect(config).toHaveProperty("isConfigured");
      expect(config).toHaveProperty("mode");
    });
  });

  describe("2. Gold Membership: 100 INR Security Deposit Rule", () => {
    it("creates a Razorpay order of exactly ₹100 INR (10,000 paise) for Gold member court booking", async () => {
      // Gold member has complimentary court access (₹0) + ₹100 refundable security deposit
      const securityDepositPaise = 10000;
      const order = await createRazorpayOrder({
        amountPaise: securityDepositPaise,
        receipt: `test_gold_${Date.now()}`,
        notes: {
          bookerType: "GOLD",
          memberId: goldMember?.id,
          securityDepositPaise: "10000",
          courtPricePaise: "0",
        },
      });

      expect(order.amountPaise).toBe(10000);
      expect(order.currency).toBe("INR");
      expect(order.orderId).toBeDefined();
    });

    it("creates booking with ₹100 deposit in HELD escrow status", async () => {
      const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      futureDate.setHours(6, 0, 0, 0);

      // Remove any conflict on this specific slot before booking
      await prisma.booking.deleteMany({
        where: { courtId: court.id, startTime: futureDate },
      });

      const booking = await createCourtBookingAtomic({
        courtId: court.id,
        memberId: goldMember?.id,
        bookerName: goldMember?.name || "Gold VIP Member",
        bookerPhone: "+91 99999 11111",
        bookerEmail: "gold-test-rp@championsclub.in",
        bookerType: "GOLD",
        startTime: futureDate,
        durationMinutes: 60,
        paymentMethod: "RAZORPAY",
        razorpayOrderId: `order_trial_${Date.now()}`,
        razorpayPaymentId: `pay_trial_${Date.now()}`,
      });

      expect(booking.securityDepositPaise).toBe(10000);
      expect(booking.depositRefundStatus).toBe("HELD");
      expect(booking.totalPricePaise).toBe(0); // Free court fee
      expect(booking.paymentMethod).toBe("RAZORPAY");
    });
  });

  describe("3. Other Membership Tiers: Regular Discount & ₹0 Deposit", () => {
    it("charges Silver member standard discounted court fee with ₹0 security deposit", async () => {
      const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      futureDate.setHours(7, 0, 0, 0);

      const dayStart = new Date(futureDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(futureDate);
      dayEnd.setHours(23, 59, 59, 999);

      await prisma.booking.deleteMany({
        where: {
          OR: [
            { courtId: court.id, startTime: futureDate },
            { memberId: silverMember?.id, startTime: { gte: dayStart, lte: dayEnd } },
          ],
        },
      });

      const booking = await createCourtBookingAtomic({
        courtId: court.id,
        memberId: silverMember?.id,
        bookerName: silverMember?.name || "Silver Member",
        bookerPhone: "+91 88888 22222",
        bookerEmail: "silver-test-rp@championsclub.in",
        bookerType: "SILVER",
        startTime: futureDate,
        durationMinutes: 60,
        paymentMethod: "RAZORPAY",
      });

      // Silver receives 50% off-peak discount on court fee
      expect(booking.securityDepositPaise).toBe(0);
      expect(booking.depositRefundStatus).toBe("NOT_APPLICABLE");
      expect(booking.totalPricePaise).toBe(Math.round(court.hourlyRatePaise * 0.5));
    });

    it("charges Walk-in Guest standard base rate with ₹0 security deposit", async () => {
      const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      futureDate.setHours(8, 0, 0, 0);

      await prisma.booking.deleteMany({
        where: { courtId: court.id, startTime: futureDate },
      });

      const booking = await createCourtBookingAtomic({
        courtId: court.id,
        bookerName: "Guest Walkin",
        bookerPhone: "+91 77777 33333",
        bookerEmail: "walkin-test-rp@championsclub.in",
        bookerType: "WALK_IN",
        startTime: futureDate,
        durationMinutes: 60,
      });

      expect(booking.securityDepositPaise).toBe(0);
      expect(booking.depositRefundStatus).toBe("NOT_APPLICABLE");
      expect(booking.totalPricePaise).toBe(court.hourlyRatePaise);
    });
  });

  describe("4. Security Deposit Refund When Slot Ends", () => {
    it("successfully refunds ₹100 deposit and updates ledger and booking status", async () => {
      // Create a past booking simulating an ended slot
      const pastStart = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 hours ago
      const pastEnd = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

      const pastGoldBooking = await prisma.booking.create({
        data: {
          bookingNumber: `BK-TEST-END-${Date.now().toString().slice(-5)}`,
          courtId: court.id,
          memberId: goldMember?.id || null,
          bookerName: "Gold Member Slot Ended",
          bookerPhone: "+91 99999 11111",
          bookerEmail: "goldend@championsclub.in",
          bookerType: "GOLD",
          startTime: pastStart,
          endTime: pastEnd,
          durationMinutes: 60,
          status: "CONFIRMED",
          totalPricePaise: 0,
          securityDepositPaise: 10000,
          depositRefundStatus: "HELD",
          paymentStatus: "PAID",
          paymentMethod: "RAZORPAY",
          razorpayOrderId: `order_trial_${Date.now()}`,
          razorpayPaymentId: `pay_trial_${Date.now()}`,
        },
      });

      // Trigger refund processing
      const refundResult = await processSlotDepositRefund(
        pastGoldBooking.id,
        "Slot ended: Gold ₹100 security deposit refunded"
      );

      expect(refundResult.success).toBe(true);
      expect(refundResult.booking.status).toBe("COMPLETED");
      expect(refundResult.booking.depositRefundStatus).toBe("REFUNDED");
      expect(refundResult.booking.depositRefundedAt).toBeDefined();

      // Verify financial ledger debit entry was recorded
      const ledgerEntry = await prisma.ledgerTransaction.findFirst({
        where: {
          referenceId: pastGoldBooking.id,
          referenceType: "BOOKING",
          paymentMethod: "REFUND",
        },
      });

      expect(ledgerEntry).toBeDefined();
      expect(ledgerEntry?.debitPaise).toBe(10000);
      expect(ledgerEntry?.description).toContain("Security Deposit Refund");
    });

    it("automated cron background worker automatically refunds ended Gold bookings", async () => {
      // Create an ended Gold booking with deposit held
      const pastStart = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const pastEnd = new Date(Date.now() - 1 * 60 * 60 * 1000);

      const bookingToAutoRefund = await prisma.booking.create({
        data: {
          bookingNumber: `BK-AUTO-RFND-${Date.now().toString().slice(-5)}`,
          courtId: court.id,
          memberId: goldMember?.id || null,
          bookerName: "Auto Refund Gold Member",
          bookerPhone: "+91 99999 44444",
          bookerEmail: "autorefund@championsclub.in",
          bookerType: "GOLD",
          startTime: pastStart,
          endTime: pastEnd,
          durationMinutes: 60,
          status: "CONFIRMED",
          totalPricePaise: 0,
          securityDepositPaise: 10000,
          depositRefundStatus: "HELD",
          paymentStatus: "PAID",
          paymentMethod: "RAZORPAY",
        },
      });

      // Run background maintenance worker
      const cronResult = await runBackgroundWorker();
      expect(cronResult.slotDepositsRefunded).toBeGreaterThanOrEqual(1);

      // Verify the booking is now refunded
      const updated = await prisma.booking.findUnique({
        where: { id: bookingToAutoRefund.id },
      });

      expect(updated?.depositRefundStatus).toBe("REFUNDED");
      expect(updated?.status).toBe("COMPLETED");
    });
  });
});

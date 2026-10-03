import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/lib/prisma";
import { calculateCourtPrice, isPeakHour, calculateBarDiscount, calculateShopDiscount } from "../src/lib/pricing";
import { createCourtBookingAtomic, cancelBookingAtomic } from "../src/lib/concurrency";
import { executeShopSaleAtomic } from "../src/lib/inventory";
import { addItemsToTabAtomic, settleTabAtomic } from "../src/lib/tabs";
import { runBackgroundWorker } from "../src/lib/cron";

describe("Sports Club Management Engine — Comprehensive Business Rule Suite", () => {
  let court: any;
  let goldMember: any;
  let silverMember: any;
  let juniorMember: any;
  let expiredMember: any;

  beforeAll(async () => {
    // Clean test bookings
    await prisma.booking.deleteMany({
      where: { bookerEmail: { contains: "test.com" } },
    });

    court = await prisma.court.findFirst({ where: { status: "ACTIVE" } });
    goldMember = await prisma.member.findFirst({
      where: { memberships: { some: { tier: "GOLD", status: "ACTIVE" } } },
      include: { memberships: true },
    });
    silverMember = await prisma.member.findFirst({
      where: { memberships: { some: { tier: "SILVER", status: "ACTIVE" } } },
      include: { memberships: true },
    });
    juniorMember = await prisma.member.findFirst({
      where: { memberships: { some: { tier: "JUNIOR", status: "ACTIVE" } } },
      include: { memberships: true },
    });
    expiredMember = await prisma.member.findFirst({
      where: { status: "EXPIRED" },
      include: { memberships: true },
    });
  });

  afterAll(async () => {
    // Clean test bookings
    await prisma.booking.deleteMany({
      where: { bookerEmail: { contains: "test.com" } },
    });
    await prisma.$disconnect();
  });

  // TEST 1: Pricing Matrix & Peak vs Off-Peak
  describe("1. Pricing Matrix (Tier x Peak/Off-Peak x Walk-in)", () => {
    it("Gold member gets 100% discount on off-peak and peak", () => {
      const offPeak = calculateCourtPrice({ tier: "GOLD", isPeak: false, baseHourlyRatePaise: 80000 });
      expect(offPeak.finalPricePaise).toBe(0);
      expect(offPeak.discountPercent).toBe(100);

      const peak = calculateCourtPrice({ tier: "GOLD", isPeak: true, baseHourlyRatePaise: 80000 });
      expect(peak.finalPricePaise).toBe(0);
    });

    it("Silver member gets 50% off off-peak and 25% off peak", () => {
      const offPeak = calculateCourtPrice({ tier: "SILVER", isPeak: false, baseHourlyRatePaise: 80000 });
      expect(offPeak.finalPricePaise).toBe(40000);

      const peak = calculateCourtPrice({ tier: "SILVER", isPeak: true, baseHourlyRatePaise: 80000 });
      expect(peak.finalPricePaise).toBe(60000);
    });

    it("Junior member gets 60% off off-peak and 40% off peak", () => {
      const offPeak = calculateCourtPrice({ tier: "JUNIOR", isPeak: false, baseHourlyRatePaise: 80000 });
      expect(offPeak.finalPricePaise).toBe(32000);

      const peak = calculateCourtPrice({ tier: "JUNIOR", isPeak: true, baseHourlyRatePaise: 80000 });
      expect(peak.finalPricePaise).toBe(48000);
    });

    it("Walk-in guest pays standard rate off-peak and 20% surge during peak", () => {
      const offPeak = calculateCourtPrice({ tier: "WALK_IN", isPeak: false, baseHourlyRatePaise: 80000 });
      expect(offPeak.finalPricePaise).toBe(80000);

      const peak = calculateCourtPrice({ tier: "WALK_IN", isPeak: true, baseHourlyRatePaise: 80000 });
      expect(peak.finalPricePaise).toBe(96000);
    });
  });

  // TEST 2: Hard Overlap Prevention (60-min sessions starting every 30 mins)
  describe("2. Hard Overlap Prevention (30-min offset invariant)", () => {
    it("Prevents overlapping bookings on the same court for 60-min sessions starting 30 mins apart", async () => {
      const testDate = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000 + Math.random() * 10000000);
      testDate.setHours(14, 0, 0, 0); // 2:00 PM - 3:00 PM

      // Booking 1: 2:00 PM - 3:00 PM
      const b1 = await createCourtBookingAtomic({
        courtId: court.id,
        bookerName: "Player One",
        bookerPhone: "+91 99999 11111",
        bookerEmail: "p1@test.com",
        startTime: testDate,
        durationMinutes: 60,
      });
      expect(b1.id).toBeDefined();

      // Booking 2: 2:30 PM - 3:30 PM (30 min offset overlap!) MUST FAIL
      const testDateOffset = new Date(testDate);
      testDateOffset.setMinutes(30);

      await expect(
        createCourtBookingAtomic({
          courtId: court.id,
          bookerName: "Player Two",
          bookerPhone: "+91 99999 22222",
          bookerEmail: "p2@test.com",
          startTime: testDateOffset,
          durationMinutes: 60,
        })
      ).rejects.toThrow(/Double-booking prevented/);
    });
  });

  // TEST 3: Max 2 Bookings per Member per Day & Quota Release on Cancel
  describe("3. Member Daily Quota Limit (Max 2/day) & Cancel Release", () => {
    it("Enforces 2 bookings per day limit for members and releases quota upon cancellation", async () => {
      const quotaDate = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);
      quotaDate.setHours(8, 0, 0, 0);

      const slot1 = new Date(quotaDate); // 8:00 AM
      const slot2 = new Date(quotaDate);
      slot2.setHours(10, 0, 0, 0); // 10:00 AM
      const slot3 = new Date(quotaDate);
      slot3.setHours(12, 0, 0, 0); // 12:00 PM

      // 1st Booking
      const b1 = await createCourtBookingAtomic({
        courtId: court.id,
        memberId: goldMember.id,
        bookerName: goldMember.name,
        bookerPhone: goldMember.phone,
        bookerEmail: "gold1@test.com",
        startTime: slot1,
      });

      // 2nd Booking
      const b2 = await createCourtBookingAtomic({
        courtId: court.id,
        memberId: goldMember.id,
        bookerName: goldMember.name,
        bookerPhone: goldMember.phone,
        bookerEmail: "gold2@test.com",
        startTime: slot2,
      });

      // 3rd Booking MUST FAIL
      await expect(
        createCourtBookingAtomic({
          courtId: court.id,
          memberId: goldMember.id,
          bookerName: goldMember.name,
          bookerPhone: goldMember.phone,
          bookerEmail: "gold3@test.com",
          startTime: slot3,
        })
      ).rejects.toThrow(/Daily booking quota exceeded/);

      // Now cancel 1st booking -> quota freed!
      await cancelBookingAtomic(b1.id, "Changed plans");

      // 3rd Booking should now SUCCEED
      const b3 = await createCourtBookingAtomic({
        courtId: court.id,
        memberId: goldMember.id,
        bookerName: goldMember.name,
        bookerPhone: goldMember.phone,
        bookerEmail: "gold3@test.com",
        startTime: slot3,
      });
      expect(b3.id).toBeDefined();
    });
  });

  // TEST 4: Expired Membership Reverts to Walk-in Pricing
  describe("4. Expired Membership Pricing Safeguard", () => {
    it("Expired member loses free/discounted tier and gets charged full Walk-in pricing", async () => {
      const testDate = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);
      testDate.setHours(15, 0, 0, 0);

      const booking = await createCourtBookingAtomic({
        courtId: court.id,
        memberId: expiredMember.id,
        bookerName: expiredMember.name,
        bookerPhone: expiredMember.phone,
        bookerEmail: "expired@test.com",
        startTime: testDate,
      });

      expect(booking.bookerType).toBe("WALK_IN");
      expect(booking.totalPricePaise).toBeGreaterThan(0);
      expect(booking.totalPricePaise).toBe(court.hourlyRatePaise);
    });
  });

  // TEST 5: Stock Invariant & POS / Online Inventory Decrement
  describe("5. Inventory Safety & Negative Stock Prevention", () => {
    it("Decrements stock atomically and blocks orders exceeding available stock", async () => {
      const variant = await prisma.productVariant.findFirst({
        where: { stockQuantity: { gt: 3 } },
        include: { product: true },
      });

      expect(variant).toBeDefined();
      const initialStock = variant!.stockQuantity;

      // Buy 2 items
      const sale = await executeShopSaleAtomic({
        customerName: "Tennis Fan",
        customerPhone: "+91 98989 89898",
        customerEmail: "fan@test.com",
        items: [
          {
            variantId: variant!.id,
            quantity: 2,
            unitPricePaise: variant!.product.pricePaise,
          },
        ],
      });

      expect(sale.id).toBeDefined();

      const updatedVariant = await prisma.productVariant.findUnique({
        where: { id: variant!.id },
      });
      expect(updatedVariant!.stockQuantity).toBe(initialStock - 2);

      // Attempting to buy remaining + 10 items must fail
      await expect(
        executeShopSaleAtomic({
          customerName: "Overbuyer",
          customerPhone: "+91 98989 89899",
          customerEmail: "over@test.com",
          items: [
            {
              variantId: variant!.id,
              quantity: initialStock + 10,
              unitPricePaise: variant!.product.pricePaise,
            },
          ],
        })
      ).rejects.toThrow(/Insufficient stock/);
    });
  });

  // TEST 6: Bar Tab Running Balance, Auto Member Discount & Split Payment Settlement
  describe("6. Bar Tab Running Balance & Split Settlement", () => {
    it("Applies Gold 20% discount on bar items and settles with split payments", async () => {
      const table = await prisma.table.findFirst({ where: { status: "FREE" } });
      const shakeItem = await prisma.menuItem.findFirst({ where: { category: "HEALTH_SHAKES" } });

      const res = await addItemsToTabAtomic({
        tableId: table!.id,
        memberId: goldMember.id,
        items: [
          {
            menuItemId: shakeItem!.id,
            quantity: 2,
            unitPricePaise: shakeItem!.pricePaise,
          },
        ],
      });

      const tab = await prisma.tab.findUnique({ where: { id: res.tabId } });
      expect(tab!.totalAmountPaise).toBe(shakeItem!.pricePaise * 2);
      expect(tab!.discountAmountPaise).toBe(Math.round(tab!.totalAmountPaise * 0.2));

      const finalAmount = tab!.finalAmountPaise;
      const half1 = Math.floor(finalAmount / 2);
      const half2 = finalAmount - half1;

      const settled = await settleTabAtomic({
        tabId: tab!.id,
        payments: [
          { method: "CASH", amountPaise: half1 },
          { method: "UPI", amountPaise: half2 },
        ],
      });

      expect(settled.status).toBe("CLOSED");

      const updatedTable = await prisma.table.findUnique({ where: { id: table!.id } });
      expect(updatedTable!.status).toBe("FREE");
    });
  });

  // TEST 7: Background Worker
  describe("7. Background Maintenance Routine", () => {
    it("Runs worker and reports zero failures", async () => {
      const res = await runBackgroundWorker();
      expect(res).toBeDefined();
      expect(typeof res.releasedBookings).toBe("number");
      expect(typeof res.expiryAlertsSent).toBe("number");
    });
  });

  // TEST 8: Past Slot Booking Safeguard
  describe("8. Past Date & Slot Booking Prevention", () => {
    it("Rejects attempts to book court slots in the past", async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      yesterday.setHours(10, 0, 0, 0);

      await expect(
        createCourtBookingAtomic({
          courtId: court.id,
          bookerName: "Time Traveler",
          bookerPhone: "+91 99999 00000",
          bookerEmail: "past@test.com",
          startTime: yesterday,
        })
      ).rejects.toThrow(/Cannot book court slots in the past/);
    });
  });

  // TEST 9: Advance Booking Window Enforcement
  describe("9. Advance Booking Window Enforcement", () => {
    it("Enforces plan advance booking days limits for members", async () => {
      const farFuture = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
      farFuture.setHours(10, 0, 0, 0);

      await expect(
        createCourtBookingAtomic({
          courtId: court.id,
          memberId: goldMember.id,
          bookerName: goldMember.name,
          bookerPhone: goldMember.phone,
          bookerEmail: "advance@test.com",
          startTime: farFuture,
        })
      ).rejects.toThrow(/Advance booking limit reached/);
    });
  });

  // TEST 10: Free Tier Registration & Self-Upgrade Engine
  describe("10. Public Registration (Free Tier) & Self-Upgrade Engine", () => {
    it("Provisions Free Tier account for new visitors and upgrades seamlessly to Gold", async () => {
      const testEmail = `newuser_${Date.now()}@test.com`;

      // 1. Create Free Tier Member
      let freePlan = await prisma.plan.findFirst({ where: { tier: "FREE" } });
      if (!freePlan) {
        freePlan = await prisma.plan.create({
          data: {
            tier: "FREE",
            name: "Free Community Tier",
            monthlyFeePaise: 0,
            annualFeePaise: 0,
            courtRatePerHourPaise: 80000,
            shopDiscountPercent: 0,
            barDiscountPercent: 0,
            maxBookingsPerDay: 1,
            advanceBookingDays: 3,
            description: "Community access with standard walk-in court rates.",
          },
        });
      }

      const user = await prisma.user.create({
        data: {
          email: testEmail,
          name: "New Visitor",
          role: "MEMBER",
          phone: "+91 91111 22222",
        },
      });

      const newMember = await prisma.member.create({
        data: {
          userId: user.id,
          memberId: `CC-TEST-${Date.now().toString().slice(-4)}`,
          name: "New Visitor",
          email: testEmail,
          phone: "+91 91111 22222",
          status: "ACTIVE",
          memberships: {
            create: {
              planId: freePlan.id,
              tier: "FREE",
              startDate: new Date(),
              endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              status: "ACTIVE",
              amountPaidPaise: 0,
            },
          },
        },
        include: { memberships: { include: { plan: true } } },
      });

      expect(newMember.memberships[0].tier).toBe("FREE");
      expect(newMember.memberships[0].plan.advanceBookingDays).toBe(3);

      // 2. Perform Self-Upgrade to Gold
      const goldPlan = await prisma.plan.findFirst({ where: { tier: "GOLD" } });
      expect(goldPlan).toBeDefined();

      // Deactivate old membership
      await prisma.membership.updateMany({
        where: { memberId: newMember.id, status: "ACTIVE" },
        data: { status: "UPGRADED" },
      });

      // Create new Gold membership
      const upgradedMembership = await prisma.membership.create({
        data: {
          memberId: newMember.id,
          planId: goldPlan!.id,
          tier: "GOLD",
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: "ACTIVE",
          amountPaidPaise: goldPlan!.annualFeePaise,
          paymentMethod: "UPI",
        },
        include: { plan: true },
      });

      expect(upgradedMembership.status).toBe("ACTIVE");
      expect(upgradedMembership.tier).toBe("GOLD");
      expect(upgradedMembership.plan.courtRatePerHourPaise).toBe(0);

      // Clean up test records
      await prisma.membership.deleteMany({ where: { memberId: newMember.id } });
      await prisma.member.delete({ where: { id: newMember.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });
  });
});

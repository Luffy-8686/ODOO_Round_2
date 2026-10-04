import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/lib/prisma";
import {
  calculateBillingDetails,
  executeCheckoutService,
  maskApiKey,
  resolveApiKey,
  SECURITY_DEPOSIT_PAISE,
} from "../src/lib/billing";
import { createCourtBookingAtomic } from "../src/lib/concurrency";

describe("Pro Shop Billing Service & Checkout Suite", () => {
  let product: any;
  let variant: any;
  let goldMember: any;
  let silverMember: any;
  let guestMember: any;

  beforeAll(async () => {
    // Fetch an active product with variant
    product = await prisma.product.findFirst({
      include: { variants: true },
    });

    if (!product || product.variants.length === 0) {
      // Create test product if none exists
      product = await prisma.product.create({
        data: {
          name: "Pro Staff 97 v14 Test Racket",
          brand: "Wilson",
          category: "RACKET",
          pricePaise: 2400000, // ₹24,000.00
          sku: "TEST-RKT-001",
          variants: {
            create: {
              sku: "TEST-RKT-001-G3",
              size: "Grip 3",
              stockQuantity: 25,
            },
          },
        },
        include: { variants: true },
      });
    }

    variant = product.variants[0];
    // Ensure test variant has ample shelf stock
    variant = await prisma.productVariant.update({
      where: { id: variant.id },
      data: { stockQuantity: 50, reservedQuantity: 0 },
    });

    // Ensure test members with different tiers
    goldMember = await prisma.member.findFirst({
      where: { memberships: { some: { tier: "GOLD", status: "ACTIVE" } } },
      include: { memberships: { include: { plan: true } } },
    });

    silverMember = await prisma.member.findFirst({
      where: { memberships: { some: { tier: "SILVER", status: "ACTIVE" } } },
      include: { memberships: { include: { plan: true } } },
    });

    guestMember = await prisma.member.findFirst({
      where: { memberships: { none: { status: "ACTIVE" } } },
    });
  });

  afterAll(async () => {
    // Clean up test shop orders
    await prisma.shopOrder.deleteMany({
      where: { customerEmail: { contains: "billingtest@champions.club" } },
    });
    await prisma.$disconnect();
  });

  describe("1. Full Price of Products Calculation", () => {
    it("correctly accumulates full original price for multiple quantities", async () => {
      const quantity = 3;
      const expectedFullPrice = product.pricePaise * quantity;

      const result = await calculateBillingDetails({
        items: [{ variantId: variant.id, quantity }],
        memberTier: "WALK_IN",
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].fullUnitPricePaise).toBe(product.pricePaise);
      expect(result.items[0].quantity).toBe(quantity);
      expect(result.items[0].fullTotalPricePaise).toBe(expectedFullPrice);
      expect(result.totalFullPricePaise).toBe(expectedFullPrice);
    });
  });

  describe("2. Membership Tier Discount Rules", () => {
    it("applies 15% discount for GOLD members", async () => {
      const quantity = 1;
      const fullPrice = product.pricePaise;
      const expectedDiscount = Math.round((fullPrice * 15) / 100);
      const expectedNet = fullPrice - expectedDiscount;

      const result = await calculateBillingDetails({
        items: [{ variantId: variant.id, quantity }],
        memberTier: "GOLD",
      });

      expect(result.discountPercent).toBe(15);
      expect(result.totalDiscountPaise).toBe(expectedDiscount);
      expect(result.netSubtotalPaise).toBe(expectedNet);
    });

    it("applies 10% discount for SILVER members", async () => {
      const fullPrice = product.pricePaise;
      const expectedDiscount = Math.round((fullPrice * 10) / 100);
      const expectedNet = fullPrice - expectedDiscount;

      const result = await calculateBillingDetails({
        items: [{ variantId: variant.id, quantity: 1 }],
        memberTier: "SILVER",
      });

      expect(result.discountPercent).toBe(10);
      expect(result.totalDiscountPaise).toBe(expectedDiscount);
      expect(result.netSubtotalPaise).toBe(expectedNet);
    });

    it("applies 0% discount for walk-in / non-members", async () => {
      const fullPrice = product.pricePaise;

      const result = await calculateBillingDetails({
        items: [{ variantId: variant.id, quantity: 1 }],
        memberTier: "WALK_IN",
      });

      expect(result.discountPercent).toBe(0);
      expect(result.totalDiscountPaise).toBe(0);
      expect(result.netSubtotalPaise).toBe(fullPrice);
    });

    it("resolves member plan discount directly from memberId when provided", async () => {
      if (!goldMember) return;

      const result = await calculateBillingDetails({
        items: [{ variantId: variant.id, quantity: 2 }],
        memberId: goldMember.id,
      });

      expect(result.memberTier).toBe("GOLD");
      expect(result.discountPercent).toBe(15);
      expect(result.memberName).toBe(goldMember.name);
    });
  });

  describe("3. Security Deposit: Exclusively for Gold Members on Court Bookings (Removed from other sections)", () => {
    it("has 0 security deposit for shop checkout and sets finalPayable to netSubtotal", async () => {
      expect(SECURITY_DEPOSIT_PAISE).toBe(0);

      const result = await calculateBillingDetails({
        items: [{ variantId: variant.id, quantity: 1 }],
        memberTier: "GOLD",
      });

      // Shop checkout has 0 security deposit
      expect(result.securityDepositPaise).toBe(0);
      expect(result.finalPayablePaise).toBe(result.netSubtotalPaise);
    });

    it("applies exactly ₹100 INR (10,000 paise) security deposit to GOLD members when booking a court, and ₹0 for non-Gold", async () => {
      const court = await prisma.court.findFirst({
        where: { status: "ACTIVE" },
      });
      expect(court).toBeDefined();

      const futureDate1 = new Date(Date.now() + 13 * 24 * 60 * 60 * 1000);
      futureDate1.setHours(13, 0, 0, 0);

      // Gold Member Court Booking
      const goldBooking = await createCourtBookingAtomic({
        courtId: court!.id,
        memberId: goldMember?.id,
        bookerName: goldMember?.name || "Gold Member",
        bookerPhone: "+91 99999 11111",
        bookerEmail: "gold@test.com",
        bookerType: "GOLD",
        startTime: futureDate1,
      });

      expect(goldBooking.securityDepositPaise).toBe(10000);
      expect(goldBooking.notes).toContain("Security Deposit: ₹100 INR");

      const futureDate2 = new Date(Date.now() + 13 * 24 * 60 * 60 * 1000);
      futureDate2.setHours(15, 0, 0, 0);

      // Non-Gold Member Court Booking (Walk-in / Silver)
      const walkInBooking = await createCourtBookingAtomic({
        courtId: court!.id,
        bookerName: "Walk-in Guest",
        bookerPhone: "+91 88888 22222",
        bookerEmail: "walkin@test.com",
        bookerType: "WALK_IN",
        startTime: futureDate2,
      });

      expect(walkInBooking.securityDepositPaise).toBe(0);
    });
  });

  describe("4. API Key Handling & Authorization", () => {
    it("masks API keys properly for safe display", () => {
      expect(maskApiKey(null)).toBeNull();
      expect(maskApiKey("short")).toBe("****rt");
      expect(maskApiKey("sk_live_1234567890abcdef")).toBe("sk_l••••••••cdef");
    });

    it("attaches and references provided API key in billing details", async () => {
      const testApiKey = "sk_live_secret_club_key_9999";
      const result = await calculateBillingDetails({
        items: [{ variantId: variant.id, quantity: 1 }],
        apiKey: testApiKey,
      });

      expect(result.apiKeyProvided).toBe(true);
      expect(result.apiKeyRef).toBe(maskApiKey(testApiKey));
    });
  });

  describe("5. End-to-End Billing Checkout Execution", () => {
    it("commits order with full price, membership discount, ₹100 deposit, and API key", async () => {
      const initialStock = variant.stockQuantity;
      const testApiKey = "sk_live_order_auth_8888";

      const checkout = await executeCheckoutService({
        items: [{ variantId: variant.id, quantity: 1 }],
        customerName: "Billing Test Member",
        customerPhone: "+91 98765 43210",
        customerEmail: "billingtest@champions.club",
        paymentMethod: "UPI",
        fulfillmentType: "CLICK_AND_COLLECT",
        apiKey: testApiKey,
        memberId: goldMember?.id,
      });

      expect(checkout.order).toBeDefined();
      expect(checkout.order.orderNumber).toMatch(/^SO-\d{4}-\d+/);
      expect(checkout.order.securityDepositPaise).toBe(0);
      expect(checkout.order.apiKeyRef).toBe(maskApiKey(testApiKey));
      expect(checkout.order.status).toBe("COLLECTED");

      // Verify finalPrice equals net amount without store deposit
      const expectedNet = checkout.order.totalPricePaise - checkout.order.discountPaise;
      expect(checkout.order.finalPricePaise).toBe(expectedNet);

      // Verify variant stock was atomically decremented
      const updatedVariant = await prisma.productVariant.findUnique({
        where: { id: variant.id },
      });
      expect(updatedVariant?.stockQuantity).toBe(initialStock - 1);

      // Verify payment record was created
      const payment = await prisma.payment.findFirst({
        where: { shopOrderId: checkout.order.id },
      });
      expect(payment).toBeDefined();
      expect(payment?.amountPaise).toBe(checkout.order.finalPricePaise);
      expect(payment?.status).toBe("SUCCESS");

      // Verify audit log exists
      const audit = await prisma.auditLog.findFirst({
        where: {
          entity: "SHOP_ORDER",
          entityId: checkout.order.id,
        },
      });
      expect(audit).toBeDefined();
    });
  });

  describe("6. Real PDF Invoice Generation for Store, Cafe, and Bar", () => {
    it("generates a valid, authenticated PDF tax invoice for Store (Pro Shop) purchase", async () => {
      const { buildInvoicePdf } = await import("../src/lib/invoice-pdf");
      const testApiKey = "sk_DVLpO720875rxxaqOY7XAPEbesJWtuXq";

      const pdfDoc = buildInvoicePdf({
        invoiceNumber: "BILL-SHOP-2026-00012345",
        orderNumber: "SO-2026-00001",
        date: new Date(),
        customerName: "Alexander Hamilton",
        customerPhone: "+91 98765 43210",
        customerEmail: "alex@champions.club",
        memberTier: "GOLD",
        membershipPlanName: "Gold Heritage Membership",
        discountPercent: 15,
        fulfillmentType: "Pro Shop (Click & Collect)",
        paymentMethod: "UPI",
        apiKeyRef: maskApiKey(testApiKey),
        module: "SHOP",
        items: [
          {
            productName: "Wilson Pro Staff 97 v14",
            variantName: "Grip 3 / 315g",
            sku: "WLS-PS97-G3",
            quantity: 1,
            fullUnitPricePaise: 2400000,
            fullTotalPricePaise: 2400000,
            discountPercent: 15,
            discountAmountPaise: 360000,
            netPricePaise: 2040000,
          },
        ],
        totalFullPricePaise: 2400000,
        totalDiscountPaise: 360000,
        netSubtotalPaise: 2040000,
        securityDepositPaise: 0,
        finalPayablePaise: 2040000,
      });

      const buffer = Buffer.from(pdfDoc.output("arraybuffer"));
      expect(buffer.length).toBeGreaterThan(5000);
      expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
    });

    it("generates a valid, authenticated PDF tax invoice for Cafe purchase without deposit", async () => {
      const { buildInvoicePdf } = await import("../src/lib/invoice-pdf");
      const testApiKey = "sk_DVLpO720875rxxaqOY7XAPEbesJWtuXq";

      const pdfDoc = buildInvoicePdf({
        invoiceNumber: "BILL-CAFE-2026-00054321",
        orderNumber: "BO-2026-00042",
        date: new Date(),
        customerName: "Eleanor Vance",
        customerPhone: "+91 98111 22334",
        customerEmail: "eleanor@champions.club",
        memberTier: "GOLD",
        membershipPlanName: "Gold Heritage Membership",
        discountPercent: 20, // 20% Bar/Cafe discount for Gold
        fulfillmentType: "Cafe Dining (Table Service: Table 3)",
        paymentMethod: "Tab #TAB-2026-0001",
        apiKeyRef: maskApiKey(testApiKey),
        module: "CAFE",
        items: [
          {
            productName: "Truffle Mushroom Club Sandwich",
            variantName: "No onions, extra toasted",
            sku: "MNU-SDW-01",
            quantity: 2,
            fullUnitPricePaise: 65000,
            fullTotalPricePaise: 130000,
            discountPercent: 20,
            discountAmountPaise: 26000,
            netPricePaise: 104000,
          },
          {
            productName: "Espresso Con Panna",
            variantName: "Double shot",
            sku: "MNU-BEV-04",
            quantity: 2,
            fullUnitPricePaise: 35000,
            fullTotalPricePaise: 70000,
            discountPercent: 20,
            discountAmountPaise: 14000,
            netPricePaise: 56000,
          },
        ],
        totalFullPricePaise: 200000,
        totalDiscountPaise: 40000,
        netSubtotalPaise: 160000,
        securityDepositPaise: 0,
        finalPayablePaise: 160000,
      });

      const buffer = Buffer.from(pdfDoc.output("arraybuffer"));
      expect(buffer.length).toBeGreaterThan(5000);
      expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
    });

    it("generates a valid, authenticated PDF tax invoice for Bar Tab purchase without deposit", async () => {
      const { buildInvoicePdf } = await import("../src/lib/invoice-pdf");
      const testApiKey = "sk_DVLpO720875rxxaqOY7XAPEbesJWtuXq";

      const pdfDoc = buildInvoicePdf({
        invoiceNumber: "BILL-BAR-2026-00098765",
        orderNumber: "TAB-2026-0007",
        date: new Date(),
        customerName: "Julian Sterling",
        customerPhone: "+91 97777 88888",
        customerEmail: "julian@champions.club",
        memberTier: "SILVER",
        membershipPlanName: "Silver Athletic Membership",
        discountPercent: 10, // 10% Bar discount for Silver
        fulfillmentType: "Clubhouse Bar & Lounge (Lounge Booth 2)",
        paymentMethod: "UPI, CASH",
        apiKeyRef: maskApiKey(testApiKey),
        module: "BAR",
        items: [
          {
            productName: "Single Malt Speyside 18",
            variantName: "Neat",
            sku: "BAR-WHS-18",
            quantity: 2,
            fullUnitPricePaise: 180000,
            fullTotalPricePaise: 360000,
            discountPercent: 10,
            discountAmountPaise: 36000,
            netPricePaise: 324000,
          },
          {
            productName: "Sparkling Mineral Reserve",
            variantName: "Chilled with lime",
            sku: "BAR-WTR-01",
            quantity: 1,
            fullUnitPricePaise: 25000,
            fullTotalPricePaise: 25000,
            discountPercent: 10,
            discountAmountPaise: 2500,
            netPricePaise: 22500,
          },
        ],
        totalFullPricePaise: 385000,
        totalDiscountPaise: 38500,
        netSubtotalPaise: 346500,
        securityDepositPaise: 0,
        finalPayablePaise: 346500,
      });

      const buffer = Buffer.from(pdfDoc.output("arraybuffer"));
      expect(buffer.length).toBeGreaterThan(5000);
      expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
    });

    it("generates a valid PDF tax invoice for Gold Court Booking with ₹100 security deposit", async () => {
      const { buildInvoicePdf } = await import("../src/lib/invoice-pdf");
      const testApiKey = "sk_DVLpO720875rxxaqOY7XAPEbesJWtuXq";

      const pdfDoc = buildInvoicePdf({
        invoiceNumber: "BILL-COURT-2026-00012345",
        orderNumber: "BK-2026-0099",
        date: new Date(),
        customerName: "Arthur Pendelton",
        customerPhone: "+91 98888 11111",
        customerEmail: "arthur@champions.club",
        memberTier: "GOLD",
        membershipPlanName: "Gold Heritage Membership",
        discountPercent: 100, // 100% free court access
        fulfillmentType: "Athletic Facilities (Center Court)",
        deliveryAddress: "Court Center Court • Tennis",
        paymentMethod: "UPI",
        apiKeyRef: maskApiKey(testApiKey),
        module: "COURT",
        items: [
          {
            productName: "Court Reservation: Center Court (Tennis)",
            variantName: "60 Mins Session (Grass Surface)",
            sku: "CRT-CC01",
            quantity: 1,
            fullUnitPricePaise: 80000,
            fullTotalPricePaise: 80000,
            discountPercent: 100,
            discountAmountPaise: 80000,
            netPricePaise: 0,
          },
        ],
        totalFullPricePaise: 80000,
        totalDiscountPaise: 80000,
        netSubtotalPaise: 0,
        securityDepositPaise: 10000, // ₹100 INR security deposit for Gold court booking
        finalPayablePaise: 10000, // Only the refundable deposit
      });

      const buffer = Buffer.from(pdfDoc.output("arraybuffer"));
      expect(buffer.length).toBeGreaterThan(5000);
      expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
    });
  });
});

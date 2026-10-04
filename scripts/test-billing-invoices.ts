import { prisma } from "../src/lib/prisma";
import { executeCheckoutService, calculateBillingDetails, maskApiKey } from "../src/lib/billing";
import { formatINR } from "../src/lib/formatters";

async function main() {
  console.log("==================================================================");
  console.log("🏛️  THE CHAMPIONS CLUB - BILLING SERVICE & INVOICE GENERATOR");
  console.log("==================================================================");

  const apiKey = process.env.BILLING_API_KEY || "sk_DVLpO720875rxxaqOY7XAPEbesJWtuXq";
  console.log(`Active Billing API Key: ${maskApiKey(apiKey)} (Length: ${apiKey.length} chars)`);
  console.log(`Mandatory Security Deposit: ₹100.00 INR (10,000 paise)\n`);

  // 1. Fetch available products with variants
  const products = await prisma.product.findMany({
    include: { variants: true },
    take: 10,
  });

  if (products.length === 0) {
    throw new Error("No products found in database.");
  }

  // Ensure stock is available for testing
  for (const prod of products) {
    for (const v of prod.variants) {
      if (v.stockQuantity < 50) {
        await prisma.productVariant.update({
          where: { id: v.id },
          data: { stockQuantity: 100, reservedQuantity: 0 },
        });
      }
    }
  }

  // 2. Fetch members of various tiers
  const goldMember = await prisma.member.findFirst({
    where: { memberships: { some: { tier: "GOLD", status: "ACTIVE" } } },
    include: { memberships: { include: { plan: true } } },
  });

  const silverMember = await prisma.member.findFirst({
    where: { memberships: { some: { tier: "SILVER", status: "ACTIVE" } } },
    include: { memberships: { include: { plan: true } } },
  });

  const juniorMember = await prisma.member.findFirst({
    where: { memberships: { some: { tier: "JUNIOR", status: "ACTIVE" } } },
    include: { memberships: { include: { plan: true } } },
  });

  // 5 Scenarios
  const testScenarios = [
    {
      title: "Invoice #1: Gold Tier Member — High-Performance Racquet & Shuttles",
      member: goldMember,
      customerName: goldMember?.name || "Vikramaditya Singhania",
      customerPhone: goldMember?.phone || "+91 98111 22334",
      customerEmail: goldMember?.email || "vikram@singhaniagroup.com",
      fulfillmentType: "CLICK_AND_COLLECT" as const,
      paymentMethod: "UPI",
      items: [
        {
          variantId: products[0].variants[0].id,
          quantity: 1,
          unitPricePaise: products[0].pricePaise,
        },
        ...(products.length > 1
          ? [
              {
                variantId: products[1].variants[0].id,
                quantity: 2,
                unitPricePaise: products[1].pricePaise,
              },
            ]
          : []),
      ],
    },
    {
      title: "Invoice #2: Silver Tier Member — Footwear & Performance Apparel",
      member: silverMember,
      customerName: silverMember?.name || "Ananya Deshmukh",
      customerPhone: silverMember?.phone || "+91 98222 33445",
      customerEmail: silverMember?.email || "ananya.deshmukh@silvermember.org",
      fulfillmentType: "HOME_DELIVERY" as const,
      deliveryAddress: "Penthouse 14B, Malabar Hill, Mumbai",
      paymentMethod: "CARD",
      items: [
        {
          variantId: (products[2] || products[0]).variants[0].id,
          quantity: 1,
          unitPricePaise: (products[2] || products[0]).pricePaise,
        },
      ],
    },
    {
      title: "Invoice #3: Junior Academy Player — Junior Racquet & Match Balls",
      member: juniorMember,
      customerName: juniorMember?.name || "Rohan Varma (Junior Academy)",
      customerPhone: juniorMember?.phone || "+91 98333 44556",
      customerEmail: juniorMember?.email || "rohan.varma@junioracademy.club",
      fulfillmentType: "CLICK_AND_COLLECT" as const,
      paymentMethod: "MEMBER_TAB",
      items: [
        {
          variantId: (products[3] || products[0]).variants[0].id,
          quantity: 2,
          unitPricePaise: (products[3] || products[0]).pricePaise,
        },
      ],
    },
    {
      title: "Invoice #4: Walk-in Non-Member Guest — Standard Tariff Match Essentials",
      member: null,
      customerName: "Siddharth Malhotra (Guest)",
      customerPhone: "+91 98444 55667",
      customerEmail: "siddharth.m@guestmail.com",
      fulfillmentType: "CLICK_AND_COLLECT" as const,
      paymentMethod: "CASH",
      items: [
        {
          variantId: products[0].variants[0].id,
          quantity: 1,
          unitPricePaise: products[0].pricePaise,
        },
      ],
    },
    {
      title: "Invoice #5: Gold Member Bulk Tournament Procurement",
      member: goldMember,
      customerName: goldMember?.name || "Vikramaditya Singhania",
      customerPhone: goldMember?.phone || "+91 98111 22334",
      customerEmail: goldMember?.email || "vikram@singhaniagroup.com",
      fulfillmentType: "CLICK_AND_COLLECT" as const,
      paymentMethod: "UPI",
      items: [
        {
          variantId: products[0].variants[0].id,
          quantity: 3,
          unitPricePaise: products[0].pricePaise,
        },
        ...(products.length > 1
          ? [
              {
                variantId: products[1].variants[0].id,
                quantity: 4,
                unitPricePaise: products[1].pricePaise,
              },
            ]
          : []),
      ],
    },
  ];

  const results = [];

  for (let i = 0; i < testScenarios.length; i++) {
    const sc = testScenarios[i];
    console.log(`\n------------------------------------------------------------------`);
    console.log(`🧾 GENERATING ${sc.title}`);
    console.log(`------------------------------------------------------------------`);

    const checkout = await executeCheckoutService({
      items: sc.items,
      memberId: sc.member?.id || null,
      customerName: sc.customerName,
      customerPhone: sc.customerPhone,
      customerEmail: sc.customerEmail,
      fulfillmentType: sc.fulfillmentType,
      deliveryAddress: sc.deliveryAddress,
      paymentMethod: sc.paymentMethod,
      apiKey: apiKey,
    });

    const b = checkout.billing;
    const ord = checkout.order;

    console.log(`Order Number:      ${ord.orderNumber}`);
    console.log(`Invoice Number:    ${b.invoiceNumber}`);
    console.log(`Customer:          ${ord.customerName} (${b.memberTier} Tier — ${b.discountPercent}% Privilege)`);
    console.log(`Fulfillment:       ${ord.fulfillmentType}`);
    console.log(`Payment Method:    ${ord.paymentMethod}`);
    console.log(`API Key Ref:       ${b.apiKeyRef} [AUTHORIZED]`);
    console.log(`\n--- Line Items Breakdown (Full Price & Discount) ---`);

    for (const item of b.items) {
      console.log(
        `  • ${item.productName} (${item.variantName}) x ${item.quantity}: Full Unit ${formatINR(item.fullUnitPricePaise)} | Full Subtotal: ${formatINR(item.fullTotalPricePaise)} | Disc (-${item.discountPercent}%): -${formatINR(item.discountAmountPaise)} | Net: ${formatINR(item.netPricePaise)}`
      );
    }

    console.log(`\n--- Billing Settlement Summary ---`);
    console.log(`Full Equipment Subtotal:  ${formatINR(b.totalFullPricePaise)}`);
    console.log(`Membership Discount:     -${formatINR(b.totalDiscountPaise)} (${b.discountPercent}%)`);
    console.log(`Equipment Net Subtotal:   ${formatINR(b.netSubtotalPaise)}`);
    console.log(`Security Deposit:        +${formatINR(b.securityDepositPaise)} (100 INR Mandatory)`);
    console.log(`FINAL PAYABLE TOTAL:      ${formatINR(b.finalPayablePaise)}`);

    results.push({
      scenarioIndex: i + 1,
      orderNumber: ord.orderNumber,
      invoiceNumber: b.invoiceNumber,
      customer: ord.customerName,
      tier: b.memberTier,
      fullPrice: formatINR(b.totalFullPricePaise),
      discount: `-${formatINR(b.totalDiscountPaise)} (${b.discountPercent}%)`,
      securityDeposit: `+${formatINR(b.securityDepositPaise)}`,
      finalTotal: formatINR(b.finalPayablePaise),
      apiKeyRef: b.apiKeyRef,
    });
  }

  console.log("\n==================================================================");
  console.log("✅ SUMMARY OF 5 TEST INVOICES GENERATED WITH API KEY & ₹100 DEPOSIT");
  console.log("==================================================================");
  console.table(results);
}

main()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

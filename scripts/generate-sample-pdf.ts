import { prisma } from "../src/lib/prisma";
import { buildInvoicePdf } from "../src/lib/invoice-pdf";
import fs from "fs";
import path from "path";

async function run() {
  const order = await prisma.shopOrder.findFirst({
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    console.error("No shop order found");
    return;
  }

  const doc = buildInvoicePdf({
    invoiceNumber: "BILL-2026-706481998",
    orderNumber: order.orderNumber,
    date: order.createdAt,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    memberTier: "GOLD",
    discountPercent: 15,
    fulfillmentType: order.fulfillmentType,
    deliveryAddress: order.deliveryAddress,
    paymentMethod: order.paymentMethod || "UPI",
    apiKeyRef: order.apiKeyRef || "sk_D••••••••tuXq",
    items: order.items.map((i) => ({
      productName: i.variant?.product?.name || "Wilson Pro Staff 97 V14",
      variantName: i.variant?.size || "Grip 2 (4 1/4)",
      sku: i.variant?.sku,
      quantity: i.quantity,
      fullUnitPricePaise: i.unitPricePaise,
      fullTotalPricePaise: i.totalPricePaise,
      discountPercent: 15,
      discountAmountPaise: Math.round(i.totalPricePaise * 0.15),
      netPricePaise: i.totalPricePaise - Math.round(i.totalPricePaise * 0.15),
    })),
    totalFullPricePaise: order.totalPricePaise,
    totalDiscountPaise: order.discountPaise,
    netSubtotalPaise: order.totalPricePaise - order.discountPaise,
    securityDepositPaise: order.securityDepositPaise || 10000,
    finalPayablePaise: order.finalPricePaise,
  });

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  const outPath = path.join(process.cwd(), "sample-invoice.pdf");
  fs.writeFileSync(outPath, pdfBuffer);

  console.log(`[SUCCESS] Generated genuine PDF Tax Invoice at: ${outPath} (${pdfBuffer.length} bytes)`);
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

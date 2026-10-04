import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildInvoicePdf, InvoicePdfData } from "@/lib/invoice-pdf";
import { calculateShopDiscount, calculateBarDiscount } from "@/lib/pricing";
import { maskApiKey } from "@/lib/billing";

function createPdfResponse(doc: any, invoiceNumber: string): NextResponse {
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  const safeFilename = invoiceNumber.endsWith(".pdf") ? invoiceNumber : `${invoiceNumber}.pdf`;

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`,
      "Content-Length": pdfBuffer.byteLength.toString(),
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const targetId = params.id;
    const defaultApiKey = process.env.BILLING_API_KEY || process.env.NEXT_PUBLIC_BILLING_API_KEY;

    // =========================================================================
    // 1. PRO SHOP ORDER (Store Purchase)
    // =========================================================================
    const shopOrder = await prisma.shopOrder.findFirst({
      where: {
        OR: [{ id: targetId }, { orderNumber: targetId }],
      },
      include: {
        items: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
        member: {
          include: {
            memberships: {
              where: { status: "ACTIVE" },
              include: { plan: true },
              take: 1,
            },
          },
        },
        payments: true,
      },
    });

    if (shopOrder) {
      const memberTier = shopOrder.member?.memberships?.[0]?.tier || "WALK_IN";
      const customDiscount = shopOrder.member?.memberships?.[0]?.plan?.shopDiscountPercent;
      const discountPercent =
        customDiscount !== undefined && customDiscount !== null
          ? customDiscount
          : calculateShopDiscount(memberTier);

      const invoiceNumber = `BILL-SHOP-${new Date(shopOrder.createdAt).getFullYear()}-${Math.abs(
        shopOrder.id.split("").reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
      ).toString().slice(0, 8)}`;

      const pdfData: InvoicePdfData = {
        invoiceNumber,
        orderNumber: shopOrder.orderNumber,
        date: shopOrder.createdAt,
        customerName: shopOrder.customerName,
        customerPhone: shopOrder.customerPhone,
        customerEmail: shopOrder.customerEmail,
        memberTier,
        membershipPlanName: shopOrder.member?.memberships?.[0]?.plan?.name || null,
        discountPercent,
        fulfillmentType: `Pro Shop (${shopOrder.fulfillmentType.replace("_", " ")})`,
        deliveryAddress: shopOrder.deliveryAddress,
        paymentMethod: shopOrder.paymentMethod || "UPI",
        apiKeyRef: shopOrder.apiKeyRef || maskApiKey(defaultApiKey),
        module: "SHOP",
        items: shopOrder.items.map((i) => {
          const fullUnitPricePaise = i.unitPricePaise;
          const fullTotalPricePaise = i.totalPricePaise;
          const discountAmountPaise = Math.round((fullTotalPricePaise * discountPercent) / 100);
          const netPricePaise = fullTotalPricePaise - discountAmountPaise;

          return {
            productName: i.variant?.product?.name || "Equipment Item",
            variantName: i.variant?.size || i.variant?.color || "Standard",
            sku: i.variant?.sku,
            quantity: i.quantity,
            fullUnitPricePaise,
            fullTotalPricePaise,
            discountPercent,
            discountAmountPaise,
            netPricePaise,
          };
        }),
        totalFullPricePaise: shopOrder.totalPricePaise,
        totalDiscountPaise: shopOrder.discountPaise,
        netSubtotalPaise: shopOrder.totalPricePaise - shopOrder.discountPaise,
        securityDepositPaise: shopOrder.securityDepositPaise || 0,
        finalPayablePaise: shopOrder.finalPricePaise,
      };

      const doc = buildInvoicePdf(pdfData);
      return createPdfResponse(doc, invoiceNumber);
    }

    // =========================================================================
    // 2. BAR ORDER (Cafe & Bar Purchase)
    // =========================================================================
    const barOrder = await prisma.barOrder.findFirst({
      where: {
        OR: [{ id: targetId }, { orderNumber: targetId }],
      },
      include: {
        items: {
          include: { menuItem: true },
        },
        tab: {
          include: {
            member: {
              include: {
                memberships: {
                  where: { status: "ACTIVE" },
                  include: { plan: true },
                  take: 1,
                },
              },
            },
            table: true,
          },
        },
        table: true,
      },
    });

    if (barOrder) {
      const member = barOrder.tab?.member;
      const memberTier = member?.memberships?.[0]?.tier || "WALK_IN";
      const customDiscount = member?.memberships?.[0]?.plan?.barDiscountPercent;
      const discountPercent =
        customDiscount !== undefined && customDiscount !== null
          ? customDiscount
          : calculateBarDiscount(memberTier);

      const invoiceNumber = `BILL-CAFE-${new Date(barOrder.createdAt).getFullYear()}-${Math.abs(
        barOrder.id.split("").reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
      ).toString().slice(0, 8)}`;

      let totalFullPricePaise = 0;
      let totalDiscountPaise = 0;

      const items = barOrder.items.map((i) => {
        const fullUnitPricePaise = i.unitPricePaise;
        const fullTotalPricePaise = i.totalPricePaise;
        const discountAmountPaise = Math.round((fullTotalPricePaise * discountPercent) / 100);
        const netPricePaise = fullTotalPricePaise - discountAmountPaise;

        totalFullPricePaise += fullTotalPricePaise;
        totalDiscountPaise += discountAmountPaise;

        return {
          productName: i.menuItem?.name || "Cafe Item",
          variantName: i.notes || i.menuItem?.category?.replace("_", " ") || "Serving",
          sku: `MNU-${i.menuItemId.slice(-4).toUpperCase()}`,
          quantity: i.quantity,
          fullUnitPricePaise,
          fullTotalPricePaise,
          discountPercent,
          discountAmountPaise,
          netPricePaise,
        };
      });

      const netSubtotalPaise = totalFullPricePaise - totalDiscountPaise;
      const securityDepositPaise = 0; // Removed from Cafe
      const finalPayablePaise = netSubtotalPaise;

      const tableName = barOrder.table?.name || barOrder.tab?.table?.name;
      const fulfillmentType = tableName ? `Table Service (${tableName})` : "Counter Pick-up";

      const pdfData: InvoicePdfData = {
        invoiceNumber,
        orderNumber: barOrder.orderNumber,
        date: barOrder.createdAt,
        customerName: member?.name || barOrder.tab?.guestName || "Clubhouse Guest",
        customerPhone: member?.phone || barOrder.tab?.guestPhone,
        customerEmail: member?.email,
        memberTier,
        membershipPlanName: member?.memberships?.[0]?.plan?.name || null,
        discountPercent,
        fulfillmentType: `Cafe Dining (${fulfillmentType})`,
        deliveryAddress: tableName ? `Clubhouse Lounge — ${tableName}` : "Dining Bar Counter",
        paymentMethod: barOrder.tab ? `Tab #${barOrder.tab.tabNumber}` : "UPI Digital",
        apiKeyRef: maskApiKey(defaultApiKey),
        module: "CAFE",
        items,
        totalFullPricePaise,
        totalDiscountPaise,
        netSubtotalPaise,
        securityDepositPaise,
        finalPayablePaise,
      };

      const doc = buildInvoicePdf(pdfData);
      return createPdfResponse(doc, invoiceNumber);
    }

    // =========================================================================
    // 3. BAR TAB (Consolidated Cafe & Bar Tab Settlement)
    // =========================================================================
    const tab = await prisma.tab.findFirst({
      where: {
        OR: [{ id: targetId }, { tabNumber: targetId }],
      },
      include: {
        orders: {
          where: { status: { not: "CANCELLED" } },
          include: {
            items: {
              include: { menuItem: true },
            },
          },
        },
        member: {
          include: {
            memberships: {
              where: { status: "ACTIVE" },
              include: { plan: true },
              take: 1,
            },
          },
        },
        table: true,
        payments: true,
      },
    });

    if (tab) {
      const member = tab.member;
      const memberTier = member?.memberships?.[0]?.tier || "WALK_IN";
      const customDiscount = member?.memberships?.[0]?.plan?.barDiscountPercent;
      const discountPercent =
        customDiscount !== undefined && customDiscount !== null
          ? customDiscount
          : calculateBarDiscount(memberTier);

      const invoiceNumber = `BILL-BAR-${new Date(tab.openedAt).getFullYear()}-${Math.abs(
        tab.id.split("").reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
      ).toString().slice(0, 8)}`;

      // Aggregate all items across all orders on this tab
      const itemsMap = new Map<string, any>();
      for (const order of tab.orders) {
        for (const item of order.items) {
          const key = item.menuItemId;
          if (itemsMap.has(key)) {
            const existing = itemsMap.get(key);
            existing.quantity += item.quantity;
            existing.fullTotalPricePaise += item.totalPricePaise;
            existing.discountAmountPaise += Math.round((item.totalPricePaise * discountPercent) / 100);
            existing.netPricePaise = existing.fullTotalPricePaise - existing.discountAmountPaise;
          } else {
            const fullUnitPricePaise = item.unitPricePaise;
            const fullTotalPricePaise = item.totalPricePaise;
            const discountAmountPaise = Math.round((fullTotalPricePaise * discountPercent) / 100);
            const netPricePaise = fullTotalPricePaise - discountAmountPaise;

            itemsMap.set(key, {
              productName: item.menuItem?.name || "Bar Item",
              variantName: item.menuItem?.category?.replace("_", " ") || "F&B",
              sku: `TAB-${item.menuItemId.slice(-4).toUpperCase()}`,
              quantity: item.quantity,
              fullUnitPricePaise,
              fullTotalPricePaise,
              discountPercent,
              discountAmountPaise,
              netPricePaise,
            });
          }
        }
      }

      const items = Array.from(itemsMap.values());
      const totalFullPricePaise = tab.totalAmountPaise || items.reduce((s, i) => s + i.fullTotalPricePaise, 0);
      const totalDiscountPaise = tab.discountAmountPaise || items.reduce((s, i) => s + i.discountAmountPaise, 0);
      const netSubtotalPaise = tab.finalAmountPaise || totalFullPricePaise - totalDiscountPaise;
      const securityDepositPaise = 0; // Removed from Bar
      const finalPayablePaise = netSubtotalPaise;

      const pdfData: InvoicePdfData = {
        invoiceNumber,
        orderNumber: tab.tabNumber,
        date: tab.closedAt || tab.openedAt,
        customerName: member?.name || tab.guestName || "Clubhouse Guest",
        customerPhone: member?.phone || tab.guestPhone,
        customerEmail: member?.email,
        memberTier,
        membershipPlanName: member?.memberships?.[0]?.plan?.name || null,
        discountPercent,
        fulfillmentType: `Clubhouse Bar & Lounge (${tab.table?.name || "Main Lounge"})`,
        deliveryAddress: tab.table?.name ? `Table ${tab.table.tableNumber} (${tab.table.name})` : "Bar Counter",
        paymentMethod: tab.payments.map((p) => p.method).join(", ") || (tab.status === "CLOSED" ? "PAID" : "OPEN TAB"),
        apiKeyRef: maskApiKey(defaultApiKey),
        module: "BAR",
        items,
        totalFullPricePaise,
        totalDiscountPaise,
        netSubtotalPaise,
        securityDepositPaise,
        finalPayablePaise,
      };

      const doc = buildInvoicePdf(pdfData);
      return createPdfResponse(doc, invoiceNumber);
    }

    // =========================================================================
    // 4. COURT BOOKING (Athletic Facilities & Racquet Courts)
    // =========================================================================
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [{ id: targetId }, { bookingNumber: targetId }],
      },
      include: {
        court: { include: { sport: true } },
        member: {
          include: {
            memberships: {
              where: { status: "ACTIVE" },
              include: { plan: true },
              take: 1,
            },
          },
        },
        payments: true,
      },
    });

    if (booking) {
      const isGold = booking.bookerType === "GOLD" || booking.member?.memberships?.[0]?.tier === "GOLD";
      const memberTier = booking.member?.memberships?.[0]?.tier || booking.bookerType || "WALK_IN";
      const discountPercent = isGold ? 100 : (memberTier === "SILVER" ? 50 : (memberTier === "JUNIOR" ? 60 : 0));

      const invoiceNumber = `BILL-COURT-${new Date(booking.startTime).getFullYear()}-${Math.abs(
        booking.id.split("").reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
      ).toString().slice(0, 8)}`;

      const baseRatePaise = Math.round(booking.court.hourlyRatePaise * (booking.durationMinutes / 60));
      const totalFullPricePaise = baseRatePaise;
      const totalDiscountPaise = Math.round((totalFullPricePaise * discountPercent) / 100);
      const netSubtotalPaise = totalFullPricePaise - totalDiscountPaise;
      // Fixed ₹100 INR security deposit exclusively for Gold members on court booking; 0 for others
      const securityDepositPaise = isGold ? 10000 : (booking.securityDepositPaise || 0);
      const finalPayablePaise = netSubtotalPaise + securityDepositPaise;

      const items = [{
        productName: `Court Reservation: ${booking.court.name} (${booking.court.sport.name})`,
        variantName: `${booking.durationMinutes} Mins Session (${booking.court.surfaceType} Surface)`,
        sku: `CRT-${booking.courtId.slice(-4).toUpperCase()}`,
        quantity: 1,
        fullUnitPricePaise: totalFullPricePaise,
        fullTotalPricePaise: totalFullPricePaise,
        discountPercent,
        discountAmountPaise: totalDiscountPaise,
        netPricePaise: netSubtotalPaise,
      }];

      const pdfData: InvoicePdfData = {
        invoiceNumber,
        orderNumber: booking.bookingNumber,
        date: booking.createdAt,
        customerName: booking.bookerName,
        customerPhone: booking.bookerPhone,
        customerEmail: booking.bookerEmail,
        memberTier,
        membershipPlanName: booking.member?.memberships?.[0]?.plan?.name || null,
        discountPercent,
        fulfillmentType: `Athletic Facilities (${booking.court.name})`,
        deliveryAddress: `Court ${booking.court.name} • ${booking.court.sport.name}`,
        paymentMethod: booking.paymentMethod || (isGold ? "COMPLIMENTARY_GOLD" : "UPI"),
        apiKeyRef: maskApiKey(defaultApiKey),
        module: "COURT",
        items,
        totalFullPricePaise,
        totalDiscountPaise,
        netSubtotalPaise,
        securityDepositPaise,
        finalPayablePaise,
      };

      const doc = buildInvoicePdf(pdfData);
      return createPdfResponse(doc, invoiceNumber);
    }

    return NextResponse.json({ error: "Purchase record, order, tab, or court booking invoice not found" }, { status: 404 });
  } catch (error: any) {
    console.error("PDF Invoice generation failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

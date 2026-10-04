import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateShopDiscount, calculateBarDiscount } from "@/lib/pricing";
import { maskApiKey } from "@/lib/billing";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const targetId = params.id;
    const defaultApiKey = process.env.BILLING_API_KEY || process.env.NEXT_PUBLIC_BILLING_API_KEY;

    // 1. Check Pro Shop Order (Store Purchase)
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

      const items = shopOrder.items.map((i) => {
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
      });

      return NextResponse.json({
        success: true,
        module: "SHOP",
        invoice: {
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
          items,
          totalFullPricePaise: shopOrder.totalPricePaise,
          totalDiscountPaise: shopOrder.discountPaise,
          netSubtotalPaise: shopOrder.totalPricePaise - shopOrder.discountPaise,
          securityDepositPaise: shopOrder.securityDepositPaise || 0,
          finalPayablePaise: shopOrder.finalPricePaise,
        },
        pdfUrl: `/api/billing/invoice/${shopOrder.id}/pdf`,
      });
    }

    // 2. Check Bar Order (Cafe Purchase)
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

      return NextResponse.json({
        success: true,
        module: "CAFE",
        invoice: {
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
          items,
          totalFullPricePaise,
          totalDiscountPaise,
          netSubtotalPaise,
          securityDepositPaise,
          finalPayablePaise,
        },
        pdfUrl: `/api/billing/invoice/${barOrder.id}/pdf`,
      });
    }

    // 3. Check Tab (Bar Purchase / Tab Settlement)
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

      return NextResponse.json({
        success: true,
        module: "BAR",
        invoice: {
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
          items,
          totalFullPricePaise,
          totalDiscountPaise,
          netSubtotalPaise,
          securityDepositPaise,
          finalPayablePaise,
        },
        pdfUrl: `/api/billing/invoice/${tab.id}/pdf`,
      });
    }

    // 4. Check Court Booking (Athletic Court Reservation)
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

      return NextResponse.json({
        success: true,
        module: "COURT",
        invoice: {
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
          items,
          totalFullPricePaise,
          totalDiscountPaise,
          netSubtotalPaise,
          securityDepositPaise,
          finalPayablePaise,
        },
        pdfUrl: `/api/billing/invoice/${booking.id}/pdf`,
      });
    }

    return NextResponse.json({ error: "Purchase record, order, tab, or court booking invoice not found" }, { status: 404 });
  } catch (error: any) {
    console.error("Invoice retrieval failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

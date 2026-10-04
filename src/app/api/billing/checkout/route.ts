import { NextResponse } from "next/server";
import { executeCheckoutService, calculateBillingDetails } from "@/lib/billing";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/billing/checkout
 * Retrieves recent billing orders and their itemized details
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");

    const where: any = {};
    if (memberId) {
      where.memberId = memberId;
    }

    const orders = await prisma.shopOrder.findMany({
      where,
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
        member: {
          include: {
            memberships: {
              include: {
                plan: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/billing/checkout
 * Executes full billing checkout service:
 * 1. Computes full price of every product
 * 2. Applies membership discount rule according to tier
 * 3. Appends 100 INR security deposit
 * 4. Verifies & records API key reference
 * 5. Atomically commits ShopOrder, OrderItem, Payment, StockMovement, AuditLog
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty. Please add products to checkout." }, { status: 400 });
    }

    // Support API key via header or body payload
    const headerApiKey = req.headers.get("x-billing-api-key") || req.headers.get("authorization")?.replace("Bearer ", "");
    const apiKey = body.apiKey || headerApiKey;

    const result = await executeCheckoutService({
      items: body.items,
      memberId: body.memberId,
      customerName: body.customerName || "Club Member / Guest",
      customerPhone: body.customerPhone || "+91 99999 99999",
      customerEmail: body.customerEmail,
      fulfillmentType: body.fulfillmentType || "CLICK_AND_COLLECT",
      deliveryAddress: body.deliveryAddress,
      paymentMethod: body.paymentMethod || "UPI",
      apiKey: apiKey,
      userId: body.userId,
    });

    return NextResponse.json({
      success: true,
      message: "Billing checkout completed successfully with ₹100 INR security deposit applied",
      order: result.order,
      billing: result.billing,
    });
  } catch (error: any) {
    console.error("Billing Checkout execution error:", error);
    return NextResponse.json({ error: error.message || "Checkout failed" }, { status: 400 });
  }
}

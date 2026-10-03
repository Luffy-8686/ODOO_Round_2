import { NextResponse } from "next/server";
import { executeShopSaleAtomic } from "@/lib/inventory";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const orders = await prisma.shopOrder.findMany({
      include: {
        items: { include: { variant: { include: { product: true } } } },
        member: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const order = await executeShopSaleAtomic({
      memberId: body.memberId,
      customerName: body.customerName || "Walk-in Customer",
      customerPhone: body.customerPhone || "+91 99999 99999",
      customerEmail: body.customerEmail,
      fulfillmentType: body.fulfillmentType || "CLICK_AND_COLLECT",
      deliveryAddress: body.deliveryAddress,
      paymentMethod: body.paymentMethod || "CASH",
      items: body.items,
      discountPaise: body.discountPaise || 0,
      userId: body.userId,
    });

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

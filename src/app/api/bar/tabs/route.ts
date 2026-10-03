import { NextResponse } from "next/server";
import { addItemsToTabAtomic, settleTabAtomic } from "@/lib/tabs";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "OPEN";

    const tabs = await prisma.tab.findMany({
      where: {
        status: status === "ALL" ? undefined : status,
      },
      include: {
        table: true,
        member: { include: { memberships: { where: { status: "ACTIVE" }, include: { plan: true } } } },
        orders: {
          where: { status: { not: "CANCELLED" } },
          include: { items: { include: { menuItem: true } } },
        },
      },
      orderBy: { openedAt: "desc" },
    });

    return NextResponse.json({ tabs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.action === "SETTLE") {
      const settled = await settleTabAtomic({
        tabId: body.tabId,
        payments: body.payments,
        manualDiscountPaise: body.manualDiscountPaise,
        discountReason: body.discountReason,
        staffUserId: body.staffUserId,
      });
      return NextResponse.json({ success: true, tab: settled });
    }

    // Default: Add items / create tab
    const res = await addItemsToTabAtomic({
      tabId: body.tabId,
      tableId: body.tableId,
      memberId: body.memberId,
      guestName: body.guestName,
      items: body.items,
      orderNotes: body.orderNotes,
      staffUserId: body.staffUserId,
    });

    return NextResponse.json({ success: true, ...res });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

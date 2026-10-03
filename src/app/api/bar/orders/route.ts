import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const orders = await prisma.barOrder.findMany({
      where: {
        ...(status ? { status } : { status: { in: ["NEW", "PREPARING", "READY"] } }),
      },
      include: {
        table: true,
        tab: { include: { member: true } },
        items: { include: { menuItem: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status } = body;

    const order = await prisma.barOrder.update({
      where: { id },
      data: { status },
      include: { table: true, tab: true },
    });

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const items = await prisma.menuItem.findMany({
      where: {
        ...(category ? { category } : {}),
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return NextResponse.json({ items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, isAvailable } = body;

    const item = await prisma.menuItem.update({
      where: { id },
      data: { isAvailable },
    });

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

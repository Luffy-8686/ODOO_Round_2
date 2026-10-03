import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");

    const notifications = await prisma.notification.findMany({
      where: {
        ...(memberId ? { memberId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ notifications });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    const notification = await prisma.notification.update({
      where: { id },
      data: { status: "READ" },
    });

    return NextResponse.json({ success: true, notification });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

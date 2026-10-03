import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const entity = searchParams.get("entity");

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        ...(entity ? { entity } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ auditLogs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

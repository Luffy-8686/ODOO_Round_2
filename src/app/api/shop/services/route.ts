import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function GET(req: Request) {
  try {
    const jobs = await prisma.serviceJob.findMany({
      include: { member: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ jobs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.customerName || !body.racketDetails) {
      return NextResponse.json({ error: "Customer name and racket details required" }, { status: 400 });
    }

    const count = await prisma.serviceJob.count();
    const ticketNumber = `ST-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;

    const costPaise = body.isExpress ? 120000 : 80000; // ₹1,200 express vs ₹800 standard
    const etaHours = body.isExpress ? 2 : 24;
    const eta = new Date(Date.now() + etaHours * 60 * 60 * 1000);

    const job = await prisma.serviceJob.create({
      data: {
        ticketNumber,
        memberId: body.memberId,
        customerName: body.customerName,
        customerPhone: body.customerPhone || "+91 99999 99999",
        racketDetails: body.racketDetails,
        stringType: body.stringType || "Standard Synthetic Gut 16",
        tension: body.tension || "52 lbs",
        isExpress: body.isExpress || false,
        status: "QUEUED",
        costPaise,
        eta,
      },
    });

    await logAudit({
      userId: body.userId,
      action: "CREATE",
      entity: "SETTING",
      entityId: job.id,
      details: { ticketNumber, racket: body.racketDetails, costPaise },
    });

    return NextResponse.json({ success: true, job });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status } = body;

    const job = await prisma.serviceJob.update({
      where: { id },
      data: {
        status,
        ...(status === "DELIVERED" ? { completedAt: new Date() } : {}),
      },
    });

    return NextResponse.json({ success: true, job });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

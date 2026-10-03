import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { sendNotification } from "@/lib/notifications";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const leads = await prisma.lead.findMany({
      where: {
        ...(status ? { status } : {}),
      },
      include: {
        activities: { orderBy: { createdAt: "desc" } },
        quotes: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Annotate with isStale if NEW and > 24 hours old
    const enriched = leads.map((l) => ({
      ...l,
      isStale: l.status === "NEW" && new Date(l.createdAt) < oneDayAgo,
    }));

    return NextResponse.json({ leads: enriched });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.name || !body.phone) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
    }

    const count = await prisma.lead.count();
    const leadNumber = `LD-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;

    const lead = await prisma.lead.create({
      data: {
        leadNumber,
        name: body.name,
        phone: body.phone,
        email: body.email,
        source: body.source || "WEBSITE",
        sportInterest: body.sportInterest || "Tennis",
        status: body.status || "NEW",
        notes: body.notes,
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: "NOTE",
        summary: `Enquiry received via ${lead.source}`,
        details: body.notes || `Interested in ${lead.sportInterest}`,
      },
    });

    // Notify staff
    await sendNotification({
      type: "NEW_LEAD",
      title: "New Enquiry Captured",
      message: `New prospect ${lead.name} (${lead.phone}) enquired about ${lead.sportInterest}.`,
      channel: "IN_APP",
    });

    await logAudit({
      action: "CREATE",
      entity: "LEAD",
      entityId: lead.id,
      details: { leadNumber, name: lead.name, source: lead.source },
    });

    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, note, staffUserId, staffUserName } = body;

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        lastContactedAt: new Date(),
      },
    });

    if (note || status) {
      await prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          type: status ? "STATUS_CHANGE" : "NOTE",
          summary: status ? `Status updated to ${status}` : "Note added",
          details: note,
          performedByUserId: staffUserId,
        },
      });
    }

    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

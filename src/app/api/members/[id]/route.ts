import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isMember = session.user.role === "MEMBER";
    const lookupKey = params.id;

    let memberQuery: any;
    if (lookupKey === "me" || (isMember && (session.user.memberId === lookupKey || session.user.memberCode === lookupKey))) {
      memberQuery = { userId: session.user.id };
    } else if (isMember) {
      // IDOR protection: Members can ONLY access their own member records
      memberQuery = { userId: session.user.id };
    } else {
      // Staff (Owner, Manager, Front Desk) can lookup any member by ID or MemberCode
      memberQuery = { OR: [{ id: lookupKey }, { memberId: lookupKey }] };
    }

    const member = await prisma.member.findFirst({
      where: memberQuery,
      include: {
        memberships: {
          include: { plan: true },
          orderBy: { endDate: "desc" },
        },
        bookings: {
          include: { court: { include: { sport: true } } },
          orderBy: { startTime: "desc" },
          take: 20,
        },
        shopOrders: {
          include: { items: { include: { variant: { include: { product: true } } } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        tabs: {
          include: { orders: { include: { items: { include: { menuItem: true } } } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        attendances: {
          orderBy: { checkInTime: "desc" },
          take: 20,
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ member });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (body.action === "CHECK_IN") {
      const member = await prisma.member.findFirst({
        where: { OR: [{ id: params.id }, { memberId: params.id }] },
      });

      if (!member) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
      }

      const attendance = await prisma.memberAttendance.create({
        data: {
          memberId: member.id,
          checkInMethod: body.checkInMethod || "DESK",
          notes: body.notes,
        },
      });

      await logAudit({
        userId: session.user.id,
        action: "CHECK_IN",
        entityType: "MemberAttendance",
        entityId: attendance.id,
        after: { memberId: member.memberId, name: member.name, method: body.checkInMethod },
      });

      return NextResponse.json({ success: true, attendance });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

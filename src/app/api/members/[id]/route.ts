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

    // Automated 5-Day Membership Expiry Check & Notification
    const activeMembership = member.memberships?.find((m: any) => m.status === "ACTIVE") || member.memberships?.[0];
    if (activeMembership && activeMembership.endDate && activeMembership.tier !== "FREE") {
      const now = new Date();
      const msLeft = new Date(activeMembership.endDate).getTime() - now.getTime();
      const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

      if (daysLeft <= 5 && daysLeft >= 0 && member.userId) {
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const existingAlert = await prisma.notification.findFirst({
          where: {
            userId: member.userId,
            title: { contains: "Expiring Soon" },
            createdAt: { gte: oneDayAgo },
          },
        });

        if (!existingAlert) {
          try {
            await prisma.notification.create({
              data: {
                userId: member.userId,
                title: `⚠️ Membership Expiring Soon (${daysLeft === 0 ? "Today" : daysLeft + " Days Left"})`,
                message: `Your ${activeMembership.plan?.name || activeMembership.tier} expires on ${new Date(activeMembership.endDate).toLocaleDateString("en-IN")}. Renew or upgrade your plan to maintain uninterrupted court privileges and discounts.`,
                type: "WARNING",
              },
            });
          } catch {
            // ignore
          }
        }
      }
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

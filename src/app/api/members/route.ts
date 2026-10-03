import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateAge } from "@/lib/formatters";
import { logAudit } from "@/lib/audit";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const tier = searchParams.get("tier");
    const status = searchParams.get("status");

    const members = await prisma.member.findMany({
      where: {
        AND: [
          query
            ? {
                OR: [
                  { name: { contains: query } },
                  { memberId: { contains: query } },
                  { phone: { contains: query } },
                  { email: { contains: query } },
                ],
              }
            : {},
          status ? { status } : {},
          tier
            ? {
                memberships: {
                  some: { tier, status: "ACTIVE" },
                },
              }
            : {},
        ],
      },
      include: {
        memberships: {
          include: { plan: true },
          orderBy: { endDate: "desc" },
        },
        _count: {
          select: { bookings: true, shopOrders: true, tabs: true, attendances: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ members });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Validation
    if (!body.name || !body.email || !body.phone || !body.planId) {
      return NextResponse.json(
        { error: "Name, email, phone, and membership plan are required." },
        { status: 400 }
      );
    }

    // 2. Fetch Plan
    const plan = await prisma.plan.findUnique({ where: { id: body.planId } });
    if (!plan) {
      return NextResponse.json({ error: "Selected plan does not exist." }, { status: 400 });
    }

    // 3. JUNIOR TIER AGE VALIDATION (Under 18)
    if (plan.tier === "JUNIOR") {
      if (!body.dateOfBirth) {
        return NextResponse.json(
          { error: "Date of Birth is mandatory for Junior Academy Tier." },
          { status: 400 }
        );
      }
      const age = calculateAge(body.dateOfBirth);
      if (age >= 18) {
        return NextResponse.json(
          {
            error: `Age validation failed: Applicant is ${age} years old. Junior Tier is strictly for individuals under 18. Please select Gold or Silver plan.`,
          },
          { status: 400 }
        );
      }
    }

    // 4. Duplicate Check
    const existing = await prisma.member.findFirst({
      where: {
        OR: [{ email: body.email }, { phone: body.phone }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Member with email "${body.email}" or phone "${body.phone}" already exists (#${existing.memberId}).` },
        { status: 409 }
      );
    }

    // 5. Generate Member ID & QR data
    const memberCount = await prisma.member.count();
    const memberId = `CC-${new Date().getFullYear()}-${String(memberCount + 1).padStart(3, "0")}`;
    const qrCodeData = `MEMBER:${memberId}:${body.name}:${plan.tier}`;

    // 6. Create User record for Portal Login
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        role: "MEMBER",
      },
    });

    // 7. Create Member & Membership
    const startDate = new Date();
    const endDate = new Date();
    if (body.billingCycle === "ANNUAL") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const feePaise = body.billingCycle === "ANNUAL" ? plan.annualFeePaise : plan.monthlyFeePaise;

    const member = await prisma.member.create({
      data: {
        memberId,
        userId: user.id,
        name: body.name,
        email: body.email,
        phone: body.phone,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        photoUrl: body.photoUrl,
        emergencyContactName: body.emergencyContactName,
        emergencyContactPhone: body.emergencyContactPhone,
        status: "ACTIVE",
        address: body.address,
        notes: body.notes,
        qrCodeData,
      },
    });

    const membership = await prisma.membership.create({
      data: {
        memberId: member.id,
        planId: plan.id,
        tier: plan.tier,
        startDate,
        endDate,
        billingCycle: body.billingCycle || "MONTHLY",
        status: "ACTIVE",
        amountPaidPaise: feePaise,
        paymentMethod: body.paymentMethod || "UPI",
      },
    });

    // 8. Financial Ledger & Invoice
    const invoiceCount = await prisma.invoice.count();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(5, "0")}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        memberId: member.id,
        clientName: member.name,
        dueDate: endDate,
        subtotalPaise: feePaise,
        taxAmountPaise: Math.round(feePaise * 0.18),
        cgstPaise: Math.round(feePaise * 0.09),
        sgstPaise: Math.round(feePaise * 0.09),
        totalPaise: feePaise,
        status: "PAID",
      },
    });

    await prisma.invoiceLine.create({
      data: {
        invoiceId: invoice.id,
        description: `${plan.name} Membership Fee (${body.billingCycle || 'Monthly'})`,
        quantity: 1,
        unitPricePaise: feePaise,
        taxRatePercent: 18,
        totalPaise: feePaise,
      },
    });

    const txCount = await prisma.ledgerTransaction.count();
    await prisma.ledgerTransaction.create({
      data: {
        entryNumber: `TX-${new Date().getFullYear()}-${String(txCount + 1).padStart(6, "0")}`,
        description: `New Membership Onboarding - ${member.name} (${plan.name})`,
        module: "MEMBERSHIPS",
        creditPaise: feePaise,
        paymentMethod: body.paymentMethod || "UPI",
        taxAmountPaise: Math.round(feePaise * 0.18),
        referenceType: "MEMBERSHIP",
        referenceId: membership.id,
      },
    });

    // 9. Audit Log
    await logAudit({
      userId: body.staffUserId,
      userName: body.staffUserName,
      action: "CREATE",
      entity: "MEMBER",
      entityId: member.id,
      details: { memberId: member.memberId, plan: plan.name, feePaise },
    });

    return NextResponse.json({ success: true, member, membership, invoice });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

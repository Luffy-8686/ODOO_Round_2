import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, password, preferredSport } = body;

    // 1. Validation
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Please enter a valid full name." }, { status: 400 });
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    if (!phone || phone.trim().length < 8) {
      return NextResponse.json({ error: "Please provide a valid phone number." }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phone.trim();

    // 2. Check existing user / member
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    const existingMember = await prisma.member.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { phone: normalizedPhone }],
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "A member with this email or phone number is already registered." },
        { status: 409 }
      );
    }

    // 3. Ensure FREE plan exists in database
    let freePlan = await prisma.plan.findUnique({
      where: { tier: "FREE" },
    });

    if (!freePlan) {
      freePlan = await prisma.plan.create({
        data: {
          tier: "FREE",
          name: "Free Community Guest Tier",
          monthlyFeePaise: 0,
          annualFeePaise: 0,
          courtRatePerHourPaise: 80000,
          shopDiscountPercent: 0,
          barDiscountPercent: 0,
          maxBookingsPerDay: 1,
          advanceBookingDays: 3,
          description: "Pay-as-you-play court bookings and club cafeteria access.",
          featuresJson: JSON.stringify([
            "Pay-as-you-play court reservations",
            "3-Day advance booking window",
            "Full Bar & Cafeteria table ordering & reservations",
            "Pro Shop purchases & racket restringing",
            "Upgrade to Gold or Silver anytime for complimentary courts & discounts",
          ]),
        },
      });
    }

    // 4. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 5. Generate unique member ID: CC-YYYY-XXXX
    const memberCount = await prisma.member.count();
    const memberIdCode = `CC-${new Date().getFullYear()}-${String(memberCount + 1).padStart(4, "0")}`;

    // 6. Transactionally create User, Member, Free Membership & Welcome Notification
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          phone: normalizedPhone,
          passwordHash,
          role: "MEMBER",
          isActive: true,
        },
      });

      const member = await tx.member.create({
        data: {
          memberId: memberIdCode,
          userId: user.id,
          name: name.trim(),
          email: normalizedEmail,
          phone: normalizedPhone,
          status: "ACTIVE",
          creditBalancePaise: 0,
          notes: preferredSport ? `Preferred Sport: ${preferredSport}` : "Self-registered online member",
        },
      });

      // Free tier membership valid for 1 year
      const now = new Date();
      const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

      const membership = await tx.membership.create({
        data: {
          memberId: member.id,
          planId: freePlan.id,
          tier: "FREE",
          startDate: now,
          endDate: oneYearLater,
          billingCycle: "ANNUAL",
          status: "ACTIVE",
          amountPaidPaise: 0,
          paymentMethod: "FREE_TIER",
        },
      });

      // Welcome Notification
      await tx.notification.create({
        data: {
          userId: user.id,
          title: "Welcome to The Champions Club!",
          message: `Your Free Community Account (#${memberIdCode}) is active. You can book courts on pay-per-play rates or upgrade to Gold/Silver for 100% free courts.`,
          type: "SUCCESS",
        },
      });

      return { user, member, membership };
    });

    // 7. Audit Log
    try {
      await logAudit({
        userId: result.user.id,
        userName: result.user.name,
        action: "CREATE",
        entity: "USER",
        entityId: result.user.id,
        details: {
          email: result.user.email,
          memberId: result.member.memberId,
          tier: "FREE",
        },
      });
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      message: "Registration successful! Your Free Community Account is now active.",
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        memberId: result.member.id,
        memberCode: result.member.memberId,
        tier: "FREE",
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: error.message || "Failed to register account." }, { status: 500 });
  }
}

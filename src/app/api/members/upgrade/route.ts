import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { memberId, targetTier, billingCycle = "MONTHLY", paymentMethod = "UPI", userId, userName } = body;

    if (!memberId) {
      return NextResponse.json({ error: "Missing memberId" }, { status: 400 });
    }

    if (!["GOLD", "SILVER", "JUNIOR"].includes(targetTier)) {
      return NextResponse.json({ error: "Invalid target tier. Choose GOLD, SILVER, or JUNIOR." }, { status: 400 });
    }

    // 1. Fetch member & target plan
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        user: true,
        memberships: {
          where: { status: "ACTIVE" },
          include: { plan: true },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found." }, { status: 404 });
    }

    const plan = await prisma.plan.findUnique({
      where: { tier: targetTier },
    });

    if (!plan) {
      return NextResponse.json({ error: `Plan tier ${targetTier} not configured.` }, { status: 404 });
    }

    // 2. Compute fee amount and duration
    const isAnnual = billingCycle === "ANNUAL";
    const amountPaise = isAnnual ? plan.annualFeePaise : plan.monthlyFeePaise;
    const durationDays = isAnnual ? 365 : 30;

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // 3. Transactionally perform the upgrade & accounting entries
    const result = await prisma.$transaction(async (tx) => {
      // Mark existing active memberships as UPGRADED
      await tx.membership.updateMany({
        where: {
          memberId: member.id,
          status: "ACTIVE",
        },
        data: {
          status: "EXPIRED",
        },
      });

      // Create new Membership
      const newMembership = await tx.membership.create({
        data: {
          memberId: member.id,
          planId: plan.id,
          tier: targetTier,
          startDate,
          endDate,
          billingCycle: isAnnual ? "ANNUAL" : "MONTHLY",
          status: "ACTIVE",
          amountPaidPaise: amountPaise,
          paymentMethod,
        },
      });

      // Update Member status
      await tx.member.update({
        where: { id: member.id },
        data: { status: "ACTIVE" },
      });

      // Generate Receipt & Payment Record
      const receiptCount = await tx.payment.count();
      const receiptNumber = `RCP-${new Date().getFullYear()}-${String(receiptCount + 1).padStart(5, "0")}`;

      await tx.payment.create({
        data: {
          receiptNumber,
          amountPaise,
          method: paymentMethod,
          status: "SUCCESS",
          module: "MEMBERSHIP",
          referenceId: newMembership.id,
          notes: `Membership Upgrade: ${plan.name} (${billingCycle})`,
        },
      });

      // Create Ledger Transaction for club revenue
      const txCount = await tx.ledgerTransaction.count();
      await tx.ledgerTransaction.create({
        data: {
          entryNumber: `TX-${new Date().getFullYear()}-${String(txCount + 1).padStart(6, "0")}`,
          description: `Membership Fee - ${member.name} (${plan.name})`,
          module: "MEMBERSHIP",
          creditPaise: amountPaise,
          paymentMethod,
          taxAmountPaise: Math.round(amountPaise * 0.18),
          referenceType: "MEMBERSHIP",
          referenceId: newMembership.id,
        },
      });

      // Create User Notification
      if (member.userId) {
        await tx.notification.create({
          data: {
            userId: member.userId,
            title: `Upgraded to ${plan.name}! 👑`,
            message: `Congratulations! Your membership has been upgraded to ${targetTier}. You now have ${plan.courtRatePerHourPaise === 0 ? "100% Free Court Access" : "discounted courts"}, ${plan.barDiscountPercent}% F&B discounts, and a ${plan.advanceBookingDays}-day booking window.`,
            type: "SUCCESS",
          },
        });
      }

      return newMembership;
    });

    // 4. Audit Log
    try {
      await logAudit({
        userId: userId || member.userId,
        userName: userName || member.name,
        action: "UPDATE",
        entity: "MEMBERSHIP",
        entityId: result.id,
        details: {
          memberId: member.memberId,
          memberName: member.name,
          upgradedTo: targetTier,
          billingCycle,
          amountPaise,
          validUntil: endDate.toISOString(),
        },
      });
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      message: `Successfully upgraded to ${plan.name}!`,
      membership: result,
      newTier: targetTier,
      amountPaise,
      validUntil: endDate.toISOString(),
    });
  } catch (error: any) {
    console.error("Upgrade error:", error);
    return NextResponse.json({ error: error.message || "Failed to upgrade membership." }, { status: 500 });
  }
}

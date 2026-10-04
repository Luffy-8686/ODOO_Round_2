import { NextResponse } from "next/server";
import { createRazorpayOrder, getRazorpayConfig } from "@/lib/razorpay";
import { calculateCourtPrice, isPeakHour } from "@/lib/pricing";
import { checkMemberDailyQuota } from "@/lib/concurrency";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { courtId, memberId, bookerType: requestedType, startTime, durationMinutes = 60, type = "COURT_BOOKING", customAmountPaise, notes = {} } = body;

    let amountPaise = 0;
    let isGold = false;
    let courtPricePaise = 0;
    let securityDepositPaise = 0;
    let memberTier = requestedType || "WALK_IN";

    if (type === "COURT_BOOKING") {
      // 1. Resolve member tier if memberId provided
      if (memberId) {
        if (startTime) {
          const quota = await checkMemberDailyQuota(memberId, new Date(startTime));
          if (!quota.allowed) {
            return NextResponse.json(
              { error: `Daily booking quota reached: Member has already booked ${quota.currentCount}/${quota.maxAllowed} sessions on this date. Please choose another date.` },
              { status: 400 }
            );
          }
        }

        const member = await prisma.member.findUnique({
          where: { id: memberId },
          include: {
            memberships: {
              where: { status: "ACTIVE" },
              include: { plan: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        });

        if (member?.memberships?.[0]) {
          memberTier = member.memberships[0].tier || member.memberships[0].plan?.tier || "WALK_IN";
        }
      }

      isGold = memberTier.toUpperCase() === "GOLD";

      if (courtId && startTime) {
        const court = await prisma.court.findUnique({ where: { id: courtId } });
        if (!court) {
          return NextResponse.json({ error: "Court not found" }, { status: 404 });
        }

        const isPeak = isPeakHour(new Date(startTime));
        const pricing = calculateCourtPrice({
          tier: memberTier as any,
          isPeak,
          baseHourlyRatePaise: court.hourlyRatePaise,
          durationMinutes,
        });

        courtPricePaise = pricing.finalPricePaise;
      }

      // Gold members are charged exactly 100 INR (10,000 paise) refundable security deposit.
      // Court access itself is complimentary.
      // For all other tiers, security deposit is 0, and they pay their standard discounted court fee.
      securityDepositPaise = isGold ? 10000 : 0;
      amountPaise = courtPricePaise + securityDepositPaise;
    } else {
      // General billing or shop order
      amountPaise = customAmountPaise || body.amountPaise || 0;
    }

    if (amountPaise <= 0) {
      // Free tier without deposit (should not normally happen for Gold since deposit is ₹100)
      return NextResponse.json({
        success: true,
        orderId: `free_${Date.now()}`,
        amountPaise: 0,
        currency: "INR",
        isFree: true,
        breakdown: {
          courtPricePaise: 0,
          securityDepositPaise: 0,
          isGold,
          memberTier,
        },
      });
    }

    const receipt = `RCPT_${Date.now().toString().slice(-8)}`;
    const order = await createRazorpayOrder({
      amountPaise,
      currency: "INR",
      receipt,
      notes: {
        ...notes,
        type,
        courtId,
        memberId,
        memberTier,
        isGold: String(isGold),
        securityDepositPaise: String(securityDepositPaise),
        courtPricePaise: String(courtPricePaise),
      },
    });

    const config = getRazorpayConfig();

    return NextResponse.json({
      success: true,
      orderId: order.orderId,
      amountPaise: order.amountPaise,
      currency: order.currency,
      receipt: order.receipt,
      keyId: config.keyId || "rzp_test_trial_mode",
      isSimulated: order.isSimulated,
      configMode: config.mode,
      breakdown: {
        courtPricePaise,
        securityDepositPaise,
        totalPayablePaise: amountPaise,
        isGold,
        memberTier,
        refundableDeposit: isGold ? 10000 : 0,
      },
    });
  } catch (error: any) {
    console.error("Razorpay create-order error:", error);
    return NextResponse.json({ error: error.message || "Failed to create Razorpay order" }, { status: 500 });
  }
}

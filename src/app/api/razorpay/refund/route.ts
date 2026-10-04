import { NextResponse } from "next/server";
import { processSlotDepositRefund } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bookingId, reason } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "Missing required bookingId" }, { status: 400 });
    }

    const result = await processSlotDepositRefund(
      bookingId,
      reason || "Manual / Slot ended: Gold member ₹100 INR security deposit refunded"
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Deposit refund route error:", error);
    return NextResponse.json({ error: error.message || "Failed to process security deposit refund" }, { status: 400 });
  }
}

/**
 * GET /api/razorpay/refund?bookingId=...
 * Checks refund status for a booking
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { court: true, member: true, payments: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const now = new Date();
    const isSlotEnded = new Date(booking.endTime) <= now;

    return NextResponse.json({
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      bookerType: booking.bookerType,
      isGold: booking.bookerType === "GOLD",
      securityDepositPaise: booking.securityDepositPaise,
      depositRefundStatus: booking.depositRefundStatus,
      depositRefundedAt: booking.depositRefundedAt,
      isSlotEnded,
      status: booking.status,
      razorpayOrderId: booking.razorpayOrderId,
      razorpayPaymentId: booking.razorpayPaymentId,
      razorpayRefundId: booking.razorpayRefundId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

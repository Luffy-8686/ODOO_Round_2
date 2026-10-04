import { NextResponse } from "next/server";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { createCourtBookingAtomic } from "@/lib/concurrency";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingData,
      bookingId,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json({ error: "Missing required Razorpay payment fields" }, { status: 400 });
    }

    // 1. Verify payment signature
    const isValid = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      return NextResponse.json({ error: "Invalid Razorpay payment signature" }, { status: 400 });
    }

    // 2. If bookingData is provided, create the court booking atomically
    if (bookingData) {
      const isGold = (bookingData.bookerType === "GOLD");
      const booking = await createCourtBookingAtomic({
        courtId: bookingData.courtId,
        memberId: bookingData.memberId,
        bookerName: bookingData.bookerName,
        bookerPhone: bookingData.bookerPhone || "+91 99999 99999",
        bookerEmail: bookingData.bookerEmail || "guest@championsclub.in",
        bookerType: bookingData.bookerType,
        startTime: new Date(bookingData.startTime),
        durationMinutes: bookingData.durationMinutes || 60,
        source: bookingData.source || "MEMBER_PORTAL",
        paymentMethod: "RAZORPAY",
        notes: bookingData.notes,
        userId: bookingData.userId,
        userName: bookingData.userName,
        sessionId: bookingData.sessionId || null,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      });

      // Update deposit refund status
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          depositRefundStatus: isGold ? "HELD" : "NOT_APPLICABLE",
        },
      });

      return NextResponse.json({
        success: true,
        verified: true,
        booking,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        depositStatus: isGold ? "HELD" : "NOT_APPLICABLE",
      });
    }

    // 3. If an existing booking ID is passed
    if (bookingId) {
      const booking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: "PAID",
          paymentMethod: "RAZORPAY",
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
        },
      });

      return NextResponse.json({
        success: true,
        verified: true,
        booking,
        razorpayPaymentId: razorpay_payment_id,
      });
    }

    return NextResponse.json({
      success: true,
      verified: true,
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
    });
  } catch (error: any) {
    console.error("Razorpay verify error:", error);
    return NextResponse.json({ error: error.message || "Payment verification failed" }, { status: 400 });
  }
}

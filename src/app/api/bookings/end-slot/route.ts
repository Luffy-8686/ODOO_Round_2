import { NextResponse } from "next/server";
import { processSlotDepositRefund } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/bookings/end-slot
 * Marks a court slot as ended/completed and triggers automated refund of the ₹100 INR security deposit
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bookingId, reason } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { court: true, member: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Process refund of ₹100 security deposit if applicable
    const refundResult = await processSlotDepositRefund(
      bookingId,
      reason || `Slot session ended on ${booking.court.name} - Gold security deposit refunded`
    );

    return NextResponse.json({
      success: true,
      message: `Slot on ${booking.court.name} marked as ended. Security deposit refund status: ${refundResult.message}`,
      refundResult,
      booking: refundResult.booking,
    });
  } catch (error: any) {
    console.error("End slot route error:", error);
    return NextResponse.json({ error: error.message || "Failed to end slot and refund deposit" }, { status: 400 });
  }
}

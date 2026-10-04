import { prisma } from "./prisma";
import { calculateCourtPrice, isPeakHour } from "./pricing";
import { logAudit } from "./audit";
import { sendNotification } from "./notifications";
import { isSlotLocked } from "./slot-lock";

export interface CreateBookingInput {
  courtId: string;
  memberId?: string | null;
  bookerName: string;
  bookerPhone: string;
  bookerEmail: string;
  bookerType?: "GOLD" | "SILVER" | "JUNIOR" | "WALK_IN" | "TRIAL";
  startTime: Date | string;
  durationMinutes?: number; // default 60
  source?: "FRONT_DESK" | "MEMBER_PORTAL" | "PUBLIC_TRIAL" | "PHONE";
  paymentMethod?: string;
  notes?: string;
  coachId?: string | null;
  userId?: string | null;
  userName?: string;
  sessionId?: string | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
}

/**
 * Checks if a proposed booking time window overlaps with any active booking, social session, or maintenance block on the court.
 * An overlap occurs if: (existingStart < newEnd) AND (existingEnd > newStart)
 */
export async function checkCourtAvailability(
  courtId: string,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string,
  tx?: any
) {
  const db = tx || prisma;

  // 1. Check existing confirmed or pending bookings
  const conflictingBookings = await db.booking.findMany({
    where: {
      courtId,
      status: { in: ["CONFIRMED", "PENDING"] },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });

  if (conflictingBookings.length > 0) {
    return {
      available: false,
      reason: `Slot conflict: Court is already booked (${conflictingBookings[0].bookerName}) from ${conflictingBookings[0].startTime.toISOString()} to ${conflictingBookings[0].endTime.toISOString()}`,
      conflictType: "BOOKING",
      conflictId: conflictingBookings[0].id,
    };
  }

  // 2. Check maintenance blocks
  const maintenanceBlocks = await db.maintenanceBlock.findMany({
    where: {
      courtId,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });

  if (maintenanceBlocks.length > 0) {
    return {
      available: false,
      reason: `Maintenance Block: ${maintenanceBlocks[0].reason}`,
      conflictType: "MAINTENANCE",
      conflictId: maintenanceBlocks[0].id,
    };
  }

  // 3. Check social sessions
  const socialSessions = await db.socialSession.findMany({
    where: {
      courtId,
      status: "ACTIVE",
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });

  if (socialSessions.length > 0) {
    return {
      available: false,
      reason: `Social Play Event in progress: ${socialSessions[0].name}`,
      conflictType: "SOCIAL_SESSION",
      conflictId: socialSessions[0].id,
    };
  }

  return { available: true };
}

/**
 * Check member's daily booking quota (Max 2 per day)
 */
export async function checkMemberDailyQuota(
  memberId: string,
  sessionDate: Date,
  excludeBookingId?: string,
  tx?: any
) {
  const db = tx || prisma;
  const startOfDay = new Date(sessionDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(sessionDate);
  endOfDay.setHours(23, 59, 59, 999);

  const count = await db.booking.count({
    where: {
      memberId,
      status: { in: ["CONFIRMED", "PENDING"] },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      startTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  const member = await db.member.findUnique({
    where: { id: memberId },
    include: { memberships: { include: { plan: true }, where: { status: "ACTIVE" } } },
  });

  const maxAllowed = member?.memberships[0]?.plan?.maxBookingsPerDay ?? 2;

  return {
    allowed: count < maxAllowed,
    currentCount: count,
    maxAllowed,
  };
}

// Deterministic AsyncMutex to strictly serialize concurrent booking requests per court
class AsyncMutex {
  private queue: Array<() => void> = [];
  private locked = false;

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const release = () => {
        const next = this.queue.shift();
        if (next) {
          next();
        } else {
          this.locked = false;
        }
      };

      if (!this.locked) {
        this.locked = true;
        resolve(release);
      } else {
        this.queue.push(() => resolve(release));
      }
    });
  }
}

const courtMutexMap = new Map<string, AsyncMutex>();

function getCourtMutex(courtId: string): AsyncMutex {
  if (!courtMutexMap.has(courtId)) {
    courtMutexMap.set(courtId, new AsyncMutex());
  }
  return courtMutexMap.get(courtId)!;
}

/**
 * Atomic Booking Engine with Transaction Lock, Double Booking Guard, Quota Check, and Pricing
 */
export async function createCourtBookingAtomic(input: CreateBookingInput) {
  const start = new Date(input.startTime);
  const duration = input.durationMinutes || 60;
  const end = new Date(start.getTime() + duration * 60000);

  const now = new Date();
  // Disallow booking slots in the past (allow 5-min grace period for clock drift / form completion)
  if (start.getTime() < now.getTime() - 5 * 60 * 1000) {
    throw new Error("Cannot book court slots in the past.");
  }

  const mutex = getCourtMutex(input.courtId);
  const releaseLock = await mutex.acquire();

  try {
    return await prisma.$transaction(
      async (tx) => {
      // 1. Fetch Court details
      const court = await tx.court.findUnique({
        where: { id: input.courtId },
        include: { sport: true },
      });

      if (!court || court.status !== "ACTIVE") {
        throw new Error("Court is unavailable or under maintenance.");
      }

      // 2. Determine booker type and verify active membership
      let bookerType = input.bookerType || "WALK_IN";
      let activeTier = "WALK_IN";

      if (input.memberId) {
        const member = await tx.member.findUnique({
          where: { id: input.memberId },
          include: {
            memberships: {
              where: { status: "ACTIVE" },
              include: { plan: true },
              orderBy: { endDate: "desc" },
            },
          },
        });

        if (member) {
          // Expired or suspended members lose member pricing and revert to WALK_IN
          if (member.status === "ACTIVE" && member.memberships.length > 0) {
            const activeMembership = member.memberships[0];
            activeTier = activeMembership.plan.tier;
            bookerType = activeTier as any;

            // Enforce plan advance booking days limit (e.g. Gold: 14 days, Silver: 7 days, Free: 3 days)
            const advanceDays = activeMembership.plan.advanceBookingDays || (activeTier === "FREE" ? 3 : 14);
            const maxAllowedDate = new Date();
            maxAllowedDate.setDate(maxAllowedDate.getDate() + advanceDays);
            maxAllowedDate.setHours(23, 59, 59, 999);

            if (start.getTime() > maxAllowedDate.getTime()) {
              throw new Error(
                `Advance booking limit reached: Your ${activeMembership.plan.name} allows booking up to ${advanceDays} days in advance.`
              );
            }

            // 3. Quota check for active members (max 2 per day)
            const quota = await checkMemberDailyQuota(input.memberId, start, undefined, tx);
            if (!quota.allowed) {
              throw new Error(
                `Daily booking quota exceeded: Member has already booked ${quota.currentCount}/${quota.maxAllowed} sessions today.`
              );
            }
          } else {
            bookerType = "WALK_IN";
          }
        }
      }

      // 4a. EPHEMERAL SLOT LOCK CHECK
      // If another session holds an active TTL lock on this slot, reject booking.
      // (Staff/front-desk bookings without sessionId bypass; matching sessionId passes)
      const lockStatus = await isSlotLocked(input.courtId, start, input.sessionId || undefined);
      if (lockStatus.locked) {
        throw new Error(
          `Slot is temporarily reserved by another user. Please try again in ${lockStatus.secondsRemaining ?? 300} seconds.`
        );
      }

      // 4b. HARD OVERLAP CHECK (Invariant inside transaction)
      const availability = await checkCourtAvailability(input.courtId, start, end, undefined, tx);
      if (!availability.available) {
        throw new Error(`Double-booking prevented: ${availability.reason}`);
      }

      // 5. Pricing calculation
      const isPeak = isPeakHour(start);
      const pricing = calculateCourtPrice({
        tier: bookerType as any,
        isPeak,
        baseHourlyRatePaise: court.hourlyRatePaise,
        durationMinutes: duration,
      });

      // 6. Security Deposit: Exactly ₹100 INR (10,000 paise) for GOLD members only on court bookings; ₹0 for all others
      const isGold = (activeTier === "GOLD" || bookerType === "GOLD" || input.bookerType === "GOLD");
      const securityDepositPaise = isGold ? 10000 : 0;
      const totalPayablePaise = pricing.finalPricePaise + securityDepositPaise;

      // 7. Generate globally unique booking number
      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      const bookingNumber = `BK-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}${randSuffix}`;

      // 8. Create booking record
      const bookingNotes = isGold
        ? (input.notes ? `${input.notes} | Gold Member Booking (Security Deposit: ₹100 INR)` : "Gold Member Booking (Security Deposit: ₹100 INR)")
        : input.notes;

      const booking = await tx.booking.create({
        data: {
          bookingNumber,
          courtId: input.courtId,
          memberId: input.memberId,
          bookerName: input.bookerName,
          bookerPhone: input.bookerPhone,
          bookerEmail: input.bookerEmail,
          bookerType,
          startTime: start,
          endTime: end,
          durationMinutes: duration,
          status: "CONFIRMED",
          source: input.source || "FRONT_DESK",
          totalPricePaise: pricing.finalPricePaise,
          securityDepositPaise,
          depositRefundStatus: isGold ? "HELD" : "NOT_APPLICABLE",
          razorpayOrderId: input.razorpayOrderId || null,
          razorpayPaymentId: input.razorpayPaymentId || null,
          isPeak,
          paymentStatus: totalPayablePaise === 0 ? "PAID" : input.paymentMethod ? "PAID" : "PAID",
          paymentMethod: isGold
            ? (input.paymentMethod || "RAZORPAY")
            : (pricing.finalPricePaise === 0 ? "FREE_TIER" : input.paymentMethod || "CASH"),
          notes: bookingNotes,
          coachId: input.coachId,
        },
      });

      // 9. Record payment & ledger entry if totalPayablePaise > 0
      if (totalPayablePaise > 0) {
        const receiptCount = await tx.payment.count();
        const receiptNumber = `RCP-${new Date().getFullYear()}-${String(receiptCount + 1).padStart(5, "0")}`;

        await tx.payment.create({
          data: {
            receiptNumber,
            bookingId: booking.id,
            amountPaise: totalPayablePaise,
            method: booking.paymentMethod || "UPI",
            status: "SUCCESS",
            module: "COURT",
            referenceId: booking.bookingNumber,
            notes: isGold
              ? `Court Booking: ${court.name} (Complimentary Access + ₹100 Security Deposit)`
              : `Court Booking: ${court.name} (${start.toLocaleDateString()})`,
          },
        });

        const txCount = await tx.ledgerTransaction.count();
        await tx.ledgerTransaction.create({
          data: {
            entryNumber: `TX-${new Date().getFullYear()}-${String(txCount + 1).padStart(6, "0")}`,
            description: `Court Booking - ${court.name} - ${booking.bookerName} (${booking.bookingNumber})${isGold ? " [Includes ₹100 Security Deposit]" : ""}`,
            module: "COURTS",
            creditPaise: totalPayablePaise,
            paymentMethod: booking.paymentMethod || "UPI",
            taxAmountPaise: Math.round(pricing.finalPricePaise * 0.18),
            referenceType: "BOOKING",
            referenceId: booking.id,
          },
        });
      }

      // 9. Audit Log & Notification (passing tx)
      await logAudit({
        userId: input.userId,
        userName: input.userName,
        action: "CREATE",
        entity: "BOOKING",
        entityId: booking.id,
        details: {
          bookingNumber: booking.bookingNumber,
          court: court.name,
          slot: `${start.toISOString()} - ${end.toISOString()}`,
          amountPaise: booking.totalPricePaise,
        },
        tx,
      });

      await sendNotification({
        memberId: input.memberId,
        type: "BOOKING_CONFIRMED",
        title: "Booking Confirmed",
        message: `Your court booking #${booking.bookingNumber} for ${court.name} is confirmed.`,
        channel: "IN_APP",
        tx,
      });

      return booking;
    },
    { timeout: 15000 }
  );
  } finally {
    releaseLock();
  }
}

/**
 * Cancel Booking & Promote Waitlist if any
 */
export async function cancelBookingAtomic(bookingId: string, cancelReason?: string, userId?: string) {
  return await prisma.$transaction(
    async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { court: true },
      });

      if (!booking || booking.status === "CANCELLED") {
        throw new Error("Booking not found or already cancelled.");
      }

      const isDepositRefundable = (booking.securityDepositPaise || 0) > 0;
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelReason: cancelReason || "Cancelled by user/staff",
          depositRefundStatus: isDepositRefundable ? "REFUNDED" : booking.depositRefundStatus,
          depositRefundedAt: isDepositRefundable ? new Date() : undefined,
        },
      });

      // Check waitlist for this slot
      const waitlistEntry = await tx.waitlist.findFirst({
        where: {
          courtId: booking.courtId,
          slotTime: booking.startTime,
          status: "WAITING",
        },
        orderBy: { createdAt: "asc" },
      });

      if (waitlistEntry) {
        await tx.waitlist.update({
          where: { id: waitlistEntry.id },
          data: { status: "NOTIFIED" },
        });

        await sendNotification({
          memberId: waitlistEntry.memberId,
          type: "WAITLIST_PROMOTED",
          title: "Waitlist Slot Available!",
          message: `A court slot has opened up on ${booking.court.name} at ${booking.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          channel: "WHATSAPP",
          tx,
        });
      }

      if (booking.securityDepositPaise > 0) {
        const rxCount = await tx.ledgerTransaction.count();
        await tx.ledgerTransaction.create({
          data: {
            entryNumber: `TX-${new Date().getFullYear()}-${String(rxCount + 1).padStart(6, "0")}`,
            description: `Security Deposit Refund - Court Booking ${booking.bookingNumber} (${booking.bookerName})`,
            module: "COURTS",
            debitPaise: booking.securityDepositPaise,
            paymentMethod: "REFUND",
            taxAmountPaise: 0,
            referenceType: "BOOKING",
            referenceId: booking.id,
          },
        });
      }

      await logAudit({
        userId,
        action: "CANCEL",
        entity: "BOOKING",
        entityId: booking.id,
        details: {
          bookingNumber: booking.bookingNumber,
          reason: cancelReason,
          refundedDepositPaise: booking.securityDepositPaise,
        },
        tx,
      });

      return updated;
    },
    { timeout: 15000 }
  );
}

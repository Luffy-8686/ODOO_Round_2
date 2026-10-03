import { prisma } from "./prisma";
import { sendNotification } from "./notifications";
import { logAudit } from "./audit";

/**
 * Runs the automated background maintenance routine:
 * 1. Releases unpaid PENDING court bookings older than 10 minutes.
 * 2. Checks expiring memberships (30, 15, 7 days) and sends reminders.
 * 3. Flags expired memberships (sets Member status to EXPIRED & Membership status to EXPIRED).
 * 4. Alerts staff for unanswered leads older than 24 hours.
 */
export async function runBackgroundWorker() {
  const results = {
    releasedBookings: 0,
    expiryAlertsSent: 0,
    membershipsExpired: 0,
    staleLeadsAlerted: 0,
  };

  const now = new Date();

  // 1. Release unpaid PENDING bookings after 10 minutes
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
  const pendingBookings = await prisma.booking.findMany({
    where: {
      status: "PENDING",
      paymentStatus: "UNPAID",
      createdAt: { lt: tenMinutesAgo },
    },
  });

  for (const booking of pendingBookings) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "CANCELLED",
        cancelledAt: now,
        cancelReason: "Auto-released: 10-minute payment window expired",
      },
    });
    results.releasedBookings++;
  }

  // 2. Check for memberships expiring soon (30, 15, 7 days)
  const activeMemberships = await prisma.membership.findMany({
    where: { status: "ACTIVE" },
    include: { member: true, plan: true },
  });

  for (const membership of activeMemberships) {
    const diffDays = Math.ceil(
      (membership.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays <= 0) {
      // Mark as EXPIRED
      await prisma.membership.update({
        where: { id: membership.id },
        data: { status: "EXPIRED" },
      });

      await prisma.member.update({
        where: { id: membership.memberId },
        data: { status: "EXPIRED" },
      });

      await sendNotification({
        memberId: membership.memberId,
        type: "MEMBERSHIP_EXPIRED",
        title: "Membership Expired",
        message: `Your ${membership.plan.name} membership expired on ${membership.endDate.toLocaleDateString()}. Renew now to retain member pricing and court booking privileges.`,
        channel: "WHATSAPP",
      });

      results.membershipsExpired++;
    } else if (diffDays === 30 || diffDays === 15 || diffDays === 7 || diffDays === 1) {
      await prisma.member.update({
        where: { id: membership.memberId },
        data: { status: "EXPIRING_SOON" },
      });

      await sendNotification({
        memberId: membership.memberId,
        type: "MEMBERSHIP_EXPIRING",
        title: `Membership Expiring in ${diffDays} Days`,
        message: `Your ${membership.plan.name} plan expires on ${membership.endDate.toLocaleDateString()}. Tap to renew online.`,
        channel: "EMAIL",
      });

      results.expiryAlertsSent++;
    }
  }

  // 3. Highlight stale leads older than 24 hours without response
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const staleLeads = await prisma.lead.findMany({
    where: {
      status: "NEW",
      createdAt: { lt: oneDayAgo },
    },
  });

  for (const lead of staleLeads) {
    await sendNotification({
      type: "NEW_LEAD",
      title: "SLA Alert: Unanswered Lead > 24 Hours",
      message: `Enquiry from ${lead.name} (${lead.phone}) has been waiting for more than 24 hours.`,
      channel: "IN_APP",
    });
    results.staleLeadsAlerted++;
  }

  await logAudit({
    action: "STATUS_CHANGE",
    entity: "SETTING",
    entityId: "CRON_WORKER",
    details: results,
  });

  return results;
}

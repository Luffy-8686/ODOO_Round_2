import { prisma } from "./prisma";

export interface SendNotificationParams {
  userId?: string | null;
  memberId?: string | null;
  type:
    | "BOOKING_CONFIRMED"
    | "BOOKING_REMINDER"
    | "BOOKING_CANCELLED"
    | "MEMBERSHIP_EXPIRING"
    | "MEMBERSHIP_EXPIRED"
    | "LOW_STOCK"
    | "NEW_LEAD"
    | "ORDER_STATUS"
    | "TAB_ALERT"
    | "WAITLIST_PROMOTED";
  title: string;
  message: string;
  channel?: "IN_APP" | "EMAIL" | "SMS" | "WHATSAPP";
  tx?: any;
}

export async function sendNotification(params: SendNotificationParams) {
  const db = params.tx || prisma;
  try {
    const record = await db.notification.create({
      data: {
        userId: params.userId,
        memberId: params.memberId,
        type: params.type,
        title: params.title,
        message: params.message,
        channel: params.channel || "IN_APP",
        status: "SENT",
      },
    });

    return record;
  } catch (error) {
    console.error("Failed to record notification:", error);
  }
}

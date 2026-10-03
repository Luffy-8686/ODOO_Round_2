import { prisma } from "./prisma";

export interface AuditParams {
  userId?: string | null;
  userName?: string;
  userRole?: string;
  action:
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "STATUS_CHANGE"
    | "PAYMENT"
    | "CHECK_IN"
    | "RESERVE"
    | "CANCEL"
    | "LOGIN"
    | "CREATE_USER"
    | "UPDATE_USER_ROLE"
    | "EXECUTE_PAYROLL"
    | string;
  entity?: string;
  entityType?: string;
  entityId: string;
  details?: Record<string, any>;
  before?: Record<string, any>;
  after?: Record<string, any>;
  ipAddress?: string;
  tx?: any;
}

export async function logAudit(params: AuditParams) {
  const db = params.tx || prisma;
  try {
    const details = params.details || {
      ...(params.before ? { before: params.before } : {}),
      ...(params.after ? { after: params.after } : {}),
    };

    return await db.auditLog.create({
      data: {
        userId: params.userId,
        userName: params.userName || "System / Staff",
        userRole: params.userRole || "STAFF",
        action: params.action,
        entity: params.entity || params.entityType || "SYSTEM",
        entityId: params.entityId,
        detailsJson: Object.keys(details).length > 0 ? JSON.stringify(details) : null,
        ipAddress: params.ipAddress || "127.0.0.1",
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}

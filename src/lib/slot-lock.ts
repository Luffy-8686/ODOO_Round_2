import { prisma } from "./prisma";

export const SLOT_LOCK_TTL_SECONDS = 300; // 5 minutes

export interface AcquireLockResult {
  acquired: boolean;
  lockId?: string;
  sessionId?: string;
  expiresAt?: Date;
  /** How many seconds remain on an existing lock held by someone else */
  secondsRemaining?: number;
  lockedByMe?: boolean;
}

/**
 * Attempts to acquire an exclusive 300-second TTL lock on a (courtId, slotTime) pair.
 *
 * Rules:
 * - If no live lock exists → create one and return acquired = true
 * - If an active lock exists with the SAME sessionId → refresh its TTL and return acquired = true (idempotent)
 * - If an active lock exists with a DIFFERENT sessionId → return acquired = false with secondsRemaining
 */
export async function acquireSlotLock(
  courtId: string,
  slotTime: Date,
  sessionId: string,
  memberId?: string | null
): Promise<AcquireLockResult> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SLOT_LOCK_TTL_SECONDS * 1000);

  // 1. Check if an active (non-expired) lock already exists
  const existing = await prisma.slotLock.findUnique({
    where: { courtId_slotTime: { courtId, slotTime } },
  });

  if (existing) {
    const isExpired = existing.expiresAt <= now;

    if (!isExpired) {
      // Lock is alive
      if (existing.sessionId === sessionId) {
        // It's ours — refresh TTL (upsert-style update)
        const refreshed = await prisma.slotLock.update({
          where: { id: existing.id },
          data: { expiresAt },
        });
        return {
          acquired: true,
          lockId: refreshed.id,
          sessionId: refreshed.sessionId,
          expiresAt: refreshed.expiresAt,
          lockedByMe: true,
        };
      } else {
        // Held by someone else
        const secondsRemaining = Math.ceil(
          (existing.expiresAt.getTime() - now.getTime()) / 1000
        );
        return {
          acquired: false,
          secondsRemaining,
          lockedByMe: false,
        };
      }
    }

    // Lock expired — delete it so we can recreate
    await prisma.slotLock.delete({ where: { id: existing.id } }).catch(() => {});
  }

  // 2. No live lock — create one
  try {
    const lock = await prisma.slotLock.create({
      data: {
        courtId,
        slotTime,
        memberId: memberId ?? null,
        sessionId,
        expiresAt,
      },
    });

    return {
      acquired: true,
      lockId: lock.id,
      sessionId: lock.sessionId,
      expiresAt: lock.expiresAt,
      lockedByMe: true,
    };
  } catch (err: any) {
    // Unique constraint violation — another request beat us to it (race)
    const winner = await prisma.slotLock.findUnique({
      where: { courtId_slotTime: { courtId, slotTime } },
    });
    const secondsRemaining = winner
      ? Math.max(0, Math.ceil((winner.expiresAt.getTime() - Date.now()) / 1000))
      : 0;
    return { acquired: false, secondsRemaining, lockedByMe: false };
  }
}

/**
 * Releases a lock — only the session that owns it can release it.
 */
export async function releaseSlotLock(
  courtId: string,
  slotTime: Date,
  sessionId: string
): Promise<{ released: boolean }> {
  const lock = await prisma.slotLock.findUnique({
    where: { courtId_slotTime: { courtId, slotTime } },
  });

  if (!lock || lock.sessionId !== sessionId) {
    return { released: false };
  }

  await prisma.slotLock.delete({ where: { id: lock.id } });
  return { released: true };
}

/**
 * Returns active (non-expired) locks for a court on a given day.
 * Used by the courts API to include lock data in slot availability.
 */
export async function getActiveLocksForDate(
  courtIds: string[],
  dateStr: string // YYYY-MM-DD (local date)
): Promise<
  Array<{ courtId: string; slotTime: Date; expiresAt: Date; sessionId: string }>
> {
  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);
  const now = new Date();

  const locks = await prisma.slotLock.findMany({
    where: {
      courtId: { in: courtIds },
      slotTime: { gte: startOfDay, lte: endOfDay },
      expiresAt: { gt: now }, // only live locks
    },
    select: {
      courtId: true,
      slotTime: true,
      expiresAt: true,
      sessionId: true,
    },
  });

  return locks;
}

/**
 * Cleans up all expired locks. Call from a cron job.
 */
export async function purgeExpiredLocks(): Promise<number> {
  const result = await prisma.slotLock.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  });
  return result.count;
}

/**
 * Check if a slot is currently locked by anyone (used inside booking validation).
 */
export async function isSlotLocked(
  courtId: string,
  slotTime: Date,
  excludeSessionId?: string
): Promise<{ locked: boolean; secondsRemaining?: number }> {
  const now = new Date();
  const lock = await prisma.slotLock.findUnique({
    where: { courtId_slotTime: { courtId, slotTime } },
  });

  if (!lock || lock.expiresAt <= now) return { locked: false };
  if (excludeSessionId && lock.sessionId === excludeSessionId) return { locked: false };

  return {
    locked: true,
    secondsRemaining: Math.ceil((lock.expiresAt.getTime() - now.getTime()) / 1000),
  };
}

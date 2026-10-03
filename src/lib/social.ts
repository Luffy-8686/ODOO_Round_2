import { prisma } from "@/lib/prisma";

/**
 * Ensures a recurring Friday Night Social Session exists in the database for the given date.
 * If the date is a Friday (dayOfWeek === 5) and no session exists, creates it dynamically.
 */
export async function ensureFridaySocialSession(dateInput: Date | string, tx?: any) {
  const db = tx || prisma;
  const d = typeof dateInput === "string" ? new Date(dateInput.includes("T") ? dateInput : `${dateInput}T12:00:00`) : new Date(dateInput);

  // Check if it's Friday (0 = Sunday, 1 = Monday, ..., 5 = Friday)
  if (d.getDay() !== 5) {
    return null;
  }

  const year = d.getFullYear();
  const month = d.getMonth();
  const date = d.getDate();

  const startOfDay = new Date(year, month, date, 0, 0, 0, 0);
  const endOfDay = new Date(year, month, date, 23, 59, 59, 999);

  // Check if session already exists for this Friday
  const existing = await db.socialSession.findFirst({
    where: {
      startTime: { gte: startOfDay, lte: endOfDay },
      status: "ACTIVE",
    },
    include: {
      court: { include: { sport: true } },
      participants: {
        include: { member: true },
      },
    },
  });

  if (existing) {
    return existing;
  }

  // Find Padel Court 1 (or any active Padel court)
  let padelCourt = await db.court.findFirst({
    where: {
      name: { contains: "Padel Court 1" },
      status: "ACTIVE",
    },
    include: { sport: true },
  });

  if (!padelCourt) {
    padelCourt = await db.court.findFirst({
      where: {
        sport: { name: { contains: "Padel" } },
        status: "ACTIVE",
      },
      include: { sport: true },
    });
  }

  if (!padelCourt) {
    // Fallback to any active court
    padelCourt = await db.court.findFirst({ where: { status: "ACTIVE" }, include: { sport: true } });
  }

  if (!padelCourt) {
    return null;
  }

  const sessionStart = new Date(year, month, date, 19, 0, 0, 0); // 7:00 PM
  const sessionEnd = new Date(year, month, date, 21, 0, 0, 0);   // 9:00 PM

  // Create recurring Friday Night Social session
  const created = await db.socialSession.create({
    data: {
      courtId: padelCourt.id,
      name: "Friday Night Padel Social & Mix-In",
      dayOfWeek: 5,
      startTime: sessionStart,
      endTime: sessionEnd,
      capacity: 12,
      pricePerPersonPaise: 35000, // ₹350
      description: "King of the court format, music, complimentary drinks, all skill levels welcome.",
      status: "ACTIVE",
    },
    include: {
      court: { include: { sport: true } },
      participants: {
        include: { member: true },
      },
    },
  });

  return created;
}

/**
 * Pre-populates all upcoming Friday Night Social sessions for the next N weeks (default: 52 weeks)
 */
export async function seedUpcomingFridaySocialSessions(weeksAhead = 52) {
  const sessions = [];
  const now = new Date();

  for (let i = 0; i < weeksAhead; i++) {
    const target = new Date(now);
    // Find Friday for current week + i
    const dayDiff = (5 - target.getDay() + 7) % 7 + (i * 7);
    target.setDate(target.getDate() + dayDiff);
    const session = await ensureFridaySocialSession(target);
    if (session) sessions.push(session);
  }
  return sessions;
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.setting.findMany();
    const plans = await prisma.plan.findMany({ orderBy: { monthlyFeePaise: "desc" } });
    const sports = await prisma.sport.findMany({ include: { courts: true } });

    return NextResponse.json({ settings, plans, sports });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.type === "PLAN_UPDATE") {
      const plan = await prisma.plan.update({
        where: { id: body.id },
        data: {
          monthlyFeePaise: body.monthlyFeePaise,
          annualFeePaise: body.annualFeePaise,
          courtRatePerHourPaise: body.courtRatePerHourPaise,
          shopDiscountPercent: body.shopDiscountPercent,
          barDiscountPercent: body.barDiscountPercent,
          maxBookingsPerDay: body.maxBookingsPerDay,
          advanceBookingDays: body.advanceBookingDays,
        },
      });
      return NextResponse.json({ success: true, plan });
    }

    if (body.type === "SETTING_UPDATE") {
      const setting = await prisma.setting.upsert({
        where: { key: body.key },
        update: { valueJson: JSON.stringify(body.value) },
        create: { key: body.key, valueJson: JSON.stringify(body.value) },
      });
      return NextResponse.json({ success: true, setting });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateAge } from "@/lib/formatters";
import { logAudit } from "@/lib/audit";

interface ImportRow {
  name: string;
  email: string;
  phone: string;
  tier: string;
  dateOfBirth?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  address?: string;
}

export async function POST(req: Request) {
  try {
    const { rows, dryRun } = (await req.json()) as { rows: ImportRow[]; dryRun?: boolean };

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows provided for import" }, { status: 400 });
    }

    const plans = await prisma.plan.findMany();
    const planMap = new Map(plans.map((p) => [p.tier.toUpperCase(), p]));

    const existingMembers = await prisma.member.findMany({
      select: { email: true, phone: true, memberId: true },
    });
    const existingEmails = new Set(existingMembers.map((m) => m.email.toLowerCase()));
    const existingPhones = new Set(existingMembers.map((m) => m.phone));

    const validatedRows = [];
    let validCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const errors: string[] = [];

      if (!row.name?.trim()) errors.push("Missing name");
      if (!row.email?.trim()) errors.push("Missing email");
      if (!row.phone?.trim()) errors.push("Missing phone");

      const tierKey = (row.tier || "SILVER").toUpperCase();
      const plan = planMap.get(tierKey) || planMap.get("SILVER");

      if (existingEmails.has(row.email?.toLowerCase().trim())) {
        errors.push(`Duplicate email (already in system)`);
      }
      if (existingPhones.has(row.phone?.trim())) {
        errors.push(`Duplicate phone (already in system)`);
      }

      if (plan?.tier === "JUNIOR") {
        if (!row.dateOfBirth) {
          errors.push("DOB required for Junior tier");
        } else {
          const age = calculateAge(row.dateOfBirth);
          if (age >= 18) {
            errors.push(`Age ${age} is >= 18 (Junior tier disallowed)`);
          }
        }
      }

      const isValid = errors.length === 0;
      if (isValid) {
        validCount++;
      } else if (errors.some((e) => e.includes("Duplicate"))) {
        duplicateCount++;
      } else {
        errorCount++;
      }

      validatedRows.push({
        rowIndex: i + 1,
        data: row,
        planTier: plan?.tier || "SILVER",
        isValid,
        errors,
      });
    }

    // If dryRun, return analysis preview
    if (dryRun) {
      return NextResponse.json({
        preview: true,
        totalRows: rows.length,
        validCount,
        duplicateCount,
        errorCount,
        rows: validatedRows,
      });
    }

    // Otherwise perform the import for all valid rows
    let imported = 0;
    for (const v of validatedRows) {
      if (!v.isValid) continue;

      const plan = planMap.get(v.planTier)!;
      const count = await prisma.member.count();
      const memberId = `CC-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

      const user = await prisma.user.create({
        data: {
          name: v.data.name,
          email: v.data.email,
          phone: v.data.phone,
          role: "MEMBER",
        },
      });

      const member = await prisma.member.create({
        data: {
          memberId,
          userId: user.id,
          name: v.data.name,
          email: v.data.email,
          phone: v.data.phone,
          dateOfBirth: v.data.dateOfBirth ? new Date(v.data.dateOfBirth) : null,
          emergencyContactName: v.data.emergencyContactName,
          emergencyContactPhone: v.data.emergencyContactPhone,
          address: v.data.address,
          status: "ACTIVE",
          qrCodeData: `MEMBER:${memberId}:${v.data.name}:${plan.tier}`,
        },
      });

      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);

      await prisma.membership.create({
        data: {
          memberId: member.id,
          planId: plan.id,
          tier: plan.tier,
          startDate,
          endDate,
          billingCycle: "ANNUAL",
          status: "ACTIVE",
          amountPaidPaise: plan.annualFeePaise,
          paymentMethod: "CSV_IMPORT",
        },
      });

      imported++;
    }

    await logAudit({
      action: "CREATE",
      entity: "MEMBER",
      entityId: "CSV_BULK_IMPORT",
      details: { totalRows: rows.length, imported },
    });

    return NextResponse.json({
      success: true,
      totalRows: rows.length,
      imported,
      skipped: rows.length - imported,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

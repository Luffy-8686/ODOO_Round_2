import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(req: Request) {
  try {
    const session = await getServerAuthSession();
    if (!session || (session.user?.role !== "OWNER" && session.user?.role !== "MANAGER")) {
      return NextResponse.json(
        { error: "Forbidden. HR management requires Manager or Owner privileges." },
        { status: 403 }
      );
    }

    const isOwner = session.user?.role === "OWNER";
    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view"); // employees, attendance, leaves, payroll

    if (view === "payroll") {
      if (!isOwner) {
        return NextResponse.json(
          { error: "Forbidden. Payroll and compensation data is restricted exclusively to Club Owners." },
          { status: 403 }
        );
      }

      const payrolls = await prisma.payroll.findMany({
        include: { payslips: { include: { employee: true } } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ payrolls });
    }

    if (view === "leaves") {
      const leaves = await prisma.leaveRequest.findMany({
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              employeeCode: true,
              role: true,
              phone: true,
              // monthlySalaryPaise is stripped
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ leaves });
    }

    const employees = await prisma.employee.findMany({
      include: {
        shifts: { orderBy: { clockIn: "desc" }, take: 1 },
        leaveRequests: { where: { status: "PENDING" } },
        attendances: { orderBy: { date: "desc" }, take: 5 },
      },
      orderBy: { name: "asc" },
    });

    // Strip monthlySalaryPaise for non-owner
    const sanitizedEmployees = employees.map((emp) => {
      if (isOwner) return emp;
      const { monthlySalaryPaise, ...rest } = emp;
      return rest;
    });

    return NextResponse.json({ employees: sanitizedEmployees });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isOwner = session.user?.role === "OWNER";
    const isManager = session.user?.role === "MANAGER";
    const body = await req.json();

    if (body.action === "LEAVE_REQUEST") {
      const leave = await prisma.leaveRequest.create({
        data: {
          employeeId: body.employeeId,
          leaveType: body.leaveType || "CASUAL",
          startDate: new Date(body.startDate),
          endDate: new Date(body.endDate),
          reason: body.reason,
          status: "PENDING",
        },
      });
      return NextResponse.json({ success: true, leave });
    }

    if (body.action === "LEAVE_DECISION") {
      if (!isOwner && !isManager) {
        return NextResponse.json({ error: "Forbidden to approve leaves" }, { status: 403 });
      }

      const leave = await prisma.leaveRequest.update({
        where: { id: body.leaveId },
        data: {
          status: body.status, // APPROVED, REJECTED
          approvedByUserId: session.user.id,
        },
      });

      await logAudit({
        userId: session.user.id,
        action: `LEAVE_${body.status}`,
        entityType: "LeaveRequest",
        entityId: leave.id,
        after: { status: leave.status },
      });

      return NextResponse.json({ success: true, leave });
    }

    if (body.action === "RUN_PAYROLL") {
      if (!isOwner) {
        return NextResponse.json(
          { error: "Forbidden. Only Club Owners can execute payroll runs." },
          { status: 403 }
        );
      }

      const month = body.month || new Date().getMonth() + 1;
      const year = body.year || new Date().getFullYear();

      const employees = await prisma.employee.findMany({ where: { status: "ACTIVE" } });
      const totalBase = employees.reduce((sum, e) => sum + e.monthlySalaryPaise, 0);

      const payrollNumber = `PAY-${year}-${String(month).padStart(2, "0")}`;

      const payroll = await prisma.payroll.create({
        data: {
          payrollNumber,
          month,
          year,
          totalBasePaise: totalBase,
          totalNetPaise: totalBase,
          status: "PAID",
          processedDate: new Date(),
        },
      });

      for (const emp of employees) {
        const psNumber = `PS-${year}-${String(month).padStart(2, "0")}-${emp.employeeCode}`;
        await prisma.payslip.create({
          data: {
            payslipNumber: psNumber,
            payrollId: payroll.id,
            employeeId: emp.id,
            month,
            year,
            baseSalaryPaise: emp.monthlySalaryPaise,
            netSalaryPaise: emp.monthlySalaryPaise,
            paymentDate: new Date(),
            status: "PAID",
          },
        });
      }

      // Record payroll expense in ledger
      const txCount = await prisma.ledgerTransaction.count();
      await prisma.ledgerTransaction.create({
        data: {
          entryNumber: `TX-${year}-${String(txCount + 1).padStart(6, "0")}`,
          description: `Staff Payroll Disbursal - Month ${month}/${year}`,
          module: "PAYROLL",
          debitPaise: totalBase,
          paymentMethod: "BANK_TRANSFER",
          referenceType: "PAYROLL",
          referenceId: payroll.id,
        },
      });

      await logAudit({
        userId: session.user.id,
        action: "EXECUTE_PAYROLL",
        entityType: "Payroll",
        entityId: payroll.id,
        after: { payrollNumber, totalBasePaise: totalBase },
      });

      return NextResponse.json({ success: true, payroll });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

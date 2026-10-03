import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerAuthSession();
    if (!session || session.user?.role !== "OWNER") {
      return NextResponse.json(
        { error: "Forbidden. Financial ledger and P&L reports are restricted to Club Owners." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view"); // ledger, invoices, expenses, tax

    if (view === "ledger") {
      const transactions = await prisma.ledgerTransaction.findMany({
        orderBy: { date: "desc" },
        take: 100,
      });
      return NextResponse.json({ transactions });
    }

    if (view === "invoices") {
      const invoices = await prisma.invoice.findMany({
        include: { lines: true, member: true },
        orderBy: { issueDate: "desc" },
        take: 50,
      });
      return NextResponse.json({ invoices });
    }

    if (view === "expenses") {
      const expenses = await prisma.expense.findMany({
        include: { vendor: true },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ expenses });
    }

    if (view === "tax") {
      // Tax summary (Tax collected on sales vs Tax paid on expenses)
      const txs = await prisma.ledgerTransaction.findMany({
        where: { taxAmountPaise: { gt: 0 } },
      });
      const taxCollectedPaise = txs.reduce((sum, t) => sum + t.taxAmountPaise, 0);

      const expenses = await prisma.expense.findMany({
        where: { taxPaise: { gt: 0 } },
      });
      const taxPaidPaise = expenses.reduce((sum, e) => sum + e.taxPaise, 0);

      return NextResponse.json({
        taxCollectedPaise,
        taxPaidPaise,
        netGstPayablePaise: Math.max(0, taxCollectedPaise - taxPaidPaise),
      });
    }

    // Default overview
    const totalRevenue = await prisma.ledgerTransaction.aggregate({
      _sum: { creditPaise: true },
    });
    const totalExpenses = await prisma.expense.aggregate({
      _sum: { amountPaise: true },
    });

    return NextResponse.json({
      totalRevenuePaise: totalRevenue._sum.creditPaise || 0,
      totalExpensePaise: totalExpenses._sum.amountPaise || 0,
      netProfitPaise: (totalRevenue._sum.creditPaise || 0) - (totalExpenses._sum.amountPaise || 0),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

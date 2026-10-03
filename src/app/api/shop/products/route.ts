import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerAuthSession();
    const userRole = session?.user?.role;
    const canSeeCost = userRole === "OWNER" || userRole === "MANAGER";

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const lowStockOnly = searchParams.get("lowStock") === "true";
    const query = searchParams.get("q") || "";

    const products = await prisma.product.findMany({
      where: {
        AND: [
          category ? { category } : {},
          query
            ? {
                OR: [
                  { name: { contains: query } },
                  { brand: { contains: query } },
                  { sku: { contains: query } },
                ],
              }
            : {},
        ],
      },
      include: {
        variants: {
          include: {
            stockMovements: {
              orderBy: { createdAt: "desc" },
              take: 5,
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Filter low stock if requested
    const filtered = lowStockOnly
      ? products.filter((p) =>
          p.variants.some((v) => v.stockQuantity <= p.reorderLevel)
        )
      : products;

    // Field-level sanitization: strip costPricePaise if not privileged
    const sanitized = filtered.map((p) => {
      if (canSeeCost) return p;
      const { costPricePaise, ...rest } = p;
      return rest;
    });

    return NextResponse.json({ products: sanitized });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

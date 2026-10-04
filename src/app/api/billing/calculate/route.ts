import { NextResponse } from "next/server";
import { calculateBillingDetails, resolveApiKey } from "@/lib/billing";

/**
 * POST /api/billing/calculate
 * Computes complete itemized billing preview:
 * - Full price of every product
 * - Membership discount deduction (based on tier rules)
 * - 100 INR security deposit
 * - Final payable amount
 * - API Key reference verification
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "No items provided for billing calculation" }, { status: 400 });
    }

    // Header or body API key
    const headerApiKey = req.headers.get("x-billing-api-key") || req.headers.get("authorization")?.replace("Bearer ", "");
    const apiKey = body.apiKey || headerApiKey;

    const billing = await calculateBillingDetails({
      items: body.items,
      memberId: body.memberId,
      memberTier: body.memberTier,
      apiKey: apiKey,
    });

    return NextResponse.json({
      success: true,
      billing,
    });
  } catch (error: any) {
    console.error("Billing calculation error:", error);
    return NextResponse.json({ error: error.message || "Failed to calculate billing" }, { status: 400 });
  }
}

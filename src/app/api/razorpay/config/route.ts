import { NextResponse } from "next/server";
import { getRazorpayConfig } from "@/lib/razorpay";
import fs from "fs";
import path from "path";

export async function GET() {
  const config = getRazorpayConfig();
  return NextResponse.json({
    success: true,
    config,
    rules: {
      goldMemberDepositPaise: 10000,
      goldMemberDepositINR: 100,
      goldCourtAccessFee: 0,
      depositPolicy: "Refundable automatically when court slot session ends",
      otherTiersPolicy: "Regular tiered discount applied to court fee; ₹0 security deposit",
    },
  });
}

/**
 * POST /api/razorpay/config
 * Allows pasting/updating Razorpay API keys directly from the UI or tests
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { keyId, keySecret } = body;

    if (!keyId || typeof keyId !== "string" || !keyId.startsWith("rzp_")) {
      return NextResponse.json(
        { error: "Invalid Razorpay Key ID. Must start with 'rzp_test_' (for trial) or 'rzp_live_'." },
        { status: 400 }
      );
    }

    if (!keySecret || typeof keySecret !== "string" || keySecret.length < 6) {
      return NextResponse.json(
        { error: "Invalid Razorpay Key Secret. Please provide the secret associated with this Key ID." },
        { status: 400 }
      );
    }

    // Set in current process environment immediately (using variable keys so Webpack DefinePlugin cannot replace with literal)
    const pubKeyName = "NEXT_PUBLIC_RAZORPAY_KEY_ID";
    const secKeyName = "RAZORPAY_KEY_SECRET";
    const idKeyName = "RAZORPAY_KEY_ID";
    process.env[idKeyName] = keyId.trim();
    process.env[secKeyName] = keySecret.trim();
    process.env[pubKeyName] = keyId.trim();

    // Persist to .env file if accessible
    try {
      const envPath = path.resolve(process.cwd(), ".env");
      let envContent = "";
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, "utf-8");
      }

      const lines = envContent.split(/\r?\n/);
      const newLines: string[] = [];
      let foundKeyId = false;
      let foundKeySecret = false;
      let foundPubKeyId = false;

      for (const line of lines) {
        if (line.startsWith("RAZORPAY_KEY_ID=")) {
          newLines.push(`RAZORPAY_KEY_ID="${keyId.trim()}"`);
          foundKeyId = true;
        } else if (line.startsWith("RAZORPAY_KEY_SECRET=")) {
          newLines.push(`RAZORPAY_KEY_SECRET="${keySecret.trim()}"`);
          foundKeySecret = true;
        } else if (line.startsWith("NEXT_PUBLIC_RAZORPAY_KEY_ID=")) {
          newLines.push(`NEXT_PUBLIC_RAZORPAY_KEY_ID="${keyId.trim()}"`);
          foundPubKeyId = true;
        } else {
          newLines.push(line);
        }
      }

      if (!foundKeyId) newLines.push(`RAZORPAY_KEY_ID="${keyId.trim()}"`);
      if (!foundKeySecret) newLines.push(`RAZORPAY_KEY_SECRET="${keySecret.trim()}"`);
      if (!foundPubKeyId) newLines.push(`NEXT_PUBLIC_RAZORPAY_KEY_ID="${keyId.trim()}"`);

      fs.writeFileSync(envPath, newLines.join("\n"), "utf-8");
    } catch (fsErr) {
      console.warn("Could not write directly to .env file:", fsErr);
    }

    const updatedConfig = getRazorpayConfig();

    return NextResponse.json({
      success: true,
      message: "Razorpay Trial Mode API Keys configured successfully!",
      config: updatedConfig,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update configuration" }, { status: 500 });
  }
}

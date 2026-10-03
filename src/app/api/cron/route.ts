import { NextResponse } from "next/server";
import { runBackgroundWorker } from "@/lib/cron";

export async function POST() {
  try {
    const result = await runBackgroundWorker();
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

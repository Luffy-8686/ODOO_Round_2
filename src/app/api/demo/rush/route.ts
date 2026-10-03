import { NextResponse } from "next/server";
import { trigger6PMRushSimulation } from "@/lib/demo-scenario";

export async function POST() {
  try {
    const result = await trigger6PMRushSimulation();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

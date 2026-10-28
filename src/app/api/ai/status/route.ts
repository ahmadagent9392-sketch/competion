import { NextResponse } from "next/server";
import { getModel, isConfigured } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ configured: isConfigured(), model: getModel() });
}

import { connection, NextResponse } from "next/server";
import { getModel, isConfigured } from "@/lib/ai";

export async function GET() {
  await connection(); // read env at request time, never prerender at build
  return NextResponse.json({ configured: isConfigured(), model: getModel() });
}

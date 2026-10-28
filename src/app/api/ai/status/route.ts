import { connection, NextResponse } from "next/server";
import { activeProvider, getModel, modelFor } from "@/lib/ai";

export async function GET() {
  await connection(); // read env at request time, never prerender at build
  const provider = activeProvider();
  return NextResponse.json({ configured: provider !== null, provider, model: provider ? modelFor(provider) : getModel() });
}

import { NextResponse } from "next/server";
import type { EmbeddedItem } from "@/lib/types";
import { ask } from "@/lib/generate";

export const runtime = "nodejs";

// POST /api/ask — body: { question: string, pool: EmbeddedItem[], mode?: "mock"|"live" }
export async function POST(req: Request) {
  let body: { question?: string; pool?: EmbeddedItem[]; mode?: "mock" | "live" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.question?.trim() || !Array.isArray(body.pool) || body.pool.length === 0) {
    return NextResponse.json({ error: "question and a non-empty pool are required" }, { status: 400 });
  }
  try {
    const result = await ask(body.question.slice(0, 500), body.pool, body.mode ?? "mock");
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ask failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

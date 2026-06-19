import { NextResponse } from "next/server";
import type { FeedbackItem } from "@/lib/types";
import { analyze, parseFeedback } from "@/lib/pipeline";

export const runtime = "nodejs";

// POST /api/analyze — body: { raw?: string, items?: FeedbackItem[], mode?: "mock"|"live" }
export async function POST(req: Request) {
  let body: { raw?: string; items?: FeedbackItem[]; mode?: "mock" | "live" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let items: FeedbackItem[] = [];
  if (Array.isArray(body.items) && body.items.length) {
    items = body.items;
  } else if (typeof body.raw === "string") {
    items = parseFeedback(body.raw);
  }

  if (items.length < 2) {
    return NextResponse.json({ error: "Provide at least 2 feedback items" }, { status: 400 });
  }
  if (items.length > 2000) {
    return NextResponse.json({ error: "Too many items (max 2000)" }, { status: 400 });
  }

  try {
    const { analysis, pool } = await analyze(items, body.mode ?? "mock");
    return NextResponse.json({ analysis, pool });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

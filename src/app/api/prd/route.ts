import { NextResponse } from "next/server";
import type { Cluster, EmbeddedItem } from "@/lib/types";
import { generatePRD } from "@/lib/generate";

export const runtime = "nodejs";

// POST /api/prd — body: { cluster: Cluster, pool: EmbeddedItem[], mode?: "mock"|"live" }
export async function POST(req: Request) {
  let body: { cluster?: Cluster; pool?: EmbeddedItem[]; mode?: "mock" | "live" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.cluster || !Array.isArray(body.pool)) {
    return NextResponse.json({ error: "cluster and pool are required" }, { status: 400 });
  }
  try {
    const prd = await generatePRD(body.cluster, body.pool, body.mode ?? "mock");
    return NextResponse.json({ prd });
  } catch (err) {
    const message = err instanceof Error ? err.message : "PRD generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

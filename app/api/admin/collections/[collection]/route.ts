import { NextResponse } from "next/server";
import { getAdminResource, writeAdminResource } from "@/lib/neon/admin";
import { requireAdmin, requireSameOrigin } from "@/lib/neon/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ collection: string }> }) {
  try { await requireAdmin(); return NextResponse.json(await getAdminResource((await params).collection)); }
  catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
}

export async function POST(request: Request, { params }: { params: Promise<{ collection: string }> }) {
  try { requireSameOrigin(request); await requireAdmin(); const id = await writeAdminResource((await params).collection, undefined, await request.json()); return NextResponse.json({ id }, { status: 201 }); }
  catch (error) { const message = error instanceof Error ? error.message : "Request failed"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 }); }
}

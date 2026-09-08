import { NextResponse } from "next/server";
import { deleteAdminResource, getAdminResource, writeAdminResource } from "@/lib/neon/admin";
import { requireAdmin, requireSameOrigin } from "@/lib/neon/auth";

type Context = { params: Promise<{ collection: string; id: string }> };
export async function GET(_request: Request, { params }: Context) {
  try { await requireAdmin(); const { collection, id } = await params; return NextResponse.json(await getAdminResource(collection, id)); }
  catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
}
export async function PUT(request: Request, { params }: Context) {
  try { requireSameOrigin(request); await requireAdmin(); const { collection, id } = await params; await writeAdminResource(collection, id, await request.json()); return NextResponse.json({ success: true, id }); }
  catch (error) { const message = error instanceof Error ? error.message : "Request failed"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 }); }
}
export async function DELETE(request: Request, { params }: Context) {
  try { requireSameOrigin(request); await requireAdmin(); const { collection, id } = await params; await deleteAdminResource(collection, id); return NextResponse.json({ success: true }); }
  catch (error) { const message = error instanceof Error ? error.message : "Request failed"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 }); }
}

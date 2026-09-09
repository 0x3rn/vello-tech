import { NextResponse } from "next/server";
import { deleteProduct, getProduct } from "@/lib/neon/admin";
import { invalidateCatalogCache } from "@/lib/neon/catalog";
import { requireAdmin, requireSameOrigin } from "@/lib/neon/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); return NextResponse.json(await getProduct((await params).id)); }
  catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { requireSameOrigin(request); await requireAdmin(); await deleteProduct((await params).id); invalidateCatalogCache(); return NextResponse.json({ success: true }); }
  catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
}

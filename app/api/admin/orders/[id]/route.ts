import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { createDatabase } from "@/db/client";
import { orders } from "@/db/schema";
import { requireAdmin, requireSameOrigin } from "@/lib/neon/auth";

const statuses = new Set(["pending", "processing", "shipped", "delivered", "cancelled"]);
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireSameOrigin(request);
    await requireAdmin();
    const { status } = await request.json();
    if (!statuses.has(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    await createDatabase().update(orders).set({ status }).where(eq(orders.id, (await params).id));
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
}

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireFirebaseUser, requireSameOrigin } from "@/lib/neon/auth";
import { createDatabase } from "@/db/client";
import { cartItems } from "@/db/schema";

export async function GET() {
  try {
    const identity = await requireFirebaseUser();
    const rows = await createDatabase().select().from(cartItems).where(eq(cartItems.userId, identity.uid));
    return NextResponse.json(rows.map((row) => ({ ...(row.sourceData as object), cartItemId: (row.sourceData as { cartItemId?: string }).cartItemId ?? row.id.replace(`${identity.uid}:cart:`, ""), id: row.productId, quantity: row.quantity })));
  } catch (error) {
    console.error("Unable to read Neon cart:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    requireSameOrigin(request);
    const identity = await requireFirebaseUser();
    const items = await request.json();
    if (!Array.isArray(items) || items.length > 100) return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
    const normalized = items.map((item: Record<string, unknown>, index) => {
      const productId = typeof item.id === "string" ? item.id : "";
      const quantity = Number(item.quantity);
      const cartItemId = typeof item.cartItemId === "string" ? item.cartItemId.slice(0, 500) : `${productId}:${index}`;
      if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new Error("Invalid cart item");
      return {
        id: `${identity.uid}:cart:${cartItemId}`, userId: identity.uid,
        productId, quantity,
        configuration: { selectedColor: item.selectedColor ?? null, selectedVariants: item.selectedVariants ?? null },
        sourceData: { ...item, cartItemId },
      };
    });
    const db = createDatabase();
    await db.transaction(async (tx) => {
      await tx.delete(cartItems).where(eq(cartItems.userId, identity.uid));
      if (normalized.length) await tx.insert(cartItems).values(normalized);
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save cart";
    console.error("Unable to save Neon cart:", error);
    return NextResponse.json({ error: message }, { status: /Unauthorized/.test(message) ? 401 : /Invalid/.test(message) ? 400 : 500 });
  }
}

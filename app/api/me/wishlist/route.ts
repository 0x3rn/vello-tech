import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireFirebaseUser, requireSameOrigin } from "@/lib/neon/auth";
import { createDatabase } from "@/db/client";
import { users } from "@/db/schema";

export async function PUT(request: Request) {
  try {
    requireSameOrigin(request);
    const identity = await requireFirebaseUser();
    const { wishlist } = await request.json();
    if (!Array.isArray(wishlist) || wishlist.length > 500 || !wishlist.every((item) => typeof item === "string" && item.length <= 500)) return NextResponse.json({ error: "Invalid wishlist" }, { status: 400 });
    const db = createDatabase();
    const [user] = await db.select().from(users).where(eq(users.id, identity.uid)).limit(1);
    await db.update(users).set({ sourceData: { ...(user?.sourceData as object ?? {}), wishlist } }).where(eq(users.id, identity.uid));
    return NextResponse.json({ wishlist });
  } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
}

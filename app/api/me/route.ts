import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireFirebaseUser, requireSameOrigin } from "@/lib/neon/auth";
import { createDatabase } from "@/db/client";
import { users } from "@/db/schema";

export async function GET() {
  try {
    const identity = await requireFirebaseUser();
    const [user] = await createDatabase().select().from(users).where(eq(users.id, identity.uid)).limit(1);
    return NextResponse.json(user ? { ...(user.sourceData as object), ...user, uid: user.id, wishlist: (user.sourceData as { wishlist?: string[] }).wishlist ?? [] } : null);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    requireSameOrigin(request);
    const identity = await requireFirebaseUser();
    const body = await request.json();
    const db = createDatabase();
    const [user] = await db.select().from(users).where(eq(users.id, identity.uid)).limit(1);
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : undefined;
    const phoneNumber = typeof body.phoneNumber === "string" ? body.phoneNumber.trim().slice(0, 50) : undefined;
    const address = typeof body.address === "string" ? body.address.trim().slice(0, 1000) : undefined;
    await db.update(users).set({
      ...(name !== undefined ? { name } : {}),
      ...(phoneNumber !== undefined ? { phoneNumber } : {}),
      ...(address !== undefined ? { sourceData: { ...((user?.sourceData as object) ?? {}), address } } : {}),
    }).where(eq(users.id, identity.uid));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

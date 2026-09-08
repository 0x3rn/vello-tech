import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireFirebaseUser, requireSameOrigin } from "@/lib/neon/auth";
import { createDatabase } from "@/db/client";
import { addresses, paymentMethods } from "@/db/schema";

function table(type: string) {
  if (type === "addresses") return addresses;
  if (type === "payment-methods") return paymentMethods;
  return null;
}

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const identity = await requireFirebaseUser();
    const { type, data } = await request.json();
    const target = table(type);
    if (!target || type !== "addresses" || !data || typeof data !== "object") return NextResponse.json({ error: "Only address creation is supported; payment details must be tokenized by a payment provider" }, { status: 400 });
    const address = data as Record<string, unknown>;
    const requiredFields = ["name", "street", "city", "state", "zip", "country"] as const;
    if (!requiredFields.every((field) => typeof address[field] === "string" && (address[field] as string).trim().length > 0 && (address[field] as string).length <= 500)) return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    const cleanAddress = Object.fromEntries(requiredFields.map((field) => [field, (address[field] as string).trim()]));
    const isDefault = address.isDefault === true;
    const id = crypto.randomUUID();
    const db = createDatabase();
    await db.transaction(async (tx) => {
      if (isDefault) await tx.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, identity.uid));
      await tx.insert(addresses).values({ id, userId: identity.uid, isDefault, sourceData: { ...cleanAddress, isDefault } });
    });
    return NextResponse.json({ id });
  } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
}

export async function DELETE(request: Request) {
  try {
    requireSameOrigin(request);
    const identity = await requireFirebaseUser();
    const { type, id } = await request.json();
    const target = table(type);
    if (!target || typeof id !== "string") return NextResponse.json({ error: "Invalid resource" }, { status: 400 });
    const db = createDatabase();
    if (type === "addresses") await db.delete(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, identity.uid)));
    else await db.delete(paymentMethods).where(and(eq(paymentMethods.id, id), eq(paymentMethods.userId, identity.uid)));
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
}

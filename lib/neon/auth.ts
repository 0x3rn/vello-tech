import "server-only";

import { cookies } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { getAdminAuth } from "@/lib/firebase-admin";
import { createDatabase } from "@/db/client";
import { users } from "@/db/schema";

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) throw new Error("Invalid request origin");
}

export async function requireFirebaseUser() {
  const session = (await cookies()).get("__session")?.value;
  if (!session) throw new Error("Unauthorized");
  return getAdminAuth().verifySessionCookie(session, true);
}

export async function requireBearerUser(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw new Error("Unauthorized");
  const token = authorization.slice(7).trim();
  if (!token) throw new Error("Unauthorized");
  return getAdminAuth().verifyIdToken(token, true);
}

export async function requireAdmin() {
  const identity = await requireFirebaseUser();
  const [user] = await createDatabase().select({ role: users.role }).from(users).where(eq(users.id, identity.uid)).limit(1);
  if (user?.role !== "admin") throw new Error("Forbidden");
  return identity;
}

export async function requireAdminBearer(request: Request) {
  const identity = await requireBearerUser(request);
  const [user] = await createDatabase().select({ role: users.role }).from(users).where(eq(users.id, identity.uid)).limit(1);
  if (user?.role !== "admin") throw new Error("Forbidden");
  return identity;
}

export async function ensureNeonUser(input: { uid: string; email?: string; name?: string }) {
  const db = createDatabase();
  await db.insert(users).values({ id: input.uid, email: input.email ?? null, name: input.name ?? null, createdAt: new Date(), sourceData: {} })
    .onConflictDoUpdate({ target: users.id, set: {
      email: input.email ?? sql`${users.email}`,
      name: sql`coalesce(${users.name}, ${input.name ?? null})`,
    } });
  const [user] = await db.select().from(users).where(eq(users.id, input.uid)).limit(1);
  return user;
}

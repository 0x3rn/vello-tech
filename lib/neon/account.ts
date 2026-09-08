import "server-only";
import { desc, eq, inArray } from "drizzle-orm";
import { createDatabase } from "@/db/client";
import { addresses, orderItems, orders, paymentMethods, users } from "@/db/schema";

export async function getAccount(uid: string) {
  const db = createDatabase();
  const [user] = await db.select().from(users).where(eq(users.id, uid)).limit(1);
  return user ? { ...(user.sourceData as object), ...user, uid: user.id } : null;
}

export async function getOrders(uid: string, limit?: number) {
  const db = createDatabase();
  const rows = await db.select().from(orders).where(eq(orders.userId, uid)).orderBy(desc(orders.createdAt)).limit(limit ?? 100);
  const ids = rows.map((row) => row.id);
  const items = ids.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids)) : [];
  return rows.map((order) => ({ ...order, items: items.filter((item) => item.orderId === order.id) }));
}

export async function getAddresses(uid: string) {
  const rows = await createDatabase().select().from(addresses).where(eq(addresses.userId, uid));
  return rows.map((row) => ({ id: row.id, ...(row.sourceData as object), isDefault: row.isDefault }));
}

export async function getPaymentMethods(uid: string) {
  const rows = await createDatabase().select().from(paymentMethods).where(eq(paymentMethods.userId, uid));
  return rows.map((row) => ({ id: row.id, ...(row.sourceData as object) }));
}

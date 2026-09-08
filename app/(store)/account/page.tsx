import { redirect } from "next/navigation";
import { AccountClient } from "./account-client";
import { requireFirebaseUser } from "@/lib/neon/auth";
import { getAccount, getOrders } from "@/lib/neon/account";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  let identity;
  try { identity = await requireFirebaseUser(); } catch { redirect("/auth/login"); }
  const [userData, orders] = await Promise.all([getAccount(identity.uid), getOrders(identity.uid, 3)]);
  return <AccountClient initialUserData={{ ...userData, ordersCount: orders.length }} initialRecentOrders={orders.map((order) => ({ id: order.id, status: order.status[0].toUpperCase() + order.status.slice(1), date: order.createdAt?.toLocaleDateString() ?? "Unknown Date", items: order.items.length, total: `$${Number(order.totalAmount).toFixed(2)}` }))} />;
}

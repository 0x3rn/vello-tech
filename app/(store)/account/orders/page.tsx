import { redirect } from "next/navigation";
import { OrdersClient } from "./orders-client";
import { requireFirebaseUser } from "@/lib/neon/auth";
import { getOrders } from "@/lib/neon/account";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  let identity;
  try { identity = await requireFirebaseUser(); } catch { redirect("/auth/login"); }
  const orders = await getOrders(identity.uid);
  return <OrdersClient initialOrders={orders.map((order) => ({ id: order.id, orderId: order.id, date: order.createdAt?.toLocaleDateString() ?? "Unknown Date", status: order.status[0].toUpperCase() + order.status.slice(1), total: Number(order.totalAmount), items: order.items.length, products: order.items.map((item) => item.name), tracking: (order.sourceData as { tracking?: string }).tracking ?? null }))} />;
}

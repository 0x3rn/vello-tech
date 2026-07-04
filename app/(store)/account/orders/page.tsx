import { cookies } from "next/headers"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { redirect } from "next/navigation"
import { OrdersClient } from "./orders-client"

export const dynamic = "force-dynamic"

export default async function OrdersPage() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("__session")?.value

  if (!sessionCookie) {
    redirect("/auth/login")
  }

  let uid = null
  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true)
    uid = decodedClaims.uid
  } catch (error) {
    console.error("Invalid session cookie", error)
    redirect("/auth/login")
  }

  let orders: any[] = []

  try {
    const ordersSnap = await adminDb
      .collection("orders")
      .where("uid", "==", uid)
      .orderBy("createdAt", "desc")
      .get()

    ordersSnap.forEach((doc) => {
      const data = doc.data()
      const items = data.items || []
      let dateStr = "Unknown Date"
      if (data.createdAt) {
        dateStr = new Date(data.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })
      }
      orders.push({
        id: data.orderId || doc.id,
        orderId: data.orderId || doc.id,
        date: dateStr,
        status: data.status || "Processing",
        total: data.totalPaid || 0,
        items: items.length,
        products: items.map((i: any) => i.name),
        tracking: data.tracking || null,
      })
    })
  } catch (error) {
    console.error("Error fetching orders on server:", error)
  }

  return <OrdersClient initialOrders={orders} />
}
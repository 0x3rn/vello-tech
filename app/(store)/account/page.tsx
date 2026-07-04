import { cookies } from "next/headers"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { AccountClient } from "./account-client"
import { redirect } from "next/navigation"
import { cleanFirestoreData } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function AccountPage() {
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

  let userData = null
  let recentOrders: any[] = []

  try {
    const userDoc = await adminDb.collection("users").doc(uid).get()
    if (userDoc.exists) {
      const data = userDoc.data()
      if (data?.isAnonymous) {
        redirect("/auth/login")
      }
      userData = cleanFirestoreData({ uid, ...data })
    }

    const ordersSnap = await adminDb
      .collection("orders")
      .where("uid", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(3)
      .get()

    ordersSnap.forEach((doc) => {
      const data = doc.data()
      let dateStr = "Unknown Date"
      if (data.createdAt) {
        dateStr = new Date(data.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })
      }
      recentOrders.push({
        id: data.orderId || doc.id,
        status: data.status || "Processing",
        date: dateStr,
        items: (data.items || []).length,
        total: `$${(data.totalPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
      })
    })
  } catch (error) {
    console.error("Error fetching user data on server:", error)
  }

  return <AccountClient initialRecentOrders={recentOrders} initialUserData={userData} />
}
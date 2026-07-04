import { cookies } from "next/headers"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { redirect } from "next/navigation"
import { PaymentClient } from "./payment-client"
import { cleanFirestoreData } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function PaymentMethodsPage() {
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

  let methods: any[] = []

  try {
    const methodsSnap = await adminDb.collection("users").doc(uid).collection("paymentMethods").get()
    methodsSnap.forEach((doc) => {
      methods.push(cleanFirestoreData({ id: doc.id, ...doc.data() }))
    })
  } catch (error) {
    console.error("Error fetching payment methods on server:", error)
  }

  return <PaymentClient initialMethods={methods} />
}

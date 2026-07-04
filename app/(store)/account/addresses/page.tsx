import { cookies } from "next/headers"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { redirect } from "next/navigation"
import { AddressesClient } from "./addresses-client"
import { cleanFirestoreData } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function AddressesPage() {
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

  let addresses: any[] = []

  try {
    const addressesSnap = await adminDb.collection("users").doc(uid).collection("addresses").get()
    addressesSnap.forEach((doc) => {
      addresses.push(cleanFirestoreData({ id: doc.id, ...doc.data() }))
    })
  } catch (error) {
    console.error("Error fetching addresses on server:", error)
  }

  return <AddressesClient initialAddresses={addresses} />
}

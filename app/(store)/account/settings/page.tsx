import { cookies } from "next/headers"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { redirect } from "next/navigation"
import { SettingsClient } from "./settings-client"
import { cleanFirestoreData } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
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

  try {
    const userDoc = await adminDb.collection("users").doc(uid).get()
    if (userDoc.exists) {
      const data = userDoc.data()
      if (data?.isAnonymous) {
        redirect("/auth/login")
      }
      userData = cleanFirestoreData({ uid, ...data })
    }
  } catch (error) {
    console.error("Error fetching user data on server:", error)
  }

  return <SettingsClient initialUserData={userData} />
}

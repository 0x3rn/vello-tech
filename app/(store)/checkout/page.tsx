import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { CheckoutClient } from "./checkout-client"

export const revalidate = 3600 // Cache for 1 hour

export default async function CheckoutPage() {
  let initialFreeShippingThreshold: number | null = null

  try {
    const docRef = doc(db, "settings", "shipping")
    const snap = await getDoc(docRef)
    if (snap.exists() && typeof snap.data().threshold === 'number') {
      initialFreeShippingThreshold = snap.data().threshold
    }
  } catch (e) {
    console.error("Failed to fetch shipping threshold on server", e)
  }

  return <CheckoutClient initialFreeShippingThreshold={initialFreeShippingThreshold} />
}
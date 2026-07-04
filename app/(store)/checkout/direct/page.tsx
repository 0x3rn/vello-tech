import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { DirectCheckoutClient } from "./direct-checkout-client"

export const revalidate = 3600 // Cache for 1 hour

export default async function DirectCheckoutPage() {
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

  return <DirectCheckoutClient initialFreeShippingThreshold={initialFreeShippingThreshold} />
}

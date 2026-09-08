import { DirectCheckoutClient } from "./direct-checkout-client"
import { getShippingSettings } from "@/lib/neon/commerce"

export const revalidate = 3600 // Cache for 1 hour

export default async function DirectCheckoutPage() {
  const { freeShippingThreshold: initialFreeShippingThreshold } = await getShippingSettings()

  return <DirectCheckoutClient initialFreeShippingThreshold={initialFreeShippingThreshold} />
}

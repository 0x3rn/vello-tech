import { CheckoutClient } from "./checkout-client"
import { getShippingSettings } from "@/lib/neon/commerce"

export const revalidate = 3600 // Cache for 1 hour

export default async function CheckoutPage() {
  const { freeShippingThreshold: initialFreeShippingThreshold } = await getShippingSettings()

  return <CheckoutClient initialFreeShippingThreshold={initialFreeShippingThreshold} />
}

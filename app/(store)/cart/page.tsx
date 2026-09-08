import { CartClient } from "./cart-client"
import { getShippingSettings } from "@/lib/neon/commerce"

export const revalidate = 3600 // Cache for 1 hour

export default async function CartPage() {
  const { freeShippingThreshold: initialFreeShippingThreshold } = await getShippingSettings()

  return <CartClient initialFreeShippingThreshold={initialFreeShippingThreshold} />
}

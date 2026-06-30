import { NextResponse } from "next/server"
import crypto from "crypto"
import { adminDb } from "@/lib/firebase-admin"
import { sendOrderConfirmationEmail } from "@/lib/email"

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get("x-signature")

    if (!signature) {
      console.error("Lemon Squeezy Webhook Error: Missing signature")
      return NextResponse.json({ error: "ERR-VLT-PAY-202" }, { status: 400 })
    }

    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || ""
    const hmac = crypto.createHmac("sha256", secret)
    const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8")
    const signatureBuffer = Buffer.from(signature, "utf8")

    if (!crypto.timingSafeEqual(digest, signatureBuffer)) {
      console.error("Lemon Squeezy Webhook Error: Invalid signature")
      return NextResponse.json({ error: "ERR-VLT-PAY-202" }, { status: 400 })
    }

    const payload = JSON.parse(rawBody)

    if (payload.meta.event_name === "order_created") {
      const data = payload.data.attributes
      const paymentId = String(payload.data.id)
      const email = data.user_email
      const amount = data.total // usually in cents
      const customData = payload.meta.custom_data || {}
      const uid = customData.uid // we passed this in checkout_data.custom

      // Idempotency: skip if this event was already processed
      if (paymentId) {
        const eventDoc = await adminDb.collection("processedEvents").doc(`lemon_${paymentId}`).get()
        if (eventDoc.exists) {
          console.log(`LemonSqueezy webhook already processed: ${paymentId}`)
          return NextResponse.json({ received: true })
        }
      }

      if (uid) {
        // Fetch cart to get items outside of transaction
        let userDoc
        try {
          userDoc = await adminDb.collection("users").doc(uid).get()
        } catch (error) {
          console.error("Firestore Query Error (Users):", error)
          return NextResponse.json({ error: "ERR-VLT-DB-101" }, { status: 500 })
        }

        const cart = userDoc.data()?.cart || []

        if (cart.length > 0) {
          // Generate Order ID
          const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "")
          const randomHex = crypto.randomBytes(4).toString("hex")
          const orderId = `ORD-${dateStr}-${randomHex}`

          try {
            await adminDb.runTransaction(async (transaction) => {
              const productRefs = cart.map((item: any) => adminDb.collection("products").doc(item.id))
              let productDocs: FirebaseFirestore.DocumentSnapshot[] = []
              
              if (productRefs.length > 0) {
                productDocs = await transaction.getAll(...productRefs)
              }

              // Build enriched order items from server-side product data
              const enrichedItems: any[] = []

              // Compute new stocks
              productDocs.forEach((pDoc, index) => {
                if (pDoc.exists) {
                  const pData = pDoc.data()
                  const cartItem = cart[index]
                  const quantityToBuy = cartItem.quantity
                  const currentStock = pData?.stockQuantity || 0
                  
                  const updates: any = { stockQuantity: Math.max(0, currentStock - quantityToBuy) }

                  // Build enriched item from server-side product data
                  let itemPrice = pData?.discountPrice || pData?.price || 0
                  if (cartItem.selectedColor) {
                    const color = pData?.colors?.find((c: any) => c.name === (cartItem.selectedColor.name || cartItem.selectedColor))
                    if (color?.priceModifier) itemPrice += color.priceModifier
                  }
                  if (cartItem.selectedVariants) {
                    const variants = Array.isArray(cartItem.selectedVariants) ? cartItem.selectedVariants : Object.entries(cartItem.selectedVariants).map(([groupName, choiceName]) => ({ groupName, choiceName }))
                    variants.forEach((v: any) => {
                      const group = pData?.variantGroups?.find((g: any) => g.groupName === v.groupName)
                      const choice = group?.choices?.find((c: any) => c.choiceName === v.choiceName)
                      if (choice?.priceModifier) itemPrice += choice.priceModifier
                    })
                  }

                  enrichedItems.push({
                    id: cartItem.id,
                    name: pData?.name || cartItem.name,
                    slug: pData?.slug || cartItem.slug,
                    price: itemPrice,
                    quantity: quantityToBuy,
                    image: pData?.images?.[0] || cartItem.image,
                    selectedColor: cartItem.selectedColor || null,
                    selectedVariants: cartItem.selectedVariants || null,
                  })
                  
                  // 1. Decrement specific color stock
                  if (cartItem.selectedColor && pData?.colors) {
                    const colorName = cartItem.selectedColor.name || cartItem.selectedColor
                    const cIdx = pData.colors.findIndex((c: any) => c.name === colorName)
                    if (cIdx !== -1) {
                      pData.colors[cIdx].stockQuantity = Math.max(0, (pData.colors[cIdx].stockQuantity || 0) - quantityToBuy)
                      updates.colors = pData.colors
                    }
                  }

                  // 2. Decrement specific variant choices stock
                  if (cartItem.selectedVariants && pData?.variantGroups) {
                    let variantsChanged = false
                    const selectedVariantsArray = Array.isArray(cartItem.selectedVariants) ? cartItem.selectedVariants : Object.entries(cartItem.selectedVariants).map(([groupName, choiceName]) => ({ groupName, choiceName }))
                    
                    selectedVariantsArray.forEach((v: any) => {
                      const gIdx = pData.variantGroups.findIndex((g: any) => g.groupName === v.groupName)
                      if (gIdx !== -1) {
                        const cIdx = pData.variantGroups[gIdx].choices.findIndex((c: any) => c.choiceName === v.choiceName)
                        if (cIdx !== -1) {
                          pData.variantGroups[gIdx].choices[cIdx].stockQuantity = Math.max(0, (pData.variantGroups[gIdx].choices[cIdx].stockQuantity || 0) - quantityToBuy)
                          variantsChanged = true
                        }
                      }
                    })
                    if (variantsChanged) updates.variantGroups = pData.variantGroups
                  }

                  transaction.update(pDoc.ref, updates)
                }
              })

              // Create Order with enriched (server-verified) items
              const orderRef = adminDb.collection("orders").doc(orderId)
              transaction.set(orderRef, {
                orderId,
                uid,
                email,
                items: enrichedItems,
                totalPaid: amount,
                status: "pending",
                paymentMethod: "lemonsqueezy",
                paymentReference: paymentId || null,
                createdAt: new Date().toISOString()
              })

              // Clear user cart
              const userRef = adminDb.collection("users").doc(uid)
              transaction.update(userRef, { cart: [] })

              // Mark this event as processed (idempotency)
              if (paymentId) {
                const eventRef = adminDb.collection("processedEvents").doc(`lemon_${paymentId}`)
                transaction.set(eventRef, {
                  processedAt: new Date().toISOString(),
                  orderId,
                  source: "lemonsqueezy"
                })
              }
            })
          } catch (error) {
            console.error("Firestore Transaction Error:", error)
            return NextResponse.json({ error: "ERR-VLT-DB-102" }, { status: 500 })
          }

          // Send confirmation email
          try {
            await sendOrderConfirmationEmail(email, orderId, cart, amount)
          } catch (error) {
            console.error("Email Dispatch Error:", error)
            // No error response returned since the transaction succeeded
          }
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("Lemon Squeezy Webhook Unknown Error:", error)
    return NextResponse.json({ error: "ERR-VLT-PAY-202" }, { status: 500 })
  }
}

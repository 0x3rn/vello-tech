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
      const email = data.user_email
      const amount = data.total // usually in cents
      const customData = payload.meta.custom_data || {}
      const uid = customData.uid // we passed this in checkout_data.custom

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

              // Compute new stocks
              productDocs.forEach((pDoc, index) => {
                if (pDoc.exists) {
                  const currentStock = pDoc.data()?.stockQuantity || 0
                  const quantityToBuy = cart[index].quantity
                  const newStock = Math.max(0, currentStock - quantityToBuy)
                  transaction.update(pDoc.ref, { stockQuantity: newStock })
                }
              })

              // Create Order
              const orderRef = adminDb.collection("orders").doc(orderId)
              transaction.set(orderRef, {
                orderId,
                uid,
                email,
                items: cart,
                totalPaid: amount,
                status: "pending",
                paymentMethod: "lemonsqueezy",
                createdAt: new Date().toISOString()
              })

              // Clear user cart
              const userRef = adminDb.collection("users").doc(uid)
              transaction.update(userRef, { cart: [] })
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

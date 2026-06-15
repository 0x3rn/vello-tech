import { NextResponse } from "next/server"
import crypto from "crypto"
import { adminDb } from "@/lib/firebase-admin"
import { sendOrderConfirmationEmail } from "@/lib/email"

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get("x-paystack-signature")

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 })
    }

    const secret = process.env.PAYSTACK_SECRET_KEY || ""
    const hash = crypto.createHmac("sha512", secret).update(rawBody).digest("hex")

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const event = JSON.parse(rawBody)

    if (event.event === "charge.success") {
      const data = event.data
      const uid = data.metadata?.uid
      const email = data.customer?.email || data.email
      const amount = data.amount // in cents

      if (uid) {
        // Fetch cart to get items
        const userRef = adminDb.collection("users").doc(uid)
        const userDoc = await userRef.get()
        const cart = userDoc.data()?.cart || []

        // Generate Order ID
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "")
        const orderId = `ORD-${dateStr}-${randomHex}`

        // Create Order
        await adminDb.collection("orders").doc(orderId).set({
          orderId,
          uid,
          email,
          items: cart,
          totalPaid: amount,
          status: "Paid",
          paymentMethod: "paystack",
          createdAt: new Date().toISOString()
        })

        // Clear user cart
        await userRef.update({ cart: [] })

        // Send confirmation email
        await sendOrderConfirmationEmail(email, orderId, cart, amount)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("Paystack Webhook Error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}

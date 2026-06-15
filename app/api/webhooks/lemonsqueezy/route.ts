import { NextResponse } from "next/server"
import crypto from "crypto"
import { adminDb } from "@/lib/firebase-admin"
import { sendOrderConfirmationEmail } from "@/lib/email"

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get("x-signature")

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 })
    }

    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || ""
    const hmac = crypto.createHmac("sha256", secret)
    const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8")
    const signatureBuffer = Buffer.from(signature, "utf8")

    if (!crypto.timingSafeEqual(digest, signatureBuffer)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const payload = JSON.parse(rawBody)

    if (payload.meta.event_name === "order_created") {
      const data = payload.data.attributes
      const email = data.user_email
      const amount = data.total // usually in cents
      const customData = payload.meta.custom_data || {}
      const uid = customData.uid // we passed this in checkout_data.custom

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
          paymentMethod: "lemonsqueezy",
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
    console.error("Lemon Squeezy Webhook Error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}

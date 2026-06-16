import { NextResponse } from "next/server"
import crypto from "crypto"
import { adminDb } from "@/lib/firebase-admin"
import { sendOrderConfirmationEmail } from "@/lib/email"

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get("x-paystack-signature")

    if (!signature) {
      console.error("Paystack Webhook Error: Missing signature")
      return NextResponse.json({ error: "ERR-VLT-PAY-202" }, { status: 400 })
    }

    const secret = process.env.PAYSTACK_SECRET_KEY || ""
    const hash = crypto.createHmac("sha512", secret).update(rawBody).digest("hex")

    if (hash !== signature) {
      console.error("Paystack Webhook Error: Invalid signature")
      return NextResponse.json({ error: "ERR-VLT-PAY-202" }, { status: 400 })
    }

    const event = JSON.parse(rawBody)

    if (event.event === "charge.success") {
      const data = event.data
      const uid = data.metadata?.uid
      const email = data.customer?.email || data.email
      const amount = data.amount // in cents

      if (uid) {
        // Fetch cart to get items outside of transaction (to know what to fetch inside)
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
                paymentMethod: "paystack",
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
            // We don't return an error response here because the transaction succeeded
          }
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("Paystack Webhook Unknown Error:", error)
    return NextResponse.json({ error: "ERR-VLT-PAY-202" }, { status: 500 })
  }
}

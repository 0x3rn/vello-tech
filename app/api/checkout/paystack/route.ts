import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function POST(req: Request) {
  try {
    const { uid, email } = await req.json()

    if (!uid || !email) {
      return NextResponse.json({ error: "User ID and Email are required" }, { status: 400 })
    }

    // 1. Fetch user's cart securely from Firestore
    const userDoc = await adminDb.collection("users").doc(uid).get()
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const cart = userDoc.data()?.cart || []
    
    if (cart.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
    }

    // Calculate total securely
    const subtotal = cart.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
    const shipping = subtotal > 99 ? 0 : 9.99
    const tax = subtotal * 0.08
    const totalInCents = Math.round((subtotal + shipping + tax) * 100)

    // 2. Call Paystack API to initialize transaction
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecretKey) {
      throw new Error("PAYSTACK_SECRET_KEY is missing")
    }

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email,
        amount: totalInCents,
        metadata: {
          uid: uid,
          payment_method: "paystack"
        },
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/checkout/success`
      })
    })

    const data = await response.json()

    if (!data.status) {
      throw new Error(data.message)
    }

    // Return the authorization URL to redirect the user
    return NextResponse.json({ url: data.data.authorization_url })

  } catch (error: any) {
    console.error("Paystack Init Error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

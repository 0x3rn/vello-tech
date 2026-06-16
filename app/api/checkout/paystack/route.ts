import { NextResponse } from "next/server"
import { adminDb, adminAuth } from "@/lib/firebase-admin"

export async function POST(req: Request) {
  try {
    // Session Verification
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "ERR-VLT-AUTH-401" }, { status: 401 })
    }
    
    const idToken = authHeader.split('Bearer ')[1]
    let decodedToken
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken)
    } catch (error) {
      console.error("Firebase Admin Verification Error:", error)
      return NextResponse.json({ error: "ERR-VLT-AUTH-401" }, { status: 401 })
    }

    const { uid, email } = await req.json()

    // Ensure the token matches the requested UID
    if (decodedToken.uid !== uid) {
      return NextResponse.json({ error: "ERR-VLT-AUTH-401" }, { status: 403 })
    }

    if (!uid || !email) {
      return NextResponse.json({ error: "User ID and Email are required" }, { status: 400 })
    }

    // 1. Fetch user's cart securely from Firestore
    let userDoc
    try {
      userDoc = await adminDb.collection("users").doc(uid).get()
    } catch (error) {
      console.error("Firestore Query Error (Users):", error)
      return NextResponse.json({ error: "ERR-VLT-DB-101" }, { status: 500 })
    }
    
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
      console.error("Missing PAYSTACK_SECRET_KEY")
      return NextResponse.json({ error: "ERR-VLT-PAY-201" }, { status: 500 })
    }

    let response
    try {
      response = await fetch("https://api.paystack.co/transaction/initialize", {
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
    } catch (error) {
      console.error("Paystack Network Error:", error)
      return NextResponse.json({ error: "ERR-VLT-PAY-201" }, { status: 500 })
    }

    const data = await response.json()

    if (!data.status) {
      console.error("Paystack API Error:", data.message)
      return NextResponse.json({ error: "ERR-VLT-PAY-201" }, { status: 500 })
    }

    // Return the authorization URL to redirect the user
    return NextResponse.json({ url: data.data.authorization_url })

  } catch (error: any) {
    console.error("Paystack Init Unknown Error:", error)
    return NextResponse.json({ error: "ERR-VLT-PAY-201" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function POST(req: Request) {
  try {
    const { uid, email } = await req.json()

    if (!uid || !email) {
      return NextResponse.json({ error: "User ID and Email are required" }, { status: 400 })
    }

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

    const lemonSqueezyKey = process.env.LEMON_SQUEEZY_API_KEY
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID
    const variantId = process.env.LEMON_SQUEEZY_DUMMY_VARIANT_ID

    if (!lemonSqueezyKey || !storeId) {
      throw new Error("LEMON_SQUEEZY_API_KEY or STORE_ID is missing")
    }

    // Lemon Squeezy API to create checkout
    const response = await fetch(`https://api.lemonsqueezy.com/v1/checkouts`, {
      method: "POST",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${lemonSqueezyKey}`
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: {
              email: email,
              custom_price: totalInCents,
              custom: {
                uid: uid
              }
            },
            checkout_options: {
              button_color: "#000000",
            },
            product_options: {
              redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/checkout/success`,
            },
            custom_price: totalInCents,
          },
          relationships: {
            store: {
              data: { type: "stores", id: storeId }
            },
            variant: {
              data: { type: "variants", id: variantId || "1" }
            }
          }
        }
      })
    })

    const data = await response.json()

    if (data.errors) {
      throw new Error(data.errors[0].detail || "Lemon Squeezy API error")
    }

    return NextResponse.json({ url: data.data.attributes.url })

  } catch (error: any) {
    console.error("Lemon Squeezy Init Error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

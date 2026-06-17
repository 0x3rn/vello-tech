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

    if (decodedToken.uid !== uid) {
      return NextResponse.json({ error: "ERR-VLT-AUTH-401" }, { status: 403 })
    }

    if (!uid || !email) {
      return NextResponse.json({ error: "User ID and Email are required" }, { status: 400 })
    }

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
    let secureSubtotal = 0
    for (const item of cart) {
      const productDoc = await adminDb.collection("products").doc(item.id).get()
      if (!productDoc.exists) {
        return NextResponse.json({ error: `Product ${item.name} not found or no longer available` }, { status: 400 })
      }
      
      const product = productDoc.data()!
      let baseItemPrice = product.discountPrice || product.price

      let variantModifiers = 0
      if (item.selectedVariants && item.selectedVariants.length > 0) {
        for (const sv of item.selectedVariants) {
          const group = product.variantGroups?.find((g: any) => g.groupName === sv.groupName)
          if (!group) {
            return NextResponse.json({ error: `Variant group ${sv.groupName} not found for ${item.name}` }, { status: 400 })
          }
          const choice = group.choices.find((c: any) => c.choiceName === sv.choiceName)
          if (!choice) {
            return NextResponse.json({ error: `Variant choice ${sv.choiceName} not found for ${item.name}` }, { status: 400 })
          }
          variantModifiers += (choice.priceModifier || 0)
        }
      }
      
      let colorModifier = 0
      if (item.selectedColor) {
        const color = product.colors?.find((c: any) => c.name === item.selectedColor.name)
        if (color && color.priceModifier !== undefined) {
          colorModifier = color.priceModifier
        }
      }

      const finalItemPrice = baseItemPrice + colorModifier + variantModifiers
      secureSubtotal += (finalItemPrice * item.quantity)
    }

    const subtotal = secureSubtotal
    const shipping = subtotal > 99 ? 0 : 9.99
    const tax = subtotal * 0.08
    const totalInCents = Math.round((subtotal + shipping + tax) * 100)

    const lemonSqueezyKey = process.env.LEMON_SQUEEZY_API_KEY
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID
    const variantId = process.env.LEMON_SQUEEZY_DUMMY_VARIANT_ID

    if (!lemonSqueezyKey || !storeId) {
      console.error("Missing LEMON_SQUEEZY_API_KEY or STORE_ID")
      return NextResponse.json({ error: "ERR-VLT-PAY-203" }, { status: 500 })
    }

    let response
    try {
      response = await fetch(`https://api.lemonsqueezy.com/v1/checkouts`, {
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
    } catch (error) {
      console.error("LemonSqueezy Network Error:", error)
      return NextResponse.json({ error: "ERR-VLT-PAY-203" }, { status: 500 })
    }

    const data = await response.json()

    if (data.errors) {
      console.error("LemonSqueezy API Error:", data.errors[0].detail)
      return NextResponse.json({ error: "ERR-VLT-PAY-203" }, { status: 500 })
    }

    return NextResponse.json({ url: data.data.attributes.url })

  } catch (error: any) {
    console.error("Lemon Squeezy Init Unknown Error:", error)
    return NextResponse.json({ error: "ERR-VLT-PAY-203" }, { status: 500 })
  }
}

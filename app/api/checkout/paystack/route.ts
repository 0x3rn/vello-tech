import { NextResponse } from "next/server"
import { adminDb, adminAuth } from "@/lib/firebase-admin"
import { checkoutLimiter, getClientIp } from "@/lib/rate-limit"

export async function POST(req: Request) {
  try {
    // Rate Limiting
    if (checkoutLimiter) {
      const ip = getClientIp(req)
      const { success } = await checkoutLimiter.limit(`checkout_${ip}`)
      if (!success) {
        return NextResponse.json({ error: "Too many checkout attempts. Please try again later." }, { status: 429 })
      }
    }

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

    const { uid, email, directItem } = await req.json()

    // Ensure the token matches the requested UID
    if (decodedToken.uid !== uid) {
      return NextResponse.json({ error: "ERR-VLT-AUTH-401" }, { status: 403 })
    }

    if (!uid || !email) {
      return NextResponse.json({ error: "User ID and Email are required" }, { status: 400 })
    }

    let itemsToProcess = [];

    if (directItem && directItem.id) {
      // Securely process a single direct checkout item
      const productDoc = await adminDb.collection("products").doc(directItem.id).get()
      if (!productDoc.exists) {
        return NextResponse.json({ error: `Product not found or no longer available` }, { status: 400 })
      }
      
      const product = productDoc.data()!
      let itemPrice = product.discountPrice || product.price

      // Calculate any price modifiers
      if (directItem.selectedVariants) {
        Object.entries(directItem.selectedVariants).forEach(([groupName, choiceName]) => {
          const group = product.variantGroups?.find((g: any) => g.groupName === groupName)
          const choice = group?.choices.find((c: any) => c.choiceName === choiceName)
          if (choice && choice.priceModifier) {
            itemPrice += choice.priceModifier
          }
        })
      }

      if (directItem.selectedColor) {
        const color = product.colors?.find((c: any) => c.name === directItem.selectedColor)
        if (color && color.priceModifier) {
          itemPrice += color.priceModifier
        }
      }

      itemsToProcess = [{
        ...directItem,
        price: itemPrice // Securely set price from DB
      }];
    } else {
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

      itemsToProcess = userDoc.data()?.cart || []
      
      if (itemsToProcess.length === 0) {
        return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
      }
    }

    // Calculate total securely and validate stock
    let secureSubtotal = 0
    for (const item of itemsToProcess) {
      const productDoc = await adminDb.collection("products").doc(item.id).get()
      if (!productDoc.exists) {
        return NextResponse.json({ error: `Product ${item.name} not found or no longer available` }, { status: 400 })
      }
      
      const product = productDoc.data()!

      // Stock validation: reject if insufficient stock
      const availableStock = product.stockQuantity ?? 0
      if (item.quantity > availableStock) {
        return NextResponse.json({ 
          error: `Insufficient stock for "${product.name}". Only ${availableStock} available.` 
        }, { status: 400 })
      }

      const baseItemPrice = product.discountPrice || product.price

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

    // 2. Call Paystack API to initialize transaction
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecretKey) {
      console.error("Missing PAYSTACK_SECRET_KEY")
      return NextResponse.json({ error: "ERR-VLT-PAY-201" }, { status: 500 })
    }

    const getBaseUrl = (req: Request) => {
      if (process.env.NODE_ENV === "production") {
        const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || ""
        if (configuredUrl.startsWith("https://") && !configuredUrl.includes("localhost")) {
          return configuredUrl
        }
        const host = req.headers.get("host")
        return host ? `https://${host}` : "https://vello-tech.vercel.app"
      }
      return "http://localhost:3000"
    }
    const siteUrl = getBaseUrl(req)

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
          callback_url: `${siteUrl}/checkout/success`
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

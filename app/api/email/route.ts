import { NextRequest, NextResponse } from "next/server"
import { createDatabase } from "@/db/client"
import { newsletterSubscriptions } from "@/db/schema"
import { apiLimiter, getClientIp } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""

    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: "Enter a valid email address." },
        { status: 400 }
      )
    }

    if (apiLimiter) {
      const limit = await apiLimiter.limit(`newsletter:${getClientIp(request)}`)
      if (!limit.success) return NextResponse.json({ success: false, message: "Please try again later." }, { status: 429 })
    }

    await createDatabase().insert(newsletterSubscriptions).values({ email }).onConflictDoNothing()
    return NextResponse.json({ success: true, message: "Subscribed successfully" })
  } catch (error) {
    console.error("Newsletter signup failed", error instanceof Error ? error.name : "UnknownError")
    return NextResponse.json(
      { success: false, message: "Could not subscribe right now. Please try again." },
      { status: 503 }
    )
  }
}

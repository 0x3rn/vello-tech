import { NextResponse } from "next/server";
import { checkoutLimiter, getClientIp } from "@/lib/rate-limit";
import { initializeLemonSqueezy } from "@/lib/neon/payments";

export async function POST(request: Request) {
  try {
    if (!checkoutLimiter) return NextResponse.json({ error: "Checkout is temporarily unavailable while rate limiting is configured." }, { status: 503 });
    if (!(await checkoutLimiter.limit(`checkout_${getClientIp(request)}`)).success) return NextResponse.json({ error: "Too many checkout attempts. Please try again later." }, { status: 429 });
    return NextResponse.json(await initializeLemonSqueezy(request));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    const status = /Unauthorized|Identity mismatch/.test(message) ? 401 : /Cart|quantity|stock|available|Invalid|product|region/i.test(message) ? 400 : 500;
    console.error("Lemon Squeezy checkout error:", message);
    return NextResponse.json({ error: message }, { status });
  }
}

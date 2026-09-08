import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { fulfillPendingOrder, getOrderReceipt } from "@/lib/neon/commerce";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
    const signature = request.headers.get("x-signature");
    if (!secret || !signature) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    const rawBody = await request.text();
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    const left = Buffer.from(expected, "utf8");
    const right = Buffer.from(signature, "utf8");
    if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

    const event = JSON.parse(rawBody) as {
      meta?: { event_name?: string; custom_data?: { order_id?: string } };
      data?: { id?: string; attributes?: { total?: number; status?: string } };
    };
    if (event.meta?.event_name !== "order_created") return NextResponse.json({ received: true });
    const paymentId = event.data?.id;
    const orderId = event.meta?.custom_data?.order_id;
    const amount = Number(event.data?.attributes?.total);
    if (!paymentId || !orderId || !Number.isInteger(amount) || amount < 0) return NextResponse.json({ error: "Invalid payment payload" }, { status: 400 });
    const result = await fulfillPendingOrder({ source: "lemonsqueezy", eventId: paymentId, orderId, paymentReference: paymentId, amountInCents: amount, sourceData: event as Record<string, unknown> });
    if (!result.duplicate) {
      const receipt = await getOrderReceipt(orderId);
      if (receipt?.email) await sendOrderConfirmationEmail(receipt.email, orderId, receipt.items, receipt.totalInCents).catch((error) => console.error("Order email failed:", error));
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Lemon Squeezy webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

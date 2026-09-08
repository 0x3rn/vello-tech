import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { fulfillPendingOrder, getOrderReceipt } from "@/lib/neon/commerce";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const signature = request.headers.get("x-paystack-signature");
    if (!secret || !signature) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    const rawBody = await request.text();
    const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
    const left = Buffer.from(expected, "utf8");
    const right = Buffer.from(signature, "utf8");
    if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

    const event = JSON.parse(rawBody) as { event?: string; data?: { reference?: string; amount?: number; metadata?: { order_id?: string } } };
    if (event.event !== "charge.success") return NextResponse.json({ received: true });
    const reference = event.data?.reference;
    const orderId = event.data?.metadata?.order_id ?? reference;
    const amount = Number(event.data?.amount);
    if (!reference || !orderId || !Number.isInteger(amount) || amount < 0) return NextResponse.json({ error: "Invalid payment payload" }, { status: 400 });
    const result = await fulfillPendingOrder({ source: "paystack", eventId: reference, orderId, paymentReference: reference, amountInCents: amount, sourceData: event as Record<string, unknown> });
    if (!result.duplicate) {
      const receipt = await getOrderReceipt(orderId);
      if (receipt?.email) await sendOrderConfirmationEmail(receipt.email, orderId, receipt.items, receipt.totalInCents).catch((error) => console.error("Order email failed:", error));
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

import "server-only";

import { createPendingCheckout } from "@/lib/neon/commerce";
import { requireBearerUser } from "@/lib/neon/auth";

function siteUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured && /^https:\/\//.test(configured) && !configured.includes("localhost")) return configured.replace(/\/$/, "");
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

async function prepare(request: Request, paymentMethod: "paystack" | "lemonsqueezy") {
  const identity = await requireBearerUser(request);
  const body = await request.json() as Record<string, unknown>;
  if (body.uid !== undefined && body.uid !== identity.uid) throw new Error("Identity mismatch");
  const shippingAddress = body.shippingAddress && typeof body.shippingAddress === "object" ? body.shippingAddress as Record<string, unknown> : undefined;
  return createPendingCheckout({
    uid: identity.uid,
    email: identity.email ?? (typeof body.email === "string" ? body.email : null),
    identityEmail: identity.email,
    name: identity.name,
    paymentMethod,
    country: typeof body.country === "string" ? body.country : undefined,
    state: typeof body.state === "string" ? body.state : undefined,
    shippingAddress,
    directItem: body.directItem,
  });
}

export async function initializePaystack(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("Paystack is not configured");
  const checkout = await prepare(request, "paystack");
  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email: checkout.email, amount: checkout.totalInCents, reference: checkout.orderId, metadata: { order_id: checkout.orderId }, callback_url: `${siteUrl(request)}/checkout/success` }),
  });
  const data = await response.json() as { status?: boolean; message?: string; data?: { authorization_url?: string } };
  if (!response.ok || !data.status || !data.data?.authorization_url) throw new Error(data.message || "Paystack initialization failed");
  return { url: data.data.authorization_url };
}

export async function initializeLemonSqueezy(request: Request) {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
  const variantId = process.env.LEMON_SQUEEZY_DUMMY_VARIANT_ID;
  if (!apiKey || !storeId || !variantId) throw new Error("Lemon Squeezy is not configured");
  const checkout = await prepare(request, "lemonsqueezy");
  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: { Accept: "application/vnd.api+json", "Content-Type": "application/vnd.api+json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ data: { type: "checkouts", attributes: { checkout_data: { email: checkout.email, custom: { order_id: checkout.orderId } }, checkout_options: { button_color: "#000000" }, product_options: { redirect_url: `${siteUrl(request)}/checkout/success` }, custom_price: checkout.totalInCents }, relationships: { store: { data: { type: "stores", id: storeId } }, variant: { data: { type: "variants", id: variantId } } } } }),
  });
  const data = await response.json() as { errors?: Array<{ detail?: string }>; data?: { attributes?: { url?: string } } };
  const url = data.data?.attributes?.url;
  if (!response.ok || !url) throw new Error(data.errors?.[0]?.detail || "Lemon Squeezy initialization failed");
  return { url };
}

import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { createDatabase } from "../db/client";
import { categories, products, users } from "../db/schema";
import { getMigrationAuth } from "./firebase-admin";

config({ path: ".env.local", quiet: true });

const baseUrl = process.env.AUTH_TEST_BASE_URL ?? "http://localhost:3002";
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "";
if (!apiKey) throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY is required");

async function identity(path: string, body: Record<string, unknown>) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${path}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json() as { localId?: string; idToken?: string; error?: { message?: string } };
  if (!response.ok || !data.localId || !data.idToken) throw new Error(`Firebase ${path} failed: ${data.error?.message ?? response.status}`);
  return data as { localId: string; idToken: string };
}

async function main() {
  const marker = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const email = `codex-neon-${marker}@example.com`;
  const password = `Vello-${crypto.randomUUID()}!9a`;
  let uid: string | undefined;
  let categoryId: string | undefined;
  let productId: string | undefined;
  try {
    const created = await identity("signUp", { email, password, returnSecureToken: true });
    uid = created.localId;
    const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: baseUrl },
      body: JSON.stringify({ idToken: created.idToken }),
    });
    if (!sessionResponse.ok) throw new Error(`Session creation failed: ${sessionResponse.status}`);
    const cookie = sessionResponse.headers.get("set-cookie")?.split(";", 1)[0];
    if (!cookie) throw new Error("Session cookie was not returned");

    const profileResponse = await fetch(`${baseUrl}/api/me`, { headers: { Cookie: cookie } });
    const profile = await profileResponse.json() as { uid?: string };
    if (!profileResponse.ok || profile.uid !== uid) throw new Error("Firebase UID was not provisioned in Neon");

    const cartWrite = await fetch(`${baseUrl}/api/me/cart`, { method: "PUT", headers: { Cookie: cookie, "Content-Type": "application/json", Origin: baseUrl }, body: "[]" });
    const cartRead = await fetch(`${baseUrl}/api/me/cart`, { headers: { Cookie: cookie } });
    const cart = await cartRead.json();
    if (!cartWrite.ok || !cartRead.ok || !Array.isArray(cart) || cart.length !== 0) throw new Error(`Neon cart round-trip failed (write=${cartWrite.status}, read=${cartRead.status}, array=${Array.isArray(cart)}, length=${Array.isArray(cart) ? cart.length : "n/a"})`);

    await createDatabase().update(users).set({ role: "admin" }).where(eq(users.id, uid));
    const categoryResponse = await fetch(`${baseUrl}/api/admin/collections/categories`, { method: "POST", headers: { Cookie: cookie, "Content-Type": "application/json", Origin: baseUrl }, body: JSON.stringify({ name: `Integration ${marker}`, slug: `integration-${marker}` }) });
    const category = await categoryResponse.json() as { id?: string };
    if (!categoryResponse.ok || !category.id) throw new Error(`Admin category creation failed: ${categoryResponse.status}`);
    categoryId = category.id;
    const productResponse = await fetch(`${baseUrl}/api/admin/products`, { method: "POST", headers: { Cookie: cookie, "Content-Type": "application/json", Origin: baseUrl }, body: JSON.stringify({ name: `Integration Product ${marker}`, slug: `integration-product-${marker}`, brand: "Vello Test", description: "Disposable integration fixture", categoryId, condition: "new", price: 10, stockQuantity: 5, imageUrls: [], specifications: { Test: "true" }, colors: [], variantGroups: [] }) });
    const product = await productResponse.json() as { id?: string };
    if (!productResponse.ok || !product.id) throw new Error(`Admin product creation failed: ${productResponse.status}`);
    productId = product.id;
    const productRead = await fetch(`${baseUrl}/api/admin/products/${productId}`, { headers: { Cookie: cookie } });
    if (!productRead.ok || (await productRead.json() as { id?: string }).id !== productId) throw new Error("Admin product read failed");

    const reviewResponse = await fetch(`${baseUrl}/api/reviews`, { method: "POST", headers: { Cookie: cookie, "Content-Type": "application/json", Origin: baseUrl }, body: JSON.stringify({ productId, rating: 5, title: "Integration review", comment: "Disposable review transaction test" }) });
    const review = await reviewResponse.json() as { id?: string };
    if (!reviewResponse.ok || !review.id) throw new Error(`Review creation failed: ${reviewResponse.status}`);
    const reviewRead = await fetch(`${baseUrl}/api/reviews?productId=${encodeURIComponent(productId)}&limit=5`);
    if (!reviewRead.ok || !(await reviewRead.json() as Array<{ id: string }>).some((row) => row.id === review.id)) throw new Error("Review read failed");
    const reviewDelete = await fetch(`${baseUrl}/api/reviews`, { method: "DELETE", headers: { Cookie: cookie, "Content-Type": "application/json", Origin: baseUrl }, body: JSON.stringify({ reviewId: review.id }) });
    if (!reviewDelete.ok) throw new Error("Review delete transaction failed");
    const productDelete = await fetch(`${baseUrl}/api/admin/products/${productId}`, { method: "DELETE", headers: { Cookie: cookie, Origin: baseUrl } });
    if (!productDelete.ok) throw new Error("Admin product delete failed");
    productId = undefined;
    const categoryDelete = await fetch(`${baseUrl}/api/admin/collections/categories/${categoryId}`, { method: "DELETE", headers: { Cookie: cookie, Origin: baseUrl } });
    if (!categoryDelete.ok) throw new Error("Admin category delete failed");
    categoryId = undefined;

    const signedIn = await identity("signInWithPassword", { email, password, returnSecureToken: true });
    if (signedIn.localId !== uid) throw new Error("Firebase sign-in returned a different UID");
    console.log(JSON.stringify({ accountCreation: true, signIn: true, sessionCookie: true, firebaseUidMatchesNeon: true, neonCartRoundTrip: true, adminCategoryCrud: true, adminProductCrud: true, reviewTransaction: true, cleanup: "pending" }, null, 2));
  } finally {
    if (productId) await createDatabase().delete(products).where(eq(products.id, productId));
    if (categoryId) await createDatabase().delete(categories).where(eq(categories.id, categoryId));
    if (uid) {
      await createDatabase().delete(users).where(eq(users.id, uid));
      await getMigrationAuth().deleteUser(uid).catch((error: unknown) => console.error("Temporary Firebase user cleanup failed:", error));
      console.log(JSON.stringify({ cleanup: true }));
    }
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

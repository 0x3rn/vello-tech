import { NextResponse } from "next/server";
import { and, avg, count, desc, eq } from "drizzle-orm";
import { createDatabase } from "@/db/client";
import { orderItems, orders, products, reviews, users } from "@/db/schema";
import { requireAdmin, requireFirebaseUser, requireSameOrigin } from "@/lib/neon/auth";

type Transaction = Parameters<Parameters<ReturnType<typeof createDatabase>["transaction"]>[0]>[0];
async function updateAggregate(tx: Transaction, productId: string) {
  const [aggregate] = await tx.select({ rating: avg(reviews.rating), total: count(reviews.id) }).from(reviews).where(eq(reviews.productId, productId));
  await tx.update(products).set({ rating: Number(aggregate.rating ?? 0).toFixed(2), numReviews: Number(aggregate.total ?? 0), updatedAt: new Date() }).where(eq(products.id, productId));
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const productId = url.searchParams.get("productId");
    const mine = url.searchParams.get("mine") === "1";
    const admin = url.searchParams.get("admin") === "1";
    const page = Math.max(0, Number(url.searchParams.get("page")) || 0);
    const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 5));
    let uid: string | null = null;
    if (admin) await requireAdmin();
    if (mine) uid = (await requireFirebaseUser()).uid;
    const conditions = [productId ? eq(reviews.productId, productId) : undefined, uid ? eq(reviews.userId, uid) : undefined].filter(Boolean) as ReturnType<typeof eq>[];
    const rows = await createDatabase().select({ review: reviews, productName: products.name }).from(reviews).leftJoin(products, eq(reviews.productId, products.id))
      .where(conditions.length === 2 ? and(...conditions) : conditions[0])
      .orderBy(desc(reviews.createdAt)).limit(pageSize).offset(page * pageSize);
    return NextResponse.json(rows.map(({ review, productName }) => ({ ...review, createdAt: review.createdAt?.toISOString() ?? null, productName: productName ?? "Unknown Product" })));
  } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
}

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const identity = await requireFirebaseUser();
    const body = await request.json();
    const productId = typeof body.productId === "string" ? body.productId : "";
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : "";
    const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 5000) : "";
    const rating = Number(body.rating);
    if (!productId || !title || !comment || !Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: "Invalid review" }, { status: 400 });
    const db = createDatabase();
    const [user] = await db.select().from(users).where(eq(users.id, identity.uid)).limit(1);
    const purchased = await db.select({ id: orderItems.id }).from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id)).where(and(eq(orders.userId, identity.uid), eq(orderItems.productId, productId), eq(orders.status, "delivered"))).limit(1);
    const id = crypto.randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(reviews).values({ id, productId, userId: identity.uid, userName: user?.name ?? identity.name ?? "Anonymous", rating, title, comment, isVerifiedPurchase: purchased.length > 0, createdAt: new Date() });
      await updateAggregate(tx, productId);
    });
    return NextResponse.json({ success: true, id, isVerifiedPurchase: purchased.length > 0 }, { status: 201 });
  } catch (error) {
    const duplicate = error instanceof Error && /unique/i.test(error.message);
    return NextResponse.json({ error: duplicate ? "You have already reviewed this product" : "Unable to submit review" }, { status: duplicate ? 409 : 401 });
  }
}

export async function DELETE(request: Request) {
  try {
    requireSameOrigin(request);
    const identity = await requireFirebaseUser();
    const { reviewId } = await request.json();
    if (typeof reviewId !== "string") return NextResponse.json({ error: "Invalid review" }, { status: 400 });
    const db = createDatabase();
    const [review] = await db.select().from(reviews).where(eq(reviews.id, reviewId)).limit(1);
    const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, identity.uid)).limit(1);
    if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });
    if (review.userId !== identity.uid && user?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await db.transaction(async (tx) => { await tx.delete(reviews).where(eq(reviews.id, reviewId)); await updateAggregate(tx, review.productId); });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
}

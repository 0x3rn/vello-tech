import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

// Helper to authenticate admin
async function isAdmin(req: NextRequest) {
  const session = req.cookies.get("__session")?.value;
  if (!session) return false;

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(session, true);
    const userDoc = await adminDb.collection("users").doc(decodedClaims.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const isAuthorized = await isAdmin(req);
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const payload = await req.json();
    payload.createdAt = new Date().toISOString();
    payload.updatedAt = new Date().toISOString();
    
    // Auto-generate ID if not provided
    const docRef = adminDb.collection("products").doc();
    payload.id = docRef.id;

    await docRef.set(payload);
    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const isAuthorized = await isAdmin(req);
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const payload = await req.json();
    const id = payload.id;
    if (!id) {
      return NextResponse.json({ error: "Product ID is required for update" }, { status: 400 });
    }

    payload.updatedAt = new Date().toISOString();
    await adminDb.collection("products").doc(id).update(payload);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

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

const ALLOWED_COLLECTIONS = ["categories", "shipping", "taxes", "settings", "taxRates", "shippingRates"];

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ collection: string; id: string }> }
) {
  const isAuthorized = await isAdmin(req);
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { collection, id } = await params;
    if (!ALLOWED_COLLECTIONS.includes(collection)) {
      return NextResponse.json({ error: "Invalid collection" }, { status: 400 });
    }

    const payload = await req.json();
    payload.updatedAt = new Date().toISOString();
    
    await adminDb.collection(collection).doc(id).set(payload, { merge: true });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error updating in ${await params.then(p=>p.collection)}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ collection: string; id: string }> }
) {
  const isAuthorized = await isAdmin(req);
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { collection, id } = await params;
    if (!ALLOWED_COLLECTIONS.includes(collection)) {
      return NextResponse.json({ error: "Invalid collection" }, { status: 400 });
    }
    
    await adminDb.collection(collection).doc(id).delete();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting from ${await params.then(p=>p.collection)}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

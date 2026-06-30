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

// Allowed collections to prevent arbitrary DB writes
const ALLOWED_COLLECTIONS = ["categories", "shipping", "taxes", "settings", "taxRates", "shippingRates"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  const isAuthorized = await isAdmin(req);
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { collection } = await params;
    if (!ALLOWED_COLLECTIONS.includes(collection)) {
      return NextResponse.json({ error: "Invalid collection" }, { status: 400 });
    }

    const payload = await req.json();
    payload.createdAt = new Date().toISOString();
    payload.updatedAt = new Date().toISOString();
    
    const docRef = adminDb.collection(collection).doc();
    await docRef.set(payload);
    
    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error(`Error creating in ${await params.then(p=>p.collection)}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

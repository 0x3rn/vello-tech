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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuthorized = await isAdmin(req);
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const payload = await req.json();
    
    // We only allow updating specific fields for an order (like status)
    const updateData: any = { updatedAt: new Date().toISOString() };
    if (payload.status) updateData.status = payload.status;
    
    await adminDb.collection("orders").doc(id).update(updateData);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

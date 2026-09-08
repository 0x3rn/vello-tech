import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { ensureNeonUser } from "@/lib/neon/auth";

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");
    if (origin && new URL(origin).host !== req.nextUrl.host) {
      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    }
    const { idToken } = await req.json();

    if (!idToken) {
      // If no token is provided, this is a logout request
      const response = NextResponse.json({ success: true }, { status: 200 });
      response.cookies.delete("__session");
      return response;
    }

    if (typeof idToken !== "string" || idToken.length > 10000) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }
    const decoded = await adminAuth.verifyIdToken(idToken, true);
    const issuedAtSeconds = Number(decoded.auth_time ?? 0);
    if (!issuedAtSeconds || Date.now() / 1000 - issuedAtSeconds > 5 * 60) {
      return NextResponse.json({ error: "Recent sign-in required" }, { status: 401 });
    }
    await ensureNeonUser({ uid: decoded.uid, email: decoded.email, name: decoded.name });

    // Generate a 5-day session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const response = NextResponse.json({ success: true, uid: decoded.uid }, { status: 200 });
    
    // Set cookie. In Firebase Hosting, the cookie MUST be named "__session" 
    // to be passed to Cloud Functions or Cloud Run.
    response.cookies.set("__session", sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Error creating session cookie:", error);
    return NextResponse.json({ error: "Invalid authentication token" }, { status: 401 });
  }
}

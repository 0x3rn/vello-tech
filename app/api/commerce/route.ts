import { NextResponse } from "next/server";
import { getDefaultAddress, getRegionRates, getShippingSettings } from "@/lib/neon/commerce";
import { requireFirebaseUser } from "@/lib/neon/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  try {
    if (action === "settings") return NextResponse.json(await getShippingSettings());
    if (action === "rates") {
      const country = url.searchParams.get("country") ?? "";
      const state = url.searchParams.get("state") ?? "";
      if (!country || !state) return NextResponse.json({ error: "Country and state are required" }, { status: 400 });
      return NextResponse.json(await getRegionRates(country, state));
    }
    if (action === "default-address") {
      const identity = await requireFirebaseUser();
      return NextResponse.json(await getDefaultAddress(identity.uid));
    }
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Request failed" }, { status: action === "default-address" ? 401 : 500 });
  }
}

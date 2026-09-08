import { redirect } from "next/navigation";
import { AddressesClient } from "./addresses-client";
import { requireFirebaseUser } from "@/lib/neon/auth";
import { getAddresses } from "@/lib/neon/account";

export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  let identity;
  try { identity = await requireFirebaseUser(); } catch { redirect("/auth/login"); }
  return <AddressesClient initialAddresses={await getAddresses(identity.uid) as any} />;
}

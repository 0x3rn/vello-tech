import { redirect } from "next/navigation";
import { SettingsClient } from "./settings-client";
import { requireFirebaseUser } from "@/lib/neon/auth";
import { getAccount } from "@/lib/neon/account";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let identity;
  try { identity = await requireFirebaseUser(); } catch { redirect("/auth/login"); }
  return <SettingsClient initialUserData={await getAccount(identity.uid)} />;
}

import { redirect } from "next/navigation";
import { PaymentClient } from "./payment-client";
import { requireFirebaseUser } from "@/lib/neon/auth";
import { getPaymentMethods } from "@/lib/neon/account";

export const dynamic = "force-dynamic";

export default async function PaymentMethodsPage() {
  let identity;
  try { identity = await requireFirebaseUser(); } catch { redirect("/auth/login"); }
  return <PaymentClient initialMethods={await getPaymentMethods(identity.uid) as any} />;
}

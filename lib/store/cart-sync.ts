import { User } from "firebase/auth";
import { useCartStore, CartItem } from "@/lib/store/cart";

export async function syncCartWithNeon(_user: User) {
  const localCart = useCartStore.getState().items;
  const response = await fetch("/api/me/cart");
  const cloudCart = response.ok ? await response.json() as CartItem[] : [];
  const merged = [...cloudCart];
  for (const item of localCart) {
    const id = item.cartItemId || item.id;
    const existing = merged.find((candidate) => (candidate.cartItemId || candidate.id) === id);
    if (existing) existing.quantity = Math.max(existing.quantity, item.quantity);
    else merged.push(item);
  }
  const save = await fetch("/api/me/cart", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(merged) });
  if (!save.ok) throw new Error("Unable to sync cart to Neon");
  useCartStore.getState().setItems(merged);
}

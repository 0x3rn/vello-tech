import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  cartItemId?: string // Optional for backwards compatibility
  slug: string
  name: string
  price: number
  image: string
  quantity: number
  stockQuantity: number
  categoryId?: string
  selectedColor?: { name: string; hex: string; priceModifier?: number; imageUrls?: string[] }
  selectedVariants?: { groupName: string; choiceName: string }[]
}

export const generateCartItemId = (item: Omit<CartItem, 'cartItemId'>): string => {
  let idStr = item.id;
  if (item.selectedColor) idStr += `|color:${item.selectedColor.name}`;
  if (item.selectedVariants && item.selectedVariants.length > 0) {
    const sorted = [...item.selectedVariants].sort((a, b) => a.groupName.localeCompare(b.groupName));
    sorted.forEach(v => idStr += `|${v.groupName}:${v.choiceName}`);
  }
  return idStr;
};

interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (idOrCartItemId: string) => void
  updateQuantity: (idOrCartItemId: string, quantity: number) => void
  clearCart: () => void
  setItems: (items: CartItem[]) => void
  totalItems: () => number
  totalPrice: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => {
        const cartItemId = item.cartItemId || generateCartItemId(item);
        const itemWithId = { ...item, cartItemId };
        
        const existingItemIndex = state.items.findIndex(
          (i) => (i.cartItemId || i.id) === cartItemId
        );

        if (existingItemIndex >= 0) {
          const newItems = [...state.items];
          newItems[existingItemIndex].quantity += item.quantity;
          return { items: newItems };
        }
        return { items: [...state.items, itemWithId] };
      }),
      removeItem: (idOrCartItemId) => set((state) => ({
        items: state.items.filter((i) => (i.cartItemId || i.id) !== idOrCartItemId),
      })),
      updateQuantity: (idOrCartItemId, quantity) => set((state) => ({
        items: state.items.map((i) =>
          (i.cartItemId || i.id) === idOrCartItemId ? { ...i, quantity: Math.max(1, quantity) } : i
        ),
      })),
      clearCart: () => set({ items: [] }),
      setItems: (items) => set({ items }),
      totalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },
      totalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0)
      },
    }),
    {
      name: 'vellotech-cart-storage',
    }
  )
)

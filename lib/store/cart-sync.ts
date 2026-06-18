import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useCartStore, CartItem } from '@/lib/store/cart'
import { User } from 'firebase/auth'

export async function syncCartWithFirestore(user: User) {
  if (!user) return

  const userRef = doc(db, 'users', user.uid)
  const userDoc = await getDoc(userRef)
  
  const localCart = useCartStore.getState().items

  if (userDoc.exists()) {
    // User exists -> Merge carts
    const firestoreCart: CartItem[] = userDoc.data()?.cart || []
    
    const mergedCart = [...firestoreCart]
    
    localCart.forEach((localItem) => {
      const localId = localItem.cartItemId || localItem.id;
      const existingItem = mergedCart.find((i) => (i.cartItemId || i.id) === localId);
      if (existingItem) {
        existingItem.quantity += localItem.quantity
      } else {
        mergedCart.push(localItem)
      }
    })

    // Save back to Firestore
    await updateDoc(userRef, { cart: mergedCart })
    
    // Update local Zustand store
    useCartStore.getState().setItems(mergedCart)
  } else {
    // User doesn't exist -> Create new document with current local cart
    await setDoc(userRef, {
      email: user.email,
      name: user.displayName || 'User',
      cart: localCart,
      createdAt: new Date().toISOString()
    })
  }
}

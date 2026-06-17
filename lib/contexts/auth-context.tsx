'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, onAuthStateChanged } from 'firebase/auth'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useCartStore, CartItem } from '@/lib/store/cart'
import { useUserStore } from '@/lib/store/user'

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
          if (userDoc.exists()) {
            const data = userDoc.data()
            useUserStore.getState().setUserData({
              uid: currentUser.uid,
              ...data,
            } as any)

            // Cart Merge Logic
            const cloudCart: CartItem[] = data.cart || []
            const localCart = useCartStore.getState().items

            if (cloudCart.length > 0 || localCart.length > 0) {
              const mergedCart = [...cloudCart]
              
              localCart.forEach(localItem => {
                const existingIndex = mergedCart.findIndex(
                  ci => {
                    if (ci.id !== localItem.id) return false;
                    if (ci.selectedColor?.name !== localItem.selectedColor?.name) return false;
                    
                    const v1 = ci.selectedVariants || [];
                    const v2 = localItem.selectedVariants || [];
                    if (v1.length !== v2.length) return false;
                    
                    const str1 = [...v1].sort((a,b) => a.groupName.localeCompare(b.groupName)).map(v => v.groupName+v.choiceName).join('|');
                    const str2 = [...v2].sort((a,b) => a.groupName.localeCompare(b.groupName)).map(v => v.groupName+v.choiceName).join('|');
                    return str1 === str2;
                  }
                )
                
                if (existingIndex >= 0) {
                  // Merge quantities (use max to prevent doubling on refresh) and cap at stockQuantity
                  const maxQty = Math.max(mergedCart[existingIndex].quantity, localItem.quantity)
                  const stock = mergedCart[existingIndex].stockQuantity || localItem.stockQuantity || 1
                  mergedCart[existingIndex].quantity = Math.min(maxQty, stock)
                } else {
                  mergedCart.push(localItem)
                }
              })
              
              useCartStore.getState().setItems(mergedCart)
            }
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error)
        }
      } else {
        useUserStore.getState().clearUserData()
      }
      
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Sync ongoing cart changes to Firestore
  useEffect(() => {
    if (!user) return

    const unsubscribe = useCartStore.subscribe((state, prevState) => {
      // Basic check to see if items changed reference
      if (state.items !== prevState?.items) {
        const userRef = doc(db, 'users', user.uid)
        
        // Strip out any undefined values because Firestore throws on them
        const cleanCart = JSON.parse(JSON.stringify(state.items))
        
        updateDoc(userRef, { cart: cleanCart }).catch(console.error)
      }
    })

    return () => unsubscribe()
  }, [user])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

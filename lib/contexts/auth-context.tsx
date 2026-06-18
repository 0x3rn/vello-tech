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

            // Strict Sync: Firestore is the absolute source of truth for authenticated users.
            // (Guest carts are merged explicitly during login via syncCartWithFirestore)
            const cloudCart: CartItem[] = data.cart || []
            useCartStore.getState().setItems(cloudCart)
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

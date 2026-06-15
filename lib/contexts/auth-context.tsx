'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, onAuthStateChanged } from 'firebase/auth'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useCartStore } from '@/lib/store/cart'
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
            useUserStore.getState().setUserData({
              uid: currentUser.uid,
              ...userDoc.data(),
            } as any)
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
        updateDoc(userRef, { cart: state.items }).catch(console.error)
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

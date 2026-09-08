'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useCartStore } from '@/lib/store/cart'
import { useUserStore } from '@/lib/store/user'
import { syncCartWithNeon } from '@/lib/store/cart-sync'

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
          let profileResponse = await fetch('/api/me')
          let data = profileResponse.ok ? await profileResponse.json() : null
          if (!profileResponse.ok || data?.uid !== currentUser.uid) {
            const idToken = await currentUser.getIdToken(true)
            const sessionResponse = await fetch('/api/auth/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken }),
            })
            if (!sessionResponse.ok) throw new Error('Unable to establish a server session')
            profileResponse = await fetch('/api/me')
            data = profileResponse.ok ? await profileResponse.json() : null
          }
          if (profileResponse.ok) {
            useUserStore.getState().setUserData({
              uid: currentUser.uid,
              ...data,
            } as any)

            await syncCartWithNeon(currentUser)
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error)
        }
      } else {
        try {
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: null }),
          })
        } catch (error) {
          console.error("Failed to clear session:", error)
        }
        useUserStore.getState().clearUserData()
      }
      
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Sync ongoing cart changes to Neon.
  useEffect(() => {
    if (!user) return

    const unsubscribe = useCartStore.subscribe((state, prevState) => {
      // Basic check to see if items changed reference
      if (state.items !== prevState?.items) {
        const cleanCart = JSON.parse(JSON.stringify(state.items))
        fetch('/api/me/cart', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cleanCart) }).catch(console.error)
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

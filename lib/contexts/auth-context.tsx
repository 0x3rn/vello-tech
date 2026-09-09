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
  profileLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  profileLoading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Firebase has resolved the identity at this point. Do not keep the
      // application in an unauthenticated-looking state while the separate
      // Neon profile and server-session work completes.
      setUser(currentUser)
      setLoading(false)
      setProfileLoading(Boolean(currentUser))

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
        } finally {
          setProfileLoading(false)
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
        setProfileLoading(false)
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
    <AuthContext.Provider value={{ user, loading, profileLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

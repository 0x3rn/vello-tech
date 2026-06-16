import { useState } from 'react'
import { toast } from 'sonner'
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useUserStore } from '@/lib/store/user'
import { useAuth } from '@/lib/contexts/auth-context'

export function useWishlist() {
  const { user } = useAuth()
  const { userData, setUserData } = useUserStore()
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({})

  const toggleWishlist = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user || user.isAnonymous) {
      toast.error("Please log in to add items to your wishlist.")
      return
    }

    const currentWishlist = userData?.wishlist || []
    const isLiked = currentWishlist.includes(productId)

    setLoadingItems(prev => ({ ...prev, [productId]: true }))

    try {
      const userRef = doc(db, 'users', user.uid)
      
      if (isLiked) {
        await updateDoc(userRef, {
          wishlist: arrayRemove(productId)
        })
        
        // Update local state immediately
        if (userData) {
          setUserData({
            ...userData,
            wishlist: currentWishlist.filter(id => id !== productId)
          })
        }
        toast.success("Removed from wishlist")
      } else {
        await updateDoc(userRef, {
          wishlist: arrayUnion(productId)
        })
        
        // Update local state immediately
        if (userData) {
          setUserData({
            ...userData,
            wishlist: [...currentWishlist, productId]
          })
        }
        toast.success("Added to wishlist")
      }
    } catch (error) {
      console.error("Error updating wishlist:", error)
      toast.error("Failed to update wishlist. Please try again.")
    } finally {
      setLoadingItems(prev => ({ ...prev, [productId]: false }))
    }
  }

  return { toggleWishlist, loadingItems, wishlist: userData?.wishlist || [] }
}

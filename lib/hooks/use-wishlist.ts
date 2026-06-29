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

  const toggleWishlist = async (e: React.MouseEvent, productId: string, colorName?: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user || user.isAnonymous) {
      toast.error("Please log in to add items to your wishlist.")
      return
    }

    const currentWishlist = userData?.wishlist || []
    
    const compositeId = colorName ? `${productId}::${colorName}` : productId;
    
    // Check if THIS EXACT composite id is liked, or if it's the base product and ANY variant is liked
    const exactMatchIndex = currentWishlist.findIndex(id => id === compositeId);
    const baseMatchIndex = currentWishlist.findIndex(id => id === productId || id.startsWith(`${productId}::`));
    
    const isLiked = exactMatchIndex !== -1 || (!colorName && baseMatchIndex !== -1);
    
    // The ID to remove is the exact match if we're unliking exactly what was passed,
    // otherwise if we're unliking the base product, remove whatever variant was liked
    const idToRemove = exactMatchIndex !== -1 ? currentWishlist[exactMatchIndex] : currentWishlist[baseMatchIndex];

    setLoadingItems(prev => ({ ...prev, [productId]: true }))

    try {
      const userRef = doc(db, 'users', user.uid)
      
      if (isLiked && idToRemove) {
        await updateDoc(userRef, {
          wishlist: arrayRemove(idToRemove)
        })
        
        // Update local state immediately
        if (userData) {
          setUserData({
            ...userData,
            wishlist: currentWishlist.filter(id => id !== idToRemove)
          })
        }
        toast.success("Removed from wishlist")
      } else {
        await updateDoc(userRef, {
          wishlist: arrayUnion(compositeId)
        })
        
        // Update local state immediately
        if (userData) {
          setUserData({
            ...userData,
            wishlist: [...currentWishlist, compositeId]
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

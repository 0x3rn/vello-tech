import { useState } from 'react'
import { toast } from 'sonner'
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
      if (isLiked && idToRemove) {
        const wishlist = currentWishlist.filter(id => id !== idToRemove)
        const response = await fetch('/api/me/wishlist', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wishlist }) })
        if (!response.ok) throw new Error('Unable to update wishlist')
        
        // Update local state immediately
        if (userData) {
          setUserData({
            ...userData,
            wishlist
          })
        }
        toast.success("Removed from wishlist")
      } else {
        const wishlist = [...currentWishlist, compositeId]
        const response = await fetch('/api/me/wishlist', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wishlist }) })
        if (!response.ok) throw new Error('Unable to update wishlist')
        
        // Update local state immediately
        if (userData) {
          setUserData({
            ...userData,
            wishlist
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

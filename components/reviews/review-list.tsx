"use client"

import { useState, useEffect, useCallback } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, limit, getDocs, startAfter } from "firebase/firestore"
import { ReviewStars } from "./review-stars"
import { BadgeCheck, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"

interface Review {
  id: string
  productId?: string
  title?: string
  comment?: string
  rating?: number
  userName?: string
  isVerifiedPurchase?: boolean
  createdAt?: string | number | Date
  [key: string]: any
}

interface ReviewListProps {
  productId: string
  // Trigger refetch when a new review is submitted
  refreshTrigger: number 
}

const REVIEWS_PER_PAGE = 5

export function ReviewList({ productId, refreshTrigger }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const fetchReviews = useCallback(async (isLoadMore = false, currentLastVisible: QueryDocumentSnapshot<DocumentData> | null = null) => {
    try {
      if (!isLoadMore) setLoading(true)

      let q = query(
        collection(db, "reviews"),
        where("productId", "==", productId),
        orderBy("createdAt", "desc"),
        limit(REVIEWS_PER_PAGE)
      )

      if (isLoadMore && currentLastVisible) {
        q = query(
          collection(db, "reviews"),
          where("productId", "==", productId),
          orderBy("createdAt", "desc"),
          startAfter(currentLastVisible),
          limit(REVIEWS_PER_PAGE)
        )
      }

      const snap = await getDocs(q)
      
      const newReviews = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Review)
      
      if (isLoadMore) {
        setReviews(prev => [...prev, ...newReviews])
      } else {
        setReviews(newReviews)
      }

      setLastVisible(snap.docs[snap.docs.length - 1] || null)
      setHasMore(snap.docs.length === REVIEWS_PER_PAGE)
    } catch (error) {
      console.error("Error fetching reviews:", error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [productId])

  useEffect(() => {
    fetchReviews(false, null)
  }, [fetchReviews, refreshTrigger])

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center p-8 bg-secondary/5 rounded-xl border border-dashed border-border">
        <p className="text-muted-foreground">No reviews yet. Be the first to share your thoughts!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="divide-y divide-border">
        {reviews.map(review => (
          <div key={review.id} className="py-6 first:pt-0 last:pb-0">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
              <div>
                <ReviewStars rating={review.rating} size={16} />
                <h4 className="font-semibold text-foreground mt-2">{review.title}</h4>
              </div>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {review.createdAt ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true }) : "Recently"}
              </span>
            </div>
            
            <p className="text-muted-foreground text-base mb-4 whitespace-pre-wrap">
              {review.comment}
            </p>
            
            <div className="flex items-center gap-2 text-sm">
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
                {review.userName ? review.userName.charAt(0).toUpperCase() : "A"}
              </div>
              <span className="font-medium text-foreground">{review.userName || "Anonymous"}</span>
              
              {review.isVerifiedPurchase && (
                <span className="flex items-center text-xs font-medium text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full ml-2">
                  <BadgeCheck className="w-3.5 h-3.5 mr-1" />
                  Verified Purchase
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="pt-4 flex justify-center border-t border-border">
          <button
            onClick={() => {
              setLoadingMore(true)
              fetchReviews(true, lastVisible)
            }}
            disabled={loadingMore}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More Reviews"
            )}
          </button>
        </div>
      )}
    </div>
  )
}

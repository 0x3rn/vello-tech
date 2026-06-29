"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from "firebase/firestore"
import { deleteReview } from "@/lib/services/reviews"
import { toast } from "sonner"
import { Loader2, Trash2, ShieldAlert } from "lucide-react"
import { ReviewStars } from "@/components/reviews/review-stars"
import { formatDistanceToNow } from "date-fns"

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchReviews = async () => {
    setLoading(true)
    try {
      // Fetch latest 50 reviews across the site
      const q = query(
        collection(db, "reviews"),
        orderBy("createdAt", "desc"),
        limit(50)
      )
      const snap = await getDocs(q)
      
      const fetchedReviews = await Promise.all(snap.docs.map(async (rDoc) => {
        const data = rDoc.data()
        let productName = "Unknown Product"
        try {
          const pSnap = await getDoc(doc(db, "products", data.productId))
          if (pSnap.exists()) {
            productName = pSnap.data().name
          }
        } catch (e) {}

        return {
          id: rDoc.id,
          ...data,
          productName
        }
      }))
      
      setReviews(fetchedReviews)
    } catch (error) {
      console.error("Error fetching admin reviews:", error)
      toast.error("Failed to load reviews")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  const handleDelete = async (reviewId: string, productId: string) => {
    if (!window.confirm("Are you sure you want to delete this review? The product's aggregate rating will be mathematically reversed.")) {
      return
    }

    setDeletingId(reviewId)
    try {
      await deleteReview(reviewId, productId)
      toast.success("Review deleted and rating recalculated successfully!")
      setReviews(prev => prev.filter(r => r.id !== reviewId))
    } catch (error) {
      console.error("Error deleting review:", error)
      toast.error("Failed to delete review")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Review Moderation</h1>
          <p className="text-muted-foreground mt-1">Manage customer reviews and ratings across the store.</p>
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-lg p-4 flex gap-3 text-sm">
        <ShieldAlert className="w-5 h-5 shrink-0" />
        <p>
          <strong>Warning:</strong> Deleting a review uses a database transaction to mathematically subtract the rating and recalculate the product's average score. This action cannot be undone.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Rating</th>
                <th className="px-6 py-4 font-medium max-w-xs">Review</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No reviews found.
                  </td>
                </tr>
              ) : (
                reviews.map(review => (
                  <tr key={review.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{review.userName || "Anonymous"}</div>
                      {review.isVerifiedPurchase && (
                        <div className="text-xs text-green-600 font-medium">Verified</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground max-w-[200px] truncate" title={review.productName}>
                        {review.productName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <ReviewStars rating={review.rating} size={14} />
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="font-medium text-foreground truncate">{review.title}</div>
                      <div className="text-muted-foreground truncate">{review.comment}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {review.createdAt ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true }) : "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(review.id, review.productId)}
                        disabled={deletingId === review.id}
                        className="text-destructive hover:text-destructive/80 p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                        title="Delete Review"
                      >
                        {deletingId === review.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

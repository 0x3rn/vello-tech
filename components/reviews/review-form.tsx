"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { useUserStore } from "@/lib/store/user"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ReviewStars } from "./review-stars"
import { submitReview, deleteReview } from "@/lib/services/reviews"
import { toast } from "sonner"
import { Loader2, Trash2 } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import Link from "next/link"

interface ReviewFormProps {
  productId: string
  onReviewSubmitted: () => void
}

export function ReviewForm({ productId, onReviewSubmitted }: ReviewFormProps) {
  const { user } = useAuth()
  const { userData } = useUserStore()
  
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState("")
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [existingReview, setExistingReview] = useState<any>(null)
  const [loadingExisting, setLoadingExisting] = useState(true)

  const fetchExistingReview = useCallback(async () => {
    if (!user) {
      setLoadingExisting(false)
      return
    }
    
    setLoadingExisting(true)
    try {
      const q = query(
        collection(db, "reviews"),
        where("productId", "==", productId),
        where("userId", "==", user.uid)
      )
      const snap = await getDocs(q)
      if (!snap.empty) {
        setExistingReview({ id: snap.docs[0].id, ...snap.docs[0].data() })
      } else {
        setExistingReview(null)
      }
    } catch (error) {
      console.error("Error checking for existing review:", error)
    } finally {
      setLoadingExisting(false)
    }
  }, [user, productId])

  useEffect(() => {
    fetchExistingReview()
  }, [fetchExistingReview])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (rating === 0) {
      toast.error("Please select a star rating")
      return
    }
    if (!title.trim() || !comment.trim()) {
      toast.error("Please provide both a title and a comment")
      return
    }

    setIsSubmitting(true)
    try {
      const userName = userData?.name || user.displayName || "Anonymous"
      await submitReview({
        productId,
        userId: user.uid,
        userName,
        rating,
        title: title.trim(),
        comment: comment.trim()
      })
      
      toast.success("Review submitted successfully!")
      setRating(0)
      setTitle("")
      setComment("")
      await fetchExistingReview()
      onReviewSubmitted()
    } catch (error) {
      console.error("Error submitting review:", error)
      toast.error("Failed to submit review. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!existingReview) return
    if (!window.confirm("Are you sure you want to delete your review?")) return
    
    setIsDeleting(true)
    try {
      await deleteReview(existingReview.id, productId, user!.uid)
      toast.success("Review deleted successfully")
      setExistingReview(null)
      setRating(0)
      setTitle("")
      setComment("")
      onReviewSubmitted()
    } catch (error) {
      console.error("Error deleting review:", error)
      toast.error("Failed to delete review")
    } finally {
      setIsDeleting(false)
    }
  }

  if (loadingExisting) {
    return (
      <div className="flex justify-center p-8 bg-secondary/10 rounded-xl border border-border">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center p-8 bg-secondary/10 rounded-xl border border-border">
        <h3 className="text-lg font-semibold mb-2">Write a Review</h3>
        <p className="text-muted-foreground mb-4">Please log in to share your thoughts about this product.</p>
        <Link href="/auth/login">
          <Button variant="outline">Log In to Review</Button>
        </Link>
      </div>
    )
  }

  if (existingReview) {
    return (
      <div className="p-6 bg-secondary/10 rounded-xl border border-border">
        <h3 className="text-lg font-semibold mb-4">Your Review</h3>
        <div className="bg-card p-4 rounded-lg border border-border mb-4">
          <ReviewStars rating={existingReview.rating} size={16} />
          <h4 className="font-semibold mt-2">{existingReview.title}</h4>
          <p className="text-muted-foreground text-sm mt-1">{existingReview.comment}</p>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">You have already reviewed this product.</p>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleDelete}
            disabled={isDeleting}
            className="ml-auto"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
            Delete Review
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-card rounded-xl border border-border space-y-4">
      <h3 className="text-lg font-semibold">Write a Review</h3>
      
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">Overall Rating</label>
        <ReviewStars 
          rating={rating} 
          hoverRating={hoverRating}
          size={24} 
          interactive={true} 
          onRatingChange={setRating}
          onHoverChange={setHoverRating}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground block mb-1">Review Title</label>
        <Input 
          placeholder="Sum up your experience" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground block mb-1">Review</label>
        <Textarea 
          placeholder="Tell others what you thought about this product..." 
          className="min-h-[100px]"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : "Submit Review"}
      </Button>
    </form>
  )
}

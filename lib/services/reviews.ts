import { db } from "@/lib/firebase"
import { collection, doc, runTransaction, query, where, getDocs, getDoc } from "firebase/firestore"

export interface ReviewData {
  productId: string
  userId: string
  userName: string
  rating: number
  title: string
  comment: string
}

export async function submitReview(data: ReviewData) {
  // Check if verified purchase
  let isVerifiedPurchase = false
  try {
    const q = query(collection(db, "orders"), where("uid", "==", data.userId))
    const snapshot = await getDocs(q)
    for (const orderDoc of snapshot.docs) {
      const orderData = orderDoc.data()
      if (orderData.items && Array.isArray(orderData.items)) {
        if (orderData.items.some((item: any) => item.id === data.productId || item.productId === data.productId)) {
          isVerifiedPurchase = true
          break
        }
      }
    }
  } catch (error) {
    console.error("Error checking verified purchase:", error)
  }

  // Transaction
  const newReviewRef = doc(collection(db, "reviews"))
  const productRef = doc(db, "products", data.productId)

  await runTransaction(db, async (transaction) => {
    const productDoc = await transaction.get(productRef)
    if (!productDoc.exists()) {
      throw new Error("Product does not exist!")
    }

    const pData = productDoc.data()
    const currentRating = pData.rating || 0
    const currentNumReviews = pData.numReviews || 0

    // Math: New Avg = ((Current Avg * Current Count) + New Rating) / (Current Count + 1)
    const newNumReviews = currentNumReviews + 1
    const newRating = ((currentRating * currentNumReviews) + data.rating) / newNumReviews

    // Save the review
    transaction.set(newReviewRef, {
      ...data,
      isVerifiedPurchase,
      createdAt: new Date().toISOString()
    })

    // Update the product
    transaction.update(productRef, {
      rating: Number(newRating.toFixed(1)),
      numReviews: newNumReviews
    })
  })

  return { success: true, isVerifiedPurchase }
}

export async function deleteReview(reviewId: string, productId: string) {
  const reviewRef = doc(db, "reviews", reviewId)
  const productRef = doc(db, "products", productId)

  await runTransaction(db, async (transaction) => {
    const reviewDoc = await transaction.get(reviewRef)
    if (!reviewDoc.exists()) {
      throw new Error("Review does not exist!")
    }
    const rData = reviewDoc.data()
    const deletedRating = rData.rating

    const productDoc = await transaction.get(productRef)
    if (!productDoc.exists()) {
      throw new Error("Product does not exist!")
    }

    const pData = productDoc.data()
    const currentRating = pData.rating || 0
    const currentNumReviews = pData.numReviews || 0

    let newRating = 0
    let newNumReviews = currentNumReviews - 1

    if (newNumReviews > 0) {
      newRating = ((currentRating * currentNumReviews) - deletedRating) / newNumReviews
    } else {
      newNumReviews = 0
      newRating = 0
    }

    transaction.delete(reviewRef)
    transaction.update(productRef, {
      rating: Number(newRating.toFixed(1)),
      numReviews: newNumReviews
    })
  })

  return { success: true }
}

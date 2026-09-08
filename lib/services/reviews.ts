export interface ReviewData {
  productId: string
  userId: string
  userName: string
  rating: number
  title: string
  comment: string
}

async function requestJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init)
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || "Review request failed")
  return data
}

export async function submitReview(data: ReviewData) {
  return requestJson('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: data.productId, rating: data.rating, title: data.title, comment: data.comment }) })
}

export async function deleteReview(reviewId: string, _productId: string, _callerUserId: string) {
  return requestJson('/api/reviews', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reviewId }) })
}

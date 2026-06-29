"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface ReviewStarsProps {
  rating: number
  maxRating?: number
  size?: number
  interactive?: boolean
  onRatingChange?: (rating: number) => void
  hoverRating?: number
  onHoverChange?: (rating: number) => void
  className?: string
}

export function ReviewStars({
  rating,
  maxRating = 5,
  size = 16,
  interactive = false,
  onRatingChange,
  hoverRating = 0,
  onHoverChange,
  className
}: ReviewStarsProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: maxRating }).map((_, i) => {
        const starValue = i + 1
        const activeRating = interactive && hoverRating > 0 ? hoverRating : rating
        const isFilled = starValue <= activeRating

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRatingChange?.(starValue)}
            onMouseEnter={() => interactive && onHoverChange?.(starValue)}
            onMouseLeave={() => interactive && onHoverChange?.(0)}
            className={cn(
              "transition-all duration-200 focus:outline-none",
              interactive ? "cursor-pointer hover:scale-110" : "cursor-default"
            )}
          >
            <Star
              className={cn(
                "transition-colors duration-200",
                isFilled ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"
              )}
              style={{ width: size, height: size }}
            />
          </button>
        )
      })}
    </div>
  )
}

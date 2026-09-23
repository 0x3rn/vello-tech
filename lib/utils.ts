import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveImageUrl(url: string | undefined): string {
  if (!url || url.startsWith('https://via.placeholder.com/') || url.startsWith('http://via.placeholder.com/')) return '/product-image-unavailable.svg';
  // Basic validation to prevent next/image crash from bad data (e.g. "..")
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
    return '/product-image-unavailable.svg';
  }
  
  return url;
}

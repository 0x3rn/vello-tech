import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveImageUrl(url: string | undefined): string {
  if (!url) return 'https://via.placeholder.com/500x500.png?text=No+Image';
  // Basic validation to prevent next/image crash from bad data (e.g. "..")
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
    return 'https://via.placeholder.com/500x500.png?text=Invalid+Image';
  }
  
  return url;
}

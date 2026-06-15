import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveImageUrl(url: string | undefined): string {
  if (!url) return 'https://via.placeholder.com/500x500.png?text=No+Image';
  if (url.startsWith('gs://')) {
    const parts = url.replace('gs://', '').split('/');
    const bucket = parts[0];
    const filePath = parts.slice(1).join('%2F');
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${filePath}?alt=media`;
  }
  return url;
}
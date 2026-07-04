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
  
  // Basic validation to prevent next/image crash from bad data (e.g. "..")
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
    return 'https://via.placeholder.com/500x500.png?text=Invalid+Image';
  }
  
  return url;
}

export function cleanFirestoreData<T>(data: any): T {
  if (!data || typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map((item: any) => cleanFirestoreData(item)) as any;
  }
  
  const result = { ...data } as any;
  
  for (const key in result) {
    if (result[key] && typeof result[key] === 'object') {
      if ('toDate' in result[key] && typeof result[key].toDate === 'function') {
        result[key] = result[key].toDate().toISOString();
      } else if ('seconds' in result[key] && 'nanoseconds' in result[key]) {
        result[key] = new Date(result[key].seconds * 1000).toISOString();
      } else if (Array.isArray(result[key])) {
        result[key] = result[key].map((item: any) => cleanFirestoreData(item));
      } else {
        result[key] = cleanFirestoreData(result[key]);
      }
    }
  }
  return result as T;
}
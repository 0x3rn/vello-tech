export function firebaseStorageKey(url: string) {
  if (url.startsWith("gs://")) {
    const withoutProtocol = url.slice("gs://".length);
    const slash = withoutProtocol.indexOf("/");
    return slash === -1 ? null : decodeURIComponent(withoutProtocol.slice(slash + 1));
  }

  try {
    const parsed = new URL(url);
    const marker = "/o/";
    const index = parsed.pathname.indexOf(marker);
    if (index !== -1) return decodeURIComponent(parsed.pathname.slice(index + marker.length));
  } catch {
    // Non-Firebase image URLs are supported as external images.
  }

  return null;
}

export function isFirebaseStorageUrl(url: string) {
  return url.startsWith("gs://") || url.includes("firebasestorage.googleapis.com");
}

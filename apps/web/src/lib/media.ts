export function isBlobMediaUrl(url: string | null | undefined) {
  if (!url) {
    return false
  }

  try {
    return new URL(url).hostname.endsWith(".blob.vercel-storage.com")
  } catch {
    return false
  }
}

export function getMediaUrl(url: string | null | undefined) {
  if (!url) {
    return undefined
  }

  try {
    if (isBlobMediaUrl(url)) {
      const mediaUrl = new URL(
        "/api/upload/media",
        import.meta.env.VITE_API_URL
      )
      mediaUrl.searchParams.set("url", url)
      return mediaUrl.toString()
    }
  } catch {
    return url
  }

  return url
}

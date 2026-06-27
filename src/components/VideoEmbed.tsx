/** Wandelt eine YouTube-URL in eine Embed-URL um. */
function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (u.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`
    }
    return url
  } catch {
    return null
  }
}

export function VideoEmbed({ url, title }: { url: string; title: string }) {
  const embed = toEmbedUrl(url)
  if (!embed) return null
  return (
    <div className="video-embed">
      <iframe
        src={embed}
        title={`Video: ${title}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  )
}

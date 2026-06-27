import { useToast } from '../context/ToastContext'
import { track } from '../lib/analytics'

interface ShareButtonsProps {
  title: string
  path: string
}

export function ShareButtons({ title, path }: ShareButtonsProps) {
  const { notify } = useToast()
  const url =
    typeof window !== 'undefined' ? `${window.location.origin}${path}` : path

  const nativeShare = async () => {
    track('share', { method: 'native', title })
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
      } catch {
        /* abgebrochen */
      }
    } else {
      await copyLink()
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      notify('Link kopiert', 'success')
      track('share', { method: 'copy' })
    } catch {
      notify('Kopieren nicht möglich', 'error')
    }
  }

  const enc = encodeURIComponent
  const links = [
    { label: 'X', href: `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}` },
    { label: 'Reddit', href: `https://www.reddit.com/submit?url=${enc(url)}&title=${enc(title)}` },
    { label: 'WhatsApp', href: `https://wa.me/?text=${enc(`${title} ${url}`)}` },
  ]

  return (
    <div className="share" role="group" aria-label="Artikel teilen">
      <button type="button" className="btn btn--small" onClick={nativeShare}>
        Teilen
      </button>
      {links.map((l) => (
        <a
          key={l.label}
          className="btn btn--small btn--ghost"
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('share', { method: l.label })}
        >
          {l.label}
        </a>
      ))}
      <button type="button" className="btn btn--small btn--ghost" onClick={copyLink}>
        Link kopieren
      </button>
    </div>
  )
}

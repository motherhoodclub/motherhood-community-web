/**
 * Turns an admin-pasted embed snippet or share/watch link (Loom, YouTube,
 * Vimeo, Google Drive) into a safe iframe `src` we control.
 *
 * Shared by workshop recordings (lib/entitlements gating on
 * workshops.recording_embed) and course lesson videos
 * (course_lessons.video_url) — same input UX, same validation, one place to
 * add a new provider.
 *
 * We never render admin-supplied HTML directly (dangerouslySetInnerHTML) —
 * that would let a pasted snippet run arbitrary scripts. Instead we pull out
 * just the `src` URL (or a bare share/watch link), resolve it to its
 * embeddable form, validate the host, and build our own <iframe> around it.
 */

const ALLOWED_EMBED_HOSTS = [
  "loom.com",
  "www.loom.com",
  "youtube.com",
  "www.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "player.vimeo.com",
  "drive.google.com",
]

function isAllowedEmbedUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "https:") return false
    return ALLOWED_EMBED_HOSTS.includes(parsed.hostname)
  } catch {
    return false
  }
}

/** Resolve a share/watch link from a known provider to its embeddable form. */
function resolveKnownProvider(url: string): string {
  const loomShare = url.match(/loom\.com\/share\/([A-Za-z0-9]+)/i)
  if (loomShare) return `https://www.loom.com/embed/${loomShare[1]}`

  // YouTube: youtu.be/ID, watch?v=ID, /embed/ID, /shorts/ID
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/)?.[1]
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt}`

  // Vimeo: vimeo.com/ID or player.vimeo.com/video/ID
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1]
  if (vimeo) return `https://player.vimeo.com/video/${vimeo}`

  return url
}

/**
 * Accepts either a raw `<iframe ... src="...">` embed snippet (e.g. Loom's
 * "Embed" option) or a bare share/watch link (Loom, YouTube, Vimeo, Google
 * Drive), and returns a safe, embeddable `https://...` URL — or null if
 * nothing usable/safe was found.
 */
export function extractEmbedSrc(input: string | null | undefined): string | null {
  if (!input) return null
  const trimmed = input.trim()
  if (!trimmed) return null

  const iframeMatch = trimmed.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i)
  const candidate = resolveKnownProvider(iframeMatch ? iframeMatch[1] : trimmed)

  return isAllowedEmbedUrl(candidate) ? candidate : null
}

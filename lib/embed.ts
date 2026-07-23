/**
 * Helpers for turning an admin-pasted Loom (or similar) embed snippet / share
 * link into a safe iframe `src` we control.
 *
 * We never render admin-supplied HTML directly (dangerouslySetInnerHTML) —
 * that would let a pasted snippet run arbitrary scripts. Instead we pull out
 * just the `src` URL, validate it, and build our own <iframe> around it.
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

/**
 * Accepts either a raw `<iframe ... src="...">` embed snippet (e.g. Loom's
 * "Embed" option) or a bare share link (e.g. a Loom "Share" URL), and returns
 * a safe, embeddable `https://...` URL — or null if nothing usable/safe was
 * found.
 */
export function extractEmbedSrc(input: string | null | undefined): string | null {
  if (!input) return null
  const trimmed = input.trim()
  if (!trimmed) return null

  const iframeMatch = trimmed.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i)
  let candidate = iframeMatch ? iframeMatch[1] : trimmed

  // Loom share links (loom.com/share/ID) aren't embeddable directly — convert
  // to the /embed/ID form, same idea as lib/courses.ts's videoEmbedUrl().
  const loomShare = candidate.match(/loom\.com\/share\/([A-Za-z0-9]+)/i)
  if (loomShare) {
    candidate = `https://www.loom.com/embed/${loomShare[1]}`
  }

  return isAllowedEmbedUrl(candidate) ? candidate : null
}

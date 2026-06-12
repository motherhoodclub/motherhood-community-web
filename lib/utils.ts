import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Supported media extensions for topic media (uploads bucket)
export const IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "avif",
  "svg",
  "bmp",
  "heic",
  "heif",
  "tiff",
  "ico",
]

export const VIDEO_EXTENSIONS = ["mp4", "webm", "ogg", "ogv", "mov", "m4v", "mkv", "avi", "3gp", "quicktime"]

function extensionOf(url: string): string {
  // Strip query string / cache busters before reading the extension
  const clean = url.split("?")[0].split("#")[0]
  return clean.split(".").pop()?.toLowerCase() || ""
}

export function isImageUrl(url: string): boolean {
  return IMAGE_EXTENSIONS.includes(extensionOf(url))
}

export function isVideoUrl(url: string): boolean {
  return VIDEO_EXTENSIONS.includes(extensionOf(url))
}

/** Build a public URL for a path stored in the `uploads` bucket. */
export function uploadsPublicUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${path}`
}

/**
 * True when rich-text HTML carries no real content (empty paragraphs only),
 * yet still has no embedded media. Used to validate the topic body editor.
 */
export function isHtmlContentEmpty(html: string): boolean {
  if (!html) return true
  // Media counts as content even with no text
  if (/<(img|video|iframe)\b/i.test(html)) return false
  const text = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim()
  return text.length === 0
}

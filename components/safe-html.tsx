"use client"

import { useMemo } from "react"
import DOMPurify from "isomorphic-dompurify"
import { cn } from "@/lib/utils"

// Force every link in published content to open safely in a new tab.
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    node.setAttribute("target", "_blank")
    node.setAttribute("rel", "noopener noreferrer nofollow")
  }
})

interface SafeHtmlProps {
  html: string
  className?: string
}

/**
 * Renders admin-authored rich-text HTML (from the TipTap editor) after
 * sanitizing it. Shares the `.rich-content` styles with the editor so the
 * published view matches what was composed.
 */
export default function SafeHtml({ html, className }: SafeHtmlProps) {
  const clean = useMemo(
    () =>
      DOMPurify.sanitize(html || "", {
        ADD_TAGS: ["iframe", "video", "source"],
        ADD_ATTR: [
          "allow",
          "allowfullscreen",
          "frameborder",
          "scrolling",
          "target",
          "controls",
          "src",
          "width",
          "height",
          "rel",
        ],
        ALLOW_DATA_ATTR: false,
      }),
    [html],
  )

  return <div className={cn("rich-content", className)} dangerouslySetInnerHTML={{ __html: clean }} />
}

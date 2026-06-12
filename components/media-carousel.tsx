"use client"

import { useCallback, useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn, isVideoUrl, uploadsPublicUrl } from "@/lib/utils"

function Slide({ url }: { url: string }) {
  const src = uploadsPublicUrl(url)
  if (isVideoUrl(url)) {
    return <video src={src} controls className="max-h-[500px] w-full rounded-lg bg-black object-contain" />
  }
  return <img src={src} alt="" className="max-h-[500px] w-full rounded-lg object-contain" />
}

/**
 * Swipeable RTL carousel for a topic's media gallery (the `media_urls` array).
 * Falls back to a plain block when there is a single item.
 */
export default function MediaCarousel({ urls }: { urls: string[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ direction: "rtl", align: "center" })
  const [selected, setSelected] = useState(0)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelected(emblaApi.selectedScrollSnap())
    setCanPrev(emblaApi.canScrollPrev())
    setCanNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
    return () => {
      emblaApi.off("select", onSelect)
      emblaApi.off("reInit", onSelect)
    }
  }, [emblaApi, onSelect])

  if (!urls || urls.length === 0) return null

  if (urls.length === 1) {
    return (
      <div className="mt-6">
        <Slide url={urls[0]} />
      </div>
    )
  }

  return (
    <div className="relative mt-6">
      <div className="overflow-hidden rounded-lg" ref={emblaRef}>
        <div className="flex">
          {urls.map((url, i) => (
            <div key={i} className="flex min-w-0 flex-[0_0_100%] items-center justify-center px-1">
              <Slide url={url} />
            </div>
          ))}
        </div>
      </div>

      {/* Previous (visually on the right in RTL) */}
      <button
        type="button"
        onClick={() => emblaApi?.scrollPrev()}
        disabled={!canPrev}
        aria-label="السابق"
        className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70 disabled:opacity-30"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      {/* Next */}
      <button
        type="button"
        onClick={() => emblaApi?.scrollNext()}
        disabled={!canNext}
        aria-label="التالي"
        className="absolute left-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70 disabled:opacity-30"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* Counter */}
      <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
        {selected + 1} / {urls.length}
      </div>

      {/* Dots */}
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {urls.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`الانتقال إلى ${i + 1}`}
            onClick={() => emblaApi?.scrollTo(i)}
            className={cn(
              "h-2 w-2 rounded-full transition-colors",
              i === selected ? "bg-primary" : "bg-muted-foreground/30 hover:bg-muted-foreground/50",
            )}
          />
        ))}
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Calendar, Clock, ArrowRight, ExternalLink, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { formatWorkshopDate } from "@/lib/date-utils"
import { useSubscription } from "@/context/subscription-context"
import { TierBadge, UpgradeCard } from "@/components/tier-gate"

type Workshop = {
  id: string
  title: string
  description: string
  date: string
  time: string
  zoom_url: string
  image_url: string
  min_tier: number | null
  created_at: string
  updated_at: string
  timezone?: string
}

export default function WorkshopDetailsPage({ params }: { params: { id: string } }) {
  const [workshop, setWorkshop] = useState<Workshop | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [localTime, setLocalTime] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { canAccess } = useSubscription()

  useEffect(() => {
    const fetchWorkshop = async () => {
      try {
        setIsLoading(true)
        const { data, error } = await supabase.from("workshops").select("*").eq("id", params.id).single()

        if (error) {
          console.error("Error fetching workshop:", error)
          router.push("/community/workshops")
        } else {
          setWorkshop(data)

          // Convert workshop time to local time
          if (data.date && data.time) {
            const workshopTimezone = data.timezone || "GMT-5" // Default to GMT-5 if not specified
            const gmtOffset = Number.parseInt(workshopTimezone.replace("GMT", "")) || -5

            // Parse the date and time
            const [hours, minutes] = data.time.split(":").map(Number)
            const workshopDate = new Date(data.date)

            // Set the time in the workshop's timezone (GMT-5)
            workshopDate.setUTCHours(hours - gmtOffset, minutes, 0, 0)

            // Format the time in the user's local timezone
            const localTimeStr = workshopDate.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })

            setLocalTime(localTimeStr)
          }
        }
      } catch (error) {
        console.error("Error in workshop fetch:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkshop()
  }, [supabase, params.id, router])

  useEffect(() => {
    // Check if dark mode is enabled
    const isDark = document.documentElement.classList.contains("dark")
    setIsDarkMode(isDark)
  }, [])

  const isPastWorkshop = (dateString: string) => {
    // Create date with noon time to avoid timezone issues
    const [year, month, day] = dateString.split("-").map(Number)
    const workshopDate = new Date(year, month - 1, day, 12, 0, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return workshopDate < today
  }

  // Make sure URL is absolute by adding https:// if it doesn't have a protocol
  const getAbsoluteUrl = (url: string) => {
    if (!url) return "#"
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url
    }
    return `https://${url}`
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => router.push("/community/workshops")}>
            <ArrowRight className="h-4 w-4" />
            <span>العودة إلى اللقاءات</span>
          </Button>
        </div>

        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-10 w-3/4" />
          <div className="flex gap-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-40 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    )
  }

  if (!workshop) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">لم يتم العثور على ورشة العمل</h2>
          <p className="mb-6">قد تكون ورشة العمل التي تبحث عنها غير موجودة أو تم حذفها.</p>
          <Button asChild>
            <Link href="/community/workshops">العودة إلى قائمة اللقاءات</Link>
          </Button>
        </div>
      </div>
    )
  }

  const isPast = isPastWorkshop(workshop.date)
  const absoluteZoomUrl = getAbsoluteUrl(workshop.zoom_url)
  const workshopTimezone = workshop.timezone || "GMT-5"
  const locked = !canAccess(workshop.min_tier)

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => router.push("/community/workshops")}>
          <ArrowRight className="h-4 w-4" />
          <span>العودة إلى اللقاءات</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-8">
          <div className="relative rounded-xl overflow-hidden shadow-md">
            <img
              src={workshop.image_url || "/placeholder.svg?height=400&width=800"}
              alt={workshop.title}
              className={cn("w-full h-80 object-cover transition-all duration-300", isPast && "grayscale opacity-80")}
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=400&width=800"
              }}
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <TierBadge minTier={workshop.min_tier} />
              <Badge
                className={cn(
                  "text-sm px-3 py-1 shadow-lg",
                  isPast
                    ? "bg-gray-500 hover:bg-gray-600"
                    : "bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700",
                )}
              >
                {isPast ? "منتهي" : "قادم"}
              </Badge>
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">{workshop.title}</h1>

            <div className="flex flex-wrap gap-4 mb-8">
              <div
                className={cn(
                  "flex items-center px-4 py-2 rounded-full text-sm shadow-sm transition-colors",
                  isDarkMode ? "bg-gray-800 text-gray-200" : "bg-gray-100 text-gray-800",
                )}
              >
                <Calendar className="ml-2 h-4 w-4 text-pink-500" />
                <span>{formatWorkshopDate(workshop.date)}</span>
              </div>

              <div
                className={cn(
                  "flex items-center px-4 py-2 rounded-full text-sm shadow-sm transition-colors",
                  isDarkMode ? "bg-gray-800 text-gray-200" : "bg-gray-100 text-gray-800",
                )}
              >
                <Clock className="ml-2 h-4 w-4 text-pink-500" />
                <span>
                  {workshop.time} ({workshopTimezone})
                </span>
              </div>

              {localTime && (
                <div
                  className={cn(
                    "flex items-center px-4 py-2 rounded-full text-sm shadow-sm transition-colors",
                    isDarkMode ? "bg-gray-800 text-gray-200" : "bg-gray-100 text-gray-800",
                  )}
                >
                  <Globe className="ml-2 h-4 w-4 text-pink-500" />
                  <span>التوقيت المحلي: {localTime}</span>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">وصف اللقاء</h2>
              <div
                className={cn(
                  "prose max-w-none text-lg leading-relaxed rounded-xl p-6",
                  isDarkMode ? "prose-invert bg-gray-800/30" : "bg-gray-50",
                )}
              >
                <p className={cn("whitespace-pre-line", isDarkMode ? "text-gray-200" : "text-gray-800")}>
                  {workshop.description}
                </p>
              </div>
            </div>

            {locked ? (
              <div className="mt-10">
                <UpgradeCard
                  minTier={workshop.min_tier}
                  description={
                    isPast
                      ? "تسجيلات الورش السابقة متاحة ضمن الباقات الأعلى. رقّي اشتراكك لمشاهدة التسجيل."
                      : "حضور هذه الورشة متاح ضمن الباقات الأعلى. رقّي اشتراكك للانضمام."
                  }
                />
              </div>
            ) : !isPast ? (
              <div className="mt-10">
                <Button
                  asChild
                  size="lg"
                  className={cn(
                    "rounded-lg transition-all duration-200 text-base shadow-md",
                    "bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700",
                  )}
                >
                  <a href={absoluteZoomUrl} target="_blank" rel="noopener noreferrer">
                    <span>الانضمام للقاء</span>
                    <ExternalLink className="mr-2 h-5 w-5" />
                  </a>
                </Button>
              </div>
            ) : (
              <div className="mt-10">
                <Card
                  className={cn(
                    "border transition-colors duration-200 shadow-md",
                    isDarkMode ? "bg-gray-800/70 border-gray-700" : "bg-gray-50 border-gray-200",
                  )}
                >
                  <CardContent className="p-8">
                    <h3 className="text-xl font-semibold mb-4">تسجيل اللقاء</h3>
                    <p className={cn("text-lg", isDarkMode ? "text-gray-300" : "text-gray-600")}>
                      يمكنك مشاهدة تسجيل اللقاء من خلال الرابط أدناه.
                    </p>
                    <Button
                      asChild
                      size="lg"
                      className="mt-6 rounded-lg transition-all duration-200 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 shadow-md"
                    >
                      <a href={absoluteZoomUrl} target="_blank" rel="noopener noreferrer">
                        <span>مشاهدة التسجيل</span>
                        <ExternalLink className="mr-2 h-5 w-5" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

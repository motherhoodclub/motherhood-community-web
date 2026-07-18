"use client"

import { CardTitle } from "@/components/ui/card"

import { CardFooter } from "@/components/ui/card"

import { CardHeader } from "@/components/ui/card"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Calendar, Clock, ExternalLink, Search, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { formatWorkshopDate } from "@/lib/date-utils"
import { Pagination } from "@/components/pagination"
import { useSubscription } from "@/context/subscription-context"
import { TierBadge } from "@/components/tier-gate"
import { Lock } from "lucide-react"

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
}

export default function WorkshopsPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [filteredWorkshops, setFilteredWorkshops] = useState<Workshop[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [upcomingPage, setUpcomingPage] = useState(1)
  const [pastPage, setPastPage] = useState(1)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { canAccess } = useSubscription()
  const ITEMS_PER_PAGE = 6

  useEffect(() => {
    const fetchWorkshops = async () => {
      try {
        setIsLoading(true)
        // Gated API: locked workshops come back with zoom_url = null so the join
        // link never reaches the browser for tiers that can't access them.
        const res = await fetch("/api/workshops")
        const data = await res.json()

        if (!res.ok) {
          console.error("Error fetching workshops:", data?.error)
        } else {
          setWorkshops(data.workshops || [])
          setFilteredWorkshops(data.workshops || [])
        }
      } catch (error) {
        console.error("Error in workshop fetch:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkshops()
  }, [])

  useEffect(() => {
    // Check if dark mode is enabled
    const isDark = document.documentElement.classList.contains("dark")
    setIsDarkMode(isDark)
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredWorkshops(workshops)
    } else {
      const filtered = workshops.filter(
        (workshop) =>
          workshop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          workshop.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredWorkshops(filtered)
    }
    setUpcomingPage(1)
    setPastPage(1)
  }, [searchQuery, workshops])

  const isPastWorkshop = (dateString: string) => {
    // Create date with noon time to avoid timezone issues
    const [year, month, day] = dateString.split("-").map(Number)
    const workshopDate = new Date(year, month - 1, day, 12, 0, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return workshopDate < today
  }

  const upcomingWorkshops = useMemo(
    () => filteredWorkshops.filter((workshop) => !isPastWorkshop(workshop.date)),
    [filteredWorkshops],
  )

  const pastWorkshops = useMemo(
    () => filteredWorkshops.filter((workshop) => isPastWorkshop(workshop.date)),
    [filteredWorkshops],
  )

  const upcomingTotalPages = Math.ceil(upcomingWorkshops.length / ITEMS_PER_PAGE)
  const pastTotalPages = Math.ceil(pastWorkshops.length / ITEMS_PER_PAGE)

  const paginatedUpcoming = useMemo(
    () => upcomingWorkshops.slice((upcomingPage - 1) * ITEMS_PER_PAGE, upcomingPage * ITEMS_PER_PAGE),
    [upcomingWorkshops, upcomingPage],
  )

  const paginatedPast = useMemo(
    () => pastWorkshops.slice((pastPage - 1) * ITEMS_PER_PAGE, pastPage * ITEMS_PER_PAGE),
    [pastWorkshops, pastPage],
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">ورش العمل واللقاءات</h1>
          <p className={cn("text-lg", isDarkMode ? "text-gray-400" : "text-gray-600")}>
            انضمي إلى ورش العمل واللقاءات المجتمعية لتعلم مهارات جديدة والتواصل مع أمهات أخريات
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="ابحث عن ورشة عمل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full pr-10 text-right rounded-lg transition-colors duration-200",
                isDarkMode
                  ? "bg-gray-800/50 border-gray-700 placeholder:text-gray-500"
                  : "bg-white border-gray-200 placeholder:text-gray-400",
              )}
            />
          </div>
        </div>
      </div>

      {/* Upcoming Workshops Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center">
          <Calendar className="ml-2 h-5 w-5 text-pink-500" />
          اللقاءات القادمة
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                className={cn(
                  "overflow-hidden",
                  isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200",
                )}
              >
                <Skeleton className="h-48 w-full" />
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : upcomingWorkshops.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedUpcoming.map((workshop) => (
                <Card
                  key={workshop.id}
                  className={cn(
                    "overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col h-full",
                    isDarkMode
                      ? "bg-gray-800 border-gray-700 hover:border-pink-500/50"
                      : "bg-white border-gray-200 hover:border-pink-500/50",
                  )}
                >
                  <div className="relative h-48 w-full overflow-hidden">
                    <img
                      src={workshop.image_url || "/placeholder.svg?height=192&width=384"}
                      alt={workshop.title}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute top-3 right-3 flex gap-1">
                      <TierBadge minTier={workshop.min_tier} />
                      <Badge className="bg-pink-500 hover:bg-pink-600 text-white">قادم</Badge>
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl">{workshop.title}</CardTitle>
                    <div className="flex items-center text-sm mt-2">
                      <Calendar className="ml-1 h-4 w-4 text-pink-500" />
                      <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                        {formatWorkshopDate(workshop.date)}
                      </span>
                      <span className="mx-2">•</span>
                      <Clock className="ml-1 h-4 w-4 text-pink-500" />
                      <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>{workshop.time}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className={cn("line-clamp-3 text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                      {workshop.description}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button
                      asChild
                      variant="outline"
                      className={cn(
                        "rounded-lg transition-colors duration-200",
                        isDarkMode
                          ? "bg-gray-700 hover:bg-gray-600 border-gray-600"
                          : "bg-gray-50 hover:bg-gray-100 border-gray-200",
                      )}
                    >
                      <Link href={`/community/workshops/${workshop.id}`}>
                        <span>التفاصيل</span>
                      </Link>
                    </Button>
                    {canAccess(workshop.min_tier) ? (
                      <Button
                        asChild
                        className={cn(
                          "rounded-lg transition-all duration-200",
                          "bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700",
                        )}
                      >
                        <Link href={workshop.zoom_url} target="_blank" rel="noopener noreferrer">
                          <span>الانضمام</span>
                          <ExternalLink className="mr-1 h-4 w-4" />
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        asChild
                        className={cn(
                          "rounded-lg transition-all duration-200",
                          "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700",
                        )}
                      >
                        <Link href={`/community/workshops/${workshop.id}`}>
                          <span>ترقية للانضمام</span>
                          <Lock className="mr-1 h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
            {upcomingTotalPages > 1 && (
              <Pagination
                currentPage={upcomingPage}
                totalPages={upcomingTotalPages}
                onPageChange={setUpcomingPage}
              />
            )}
          </>
        ) : (
          <div
            className={cn(
              "text-center py-12 rounded-lg border-2 border-dashed",
              isDarkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500",
            )}
          >
            <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium mb-2">لا توجد لقاءات قادمة</h3>
            <p className="max-w-md mx-auto">
              لم يتم العثور على لقاءات قادمة. يمكنك التسجيل لإقامة ورشة عمل جديدة أو التحقق لاحقًا.
            </p>
          </div>
        )}
      </div>

      {/* Past Workshops Section */}
      <div className="space-y-4 mt-10">
        <h2 className="text-xl font-semibold flex items-center">
          <Calendar className="ml-2 h-5 w-5 text-gray-500" />
          اللقاءات السابقة
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2].map((i) => (
              <Card
                key={i}
                className={cn(
                  "overflow-hidden",
                  isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200",
                )}
              >
                <Skeleton className="h-48 w-full" />
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : pastWorkshops.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedPast.map((workshop) => (
                <Card
                  key={workshop.id}
                  className={cn(
                    "overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col h-full",
                    isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200",
                  )}
                >
                  <div className="relative h-48 w-full overflow-hidden">
                    <img
                      src={workshop.image_url || "/placeholder.svg?height=192&width=384"}
                      alt={workshop.title}
                      className={cn(
                        "w-full h-full object-cover transition-transform duration-300 hover:scale-105 grayscale opacity-80",
                      )}
                    />
                    <div className="absolute top-3 right-3 flex gap-1">
                      <TierBadge minTier={workshop.min_tier} />
                      <Badge className="bg-gray-500 hover:bg-gray-600 text-white">منتهي</Badge>
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl">{workshop.title}</CardTitle>
                    <div className="flex items-center text-sm mt-2">
                      <Calendar className="ml-1 h-4 w-4 text-gray-500" />
                      <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                        {formatWorkshopDate(workshop.date)}
                      </span>
                      <span className="mx-2">•</span>
                      <Clock className="ml-1 h-4 w-4 text-gray-500" />
                      <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>{workshop.time}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className={cn("line-clamp-3 text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                      {workshop.description}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      asChild
                      variant="outline"
                      className={cn(
                        "w-full rounded-lg transition-colors duration-200",
                        isDarkMode
                          ? "bg-gray-700 hover:bg-gray-600 border-gray-600"
                          : "bg-gray-50 hover:bg-gray-100 border-gray-200",
                      )}
                    >
                      <Link href={`/community/workshops/${workshop.id}`}>
                        <span>عرض التفاصيل والتسجيلات</span>
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            {pastTotalPages > 1 && (
              <Pagination
                currentPage={pastPage}
                totalPages={pastTotalPages}
                onPageChange={setPastPage}
              />
            )}
          </>
        ) : (
          <div
            className={cn(
              "text-center py-8 rounded-lg border-2 border-dashed",
              isDarkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500",
            )}
          >
            <h3 className="text-lg font-medium mb-2">لا توجد لقاءات سابقة</h3>
            <p>لم يتم العثور على لقاءات سابقة في النظام.</p>
          </div>
        )}
      </div>
    </div>
  )
}

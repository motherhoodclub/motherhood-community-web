"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Bell,
  Calendar,
  Home,
  Sun,
  Moon,
  LogOut,
  Settings,
  User,
  CreditCard,
  Shield,
  TrendingUp,
  CalendarCheck,
  ShoppingBag,
  Instagram,
  MessageCircle,
  FileText,
} from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "@/components/auth/use-session"
import { formatArabicDate } from "@/lib/date-utils"
import FloatingChat from "@/components/floating-chat"
import { Smartphone, X } from "lucide-react"

const defaultCategoryIcons: Record<string, string> = {
  "الحمل والولادة": "🤰",
  "تربية الأطفال": "👶",
  "الصحة والتغذية": "🥗",
  "كل ما يخص اطفال التوحد": "🧠",
  "أخرى": "📂",
}

const ageGroups = [
  { name: "عمر من صفر لسنتين", icon: "👶" },
  { name: "سنتين ل 6 سنوات", icon: "🧒" },
  { name: "6-14 سنة", icon: "👦" },
]

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [workshops, setWorkshops] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const { session } = useSession()
  const [popularTopics, setPopularTopics] = useState([])
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [downloadableFiles, setDownloadableFiles] = useState([])
  const [showAppBanner, setShowAppBanner] = useState(true)
  const [categories, setCategories] = useState<{ name: string; icon: string; count: number }[]>([])

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error("Error fetching user:", error)
      } finally {
        setIsLoading(false)
      }
    }
    getUser()
  }, [supabase])

  // Fetch categories from DB with topic counts
  useEffect(() => {
    const fetchCategories = async () => {
      const { data: catData } = await supabase
        .from("topic_categories")
        .select("name")
        .order("created_at", { ascending: true })

      if (catData) {
        const categoriesWithCounts = await Promise.all(
          catData.map(async (cat) => {
            const { count } = await supabase
              .from("topics")
              .select("id", { count: "exact", head: true })
              .eq("category", cat.name)
            return {
              name: cat.name,
              icon: defaultCategoryIcons[cat.name] || "📁",
              count: count || 0,
            }
          })
        )
        setCategories(categoriesWithCounts)
      }
    }
    fetchCategories()
  }, [supabase])

  useEffect(() => {
    const fetchWorkshops = async () => {
      try {
        setIsLoading(true)
        // Get current date in YYYY-MM-DD format
        const today = new Date().toISOString().split("T")[0]

        console.log("Fetching workshops...")
        const { data, error } = await supabase
          .from("workshops")
          .select("*")
          .gte("date", today) // Only get workshops with dates greater than or equal to today
          .order("date", { ascending: true })
          .limit(2)

        if (error) {
          console.error("Error fetching workshops:", error)
        } else {
          console.log("Workshops fetched:", data)
          setWorkshops(data || [])
        }
      } catch (error) {
        console.error("Error in workshop fetch:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkshops()
  }, [supabase])

  useEffect(() => {
    const fetchPopularTopics = async () => {
      try {
        const { data, error } = await supabase
          .from("topics")
          .select("id, title, featured_image_url, category, created_at")
          .order("views", { ascending: false })
          .limit(6)

        if (error) throw error

        setPopularTopics(data)
      } catch (error) {
        console.error("Error fetching popular topics:", error)
      }
    }

    fetchPopularTopics()
  }, [supabase])

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return

      try {
        // Fetch the latest notifications (topics and workshops)
        const { data: topicNotifications, error: topicError } = await supabase
          .from("topics")
          .select("id, title, created_at, user_id")
          .order("created_at", { ascending: false })
          .limit(5)

        const { data: workshopNotifications, error: workshopError } = await supabase
          .from("workshops")
          .select("id, title, date")
          .order("date", { ascending: false })
          .limit(5)

        // New: Fetch comments for topics authored by the current admin
        const { data: adminTopicIds, error: adminTopicError } = await supabase
          .from("topics")
          .select("id")
          .eq("user_id", user.id)

        // Only fetch comments if the user has topics
        let commentNotifications = []
        if (adminTopicIds && adminTopicIds.length > 0) {
          const topicIds = adminTopicIds.map((topic) => topic.id)
          const { data: comments, error: commentsError } = await supabase
            .from("comments")
            .select(`
              id, 
              content, 
              created_at, 
              topic_id,
              user_id
            `)
            .in("topic_id", topicIds)
            .order("created_at", { ascending: false })
            .limit(5)

          if (!commentsError && comments && comments.length > 0) {
            // Get topic titles
            const { data: topics } = await supabase
              .from("topics")
              .select("id, title")
              .in(
                "id",
                comments.map((c) => c.topic_id),
              )

            const topicMap = {}
            if (topics) {
              topics.forEach((topic) => {
                topicMap[topic.id] = topic.title
              })
            }

            // Get usernames
            const { data: users } = await supabase
              .from("user_profiles")
              .select("id, username, avatar_url")
              .in(
                "id",
                comments.map((c) => c.user_id),
              )

            const userMap = {}
            if (users) {
              users.forEach((user) => {
                userMap[user.id] = {
                  username: user.username || "مستخدم",
                  avatar_url: user.avatar_url,
                }
              })
            }

            commentNotifications = comments.map((comment) => {
              const username = userMap[comment.user_id]?.username || "مستخدم"
              const topicTitle = topicMap[comment.topic_id] || "موضوع"

              return {
                id: `comment-${comment.id}`,
                title: `تعليق جديد على "${topicTitle}" من ${username}`,
                type: "comment",
                entityId: comment.topic_id,
                commentId: comment.id,
                date: new Date(comment.created_at),
                isNew: new Date(comment.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000),
                read: false,
              }
            })
          }
        }

        // New: Fetch question replies for admins
        let questionReplyNotifications = []
        const { data: userProfile } = await supabase.from("user_profiles").select("is_admin").eq("id", user.id).single()

        const isAdmin =
          userProfile?.is_admin === true ||
          userProfile?.is_admin === "true" ||
          userProfile?.is_admin === 1 ||
          userProfile?.is_admin === "1"

        if (isAdmin) {
          const { data: questionReplies, error: questionRepliesError } = await supabase
            .from("question_replies")
            .select(`
              id, 
              content, 
              created_at, 
              question_id,
              user_id
            `)
            .order("created_at", { ascending: false })
            .limit(5)

          if (!questionRepliesError && questionReplies && questionReplies.length > 0) {
            // Get question titles
            const { data: questions } = await supabase
              .from("questions")
              .select("id, title")
              .in(
                "id",
                questionReplies.map((r) => r.question_id),
              )

            const questionMap = {}
            if (questions) {
              questions.forEach((question) => {
                questionMap[question.id] = question.title
              })
            }

            // Get usernames
            const { data: users } = await supabase
              .from("user_profiles")
              .select("id, username")
              .in(
                "id",
                questionReplies.map((r) => r.user_id),
              )

            const userMap = {}
            if (users) {
              users.forEach((user) => {
                userMap[user.id] = user.username || "مستخدم"
              })
            }

            questionReplyNotifications = questionReplies.map((reply) => {
              const username = userMap[reply.user_id] || "مستخدم"
              const questionTitle = questionMap[reply.question_id] || "سؤال"

              return {
                id: `question-reply-${reply.id}`,
                title: `رد جديد على سؤال "${questionTitle}" من ${username}`,
                type: "question-reply",
                entityId: reply.question_id,
                replyId: reply.id,
                date: new Date(reply.created_at),
                isNew: new Date(reply.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000),
                read: false,
              }
            })
          }
        }

        if (topicError) throw topicError
        if (workshopError) throw workshopError

        // Combine and sort notifications
        const combinedNotifications = [
          ...(topicNotifications || []).map((topic) => ({
            id: `topic-${topic.id}`,
            title: topic.title,
            type: "topic",
            entityId: topic.id,
            date: new Date(topic.created_at),
            isNew: new Date(topic.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000),
            read: false,
          })),
          ...(workshopNotifications || []).map((workshop) => ({
            id: `workshop-${workshop.id}`,
            title: workshop.title,
            type: "workshop",
            entityId: workshop.id,
            date: new Date(workshop.date),
            isNew: new Date(workshop.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            read: false,
          })),
          ...commentNotifications,
          ...questionReplyNotifications,
        ]
          .sort((a, b) => b.date - a.date)
          .slice(0, 10)

        setNotifications(combinedNotifications)
        setUnreadCount(combinedNotifications.filter((n) => n.isNew).length)
      } catch (error) {
        console.error("Error fetching notifications:", error)
      }
    }

    if (user) {
      fetchNotifications()
      // Set up interval to check for new notifications every minute
      const interval = setInterval(fetchNotifications, 60000)
      return () => clearInterval(interval)
    }
  }, [user, supabase])

  useEffect(() => {
    const fetchDownloadableFiles = async () => {
      try {
        const response = await fetch("/api/downloadable-files?limit=4")
        const data = await response.json()

        if (response.ok) {
          setDownloadableFiles(data.files || [])
        }
      } catch (error) {
        console.error("Error fetching downloadable files:", error)
      }
    }

    fetchDownloadableFiles()
  }, [])

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    toast({
      title: "تم تسجيل الخروج بنجاح",
      description: "نراك قريبًا!",
      duration: 3000,
    })
  }

  return (
    <div
      className={cn(
        "min-h-screen transition-colors duration-200",
        isDarkMode ? "dark bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900",
      )}
    >
      {/* App Promotion Banner */}
      {showAppBanner && (
        <div className="bg-gradient-to-r from-primary to-primary/90 text-white py-2 sm:py-2.5 px-4 relative">
          <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm">
            <span className="font-medium">حمّل التطبيق الآن!</span>
            <div className="flex items-center gap-3">
              <a
                href="https://play.google.com/store/apps/details?id=com.mmayman1009.motherhoodclubappqy4uoy10&hl=en"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-105"
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                  alt="Google Play"
                  className="h-8 sm:h-9"
                />
              </a>
              <a
                href="https://apps.apple.com/in/app/motherhoodclub-community/id6749237917?platform=vision"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-105"
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                  alt="App Store"
                  className="h-8 sm:h-9"
                />
              </a>
            </div>
            <button
              onClick={() => setShowAppBanner(false)}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/20 rounded-full transition-colors"
              aria-label="إغلاق"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-opacity-80 transition-colors duration-200",
          isDarkMode ? "border-gray-800 bg-gray-900/95" : "border-gray-200 bg-white/95",
        )}
      >
        <div className="w-full px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Right Side - Logo */}
            <Link href="/community" className="flex items-center gap-2 group transition-all duration-300">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/motherhood-logo0000-removebg-preview-sAzmBcfpsdciCNpfitUjwE1a8jBi8P.png"
                alt="نادي الأمومة"
                className="h-[35px] md:h-[50px] w-auto object-contain"
              />
            </Link>

            {/* Center - Empty space */}
            <div className="hidden md:flex flex-1 mx-8"></div>

            {/* Left Side - Navigation Icons and Profile */}
            <div className="flex items-center">
              {/* Icons grouped together */}
              <div className="flex items-center gap-1 md:gap-2 ml-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleDarkMode}
                        className="rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                      >
                        {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">{isDarkMode ? "الوضع النهاري" : "الوضع الليلي"}</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                      >
                        <Link href="/community">
                          <Home className="h-5 w-5" />
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">الرئيسية</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                      >
                        <Link href="https://community.motherhoodclub.net/community/workshops">
                          <Calendar className="h-5 w-5" />
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">الفعاليات</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                      >
                        <Link href="/community/chat">
                          <MessageCircle className="h-5 w-5" />
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">المحادثات</TooltipContent>
                  </Tooltip>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full relative text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                      >
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                            <span className="animate-ping absolute h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative rounded-full h-3 w-3 bg-primary"></span>
                          </span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className={cn(
                        "rounded-xl p-2 border shadow-lg w-80 transition-colors duration-200",
                        isDarkMode
                          ? "bg-gray-800 text-white border-gray-700 shadow-gray-900/50"
                          : "bg-white text-gray-900 border-gray-200 shadow-gray-200/50",
                      )}
                    >
                      <DropdownMenuLabel
                        className={cn("px-2 py-1.5 mb-1", isDarkMode ? "text-gray-300" : "text-gray-700")}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">الإشعارات</span>
                          {unreadCount > 0 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                              {unreadCount} جديد
                            </span>
                          )}
                        </div>
                      </DropdownMenuLabel>

                      <div className="max-h-[300px] overflow-y-auto py-1">
                        {notifications.length > 0 ? (
                          notifications.map((notification) => (
                            <DropdownMenuItem
                              key={notification.id}
                              asChild
                              className={cn(
                                "px-2 py-2 rounded-lg my-1 transition-colors duration-200",
                                notification.isNew ? "bg-primary/10" : "",
                                isDarkMode
                                  ? "hover:bg-gray-700 focus:bg-primary/90"
                                  : "hover:bg-gray-100 focus:bg-primary/50",
                              )}
                            >
                              <Link
                                href={
                                  notification.type === "topic"
                                    ? `/community/topic/${notification.entityId}`
                                    : notification.type === "workshop"
                                      ? `/community/workshops/${notification.entityId}`
                                      : notification.type === "comment"
                                        ? `/community/topic/${notification.entityId}#comment-${notification.commentId}`
                                        : notification.type === "question-reply"
                                          ? `/community/question/${notification.entityId}#reply-${notification.replyId}`
                                          : `/community/notifications`
                                }
                                className="flex items-start gap-2 w-full"
                              >
                                <div
                                  className={cn(
                                    "mt-1 flex-shrink-0 h-2 w-2 rounded-full",
                                    notification.isNew ? "bg-primary" : "bg-gray-400 dark:bg-gray-600",
                                  )}
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium line-clamp-2">{notification.title}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {notification.type === "topic"
                                      ? "موضوع جديد"
                                      : notification.type === "workshop"
                                        ? "ورشة عمل جديدة"
                                        : notification.type === "comment"
                                          ? "تعليق جديد"
                                          : notification.type === "question-reply"
                                            ? "رد على سؤال"
                                            : "إشعار"}{" "}
                                    • {formatArabicDate(notification.date)}
                                  </p>
                                </div>
                              </Link>
                            </DropdownMenuItem>
                          ))
                        ) : (
                          <div className="px-2 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            لا توجد إشعارات جديدة
                          </div>
                        )}
                      </div>

                      <DropdownMenuSeparator className={isDarkMode ? "bg-gray-700 my-1" : "bg-gray-200 my-1"} />

                      <DropdownMenuItem
                        asChild
                        className={cn(
                          "px-2 py-1.5 rounded-lg my-1 transition-colors duration-200 text-center justify-center",
                          isDarkMode
                            ? "hover:bg-gray-700 focus:bg-primary/90"
                            : "hover:bg-gray-100 focus:bg-primary/50",
                        )}
                      >
                        <Link href="/community/notifications" className="w-full text-center">
                          عرض جميع الإشعارات
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TooltipProvider>
              </div>

              {/* Profile dropdown kept in its place */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full overflow-hidden h-9 w-9 p-0 transition-transform hover:scale-105 duration-200"
                  >
                    {isLoading ? (
                      <Skeleton className="h-9 w-9 rounded-full" />
                    ) : (
                      <Avatar className="cursor-pointer h-9 w-9 border-2 border-primary/20">
                        <AvatarImage src={user?.user_metadata?.avatar_url || "/placeholder.svg?height=32&width=32"} />
                        <AvatarFallback className="bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 font-medium">
                          {user?.user_metadata?.name?.[0] || "م"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className={cn(
                    "rounded-xl p-2 border shadow-lg w-56 transition-colors duration-200",
                    isDarkMode
                      ? "bg-gray-800 text-white border-gray-700 shadow-gray-900/50"
                      : "bg-white text-gray-900 border-gray-200 shadow-gray-200/50",
                  )}
                >
                  <DropdownMenuLabel className={cn("px-2 py-1.5 mb-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                    <div className="flex flex-col">
                      <span className="font-medium">{user?.user_metadata?.name || "مستخدم"}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                        {user?.email || "user@example.com"}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  {user?.user_metadata?.is_admin && (
                    <>
                      <DropdownMenuItem
                        asChild
                        className={cn(
                          "px-2 py-1.5 rounded-lg my-1 transition-colors duration-200",
                          isDarkMode
                            ? "hover:bg-gray-700 focus:bg-primary/90"
                            : "hover:bg-gray-100 focus:bg-primary/50",
                        )}
                      >
                        <Link href="/admin" className="flex items-center">
                          <Shield className="ml-2 h-4 w-4 text-primary" />
                          <span>لوحة الإدارة</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className={isDarkMode ? "bg-gray-700 my-1" : "bg-gray-200 my-1"} />
                    </>
                  )}
                  <DropdownMenuItem
                    asChild
                    className={cn(
                      "px-2 py-1.5 rounded-lg my-1 transition-colors duration-200",
                      isDarkMode ? "hover:bg-gray-700 focus:bg-primary/90" : "hover:bg-gray-100 focus:bg-primary/50",
                    )}
                  >
                    <Link href="/community/profile" className="flex items-center">
                      <User className="ml-2 h-4 w-4 text-blue-500" />
                      <span>الملف الشخصي</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className={cn(
                      "px-2 py-1.5 rounded-lg my-1 transition-colors duration-200",
                      isDarkMode ? "hover:bg-gray-700 focus:bg-primary/90" : "hover:bg-gray-100 focus:bg-primary/50",
                    )}
                  >
                    <Link href="/community/settings" className="flex items-center">
                      <Settings className="ml-2 h-4 w-4 text-gray-500" />
                      <span>الإعدادات</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className={cn(
                      "px-2 py-1.5 rounded-lg my-1 transition-colors duration-200",
                      isDarkMode ? "hover:bg-gray-700 focus:bg-primary/90" : "hover:bg-gray-100 focus:bg-primary/50",
                    )}
                  >
                    <Link href="/community/subscription" className="flex items-center">
                      <CreditCard className="ml-2 h-4 w-4 text-green-500" />
                      <span>الاشتراك</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className={isDarkMode ? "bg-gray-700 my-1" : "bg-gray-200 my-1"} />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className={cn(
                      "px-2 py-1.5 rounded-lg my-1 transition-colors duration-200",
                      isDarkMode ? "hover:bg-gray-700 focus:bg-primary/90" : "hover:bg-gray-100 focus:bg-primary/50",
                    )}
                  >
                    <LogOut className="ml-2 h-4 w-4 text-red-500" />
                    <span>تسجيل الخروج</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Search removed */}

      {/* Main Content */}
      <div className="w-full px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Right Sidebar */}
          <aside className="hidden md:block md:col-span-2">
            <div className="space-y-6 sticky top-20">
              <div>
                <h3 className={cn("text-sm font-semibold mb-3", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                  تصنيفات المواضيع
                </h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <Link
                      key={category.name}
                      href={`/community?category=${encodeURIComponent(category.name)}`}
                      className={cn(
                        "flex items-center justify-between rounded-lg p-2 transition-all duration-200 group",
                        isDarkMode ? "bg-gray-800/50 hover:bg-gray-700/50" : "bg-gray-100 hover:bg-gray-200",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg group-hover:scale-110 transition-transform duration-200">
                          {category.icon}
                        </span>
                        <span className={cn("text-xs truncate", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                          {category.name}
                        </span>
                      </div>
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded-full",
                        isDarkMode ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-500",
                      )}>
                        {category.count}
                      </span>
                    </Link>
                  ))}
                  <Link
                    href="/community?category=all"
                    className={cn(
                      "block text-center text-xs py-1.5 rounded-lg transition-colors",
                      isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700",
                    )}
                  >
                    عرض الكل
                  </Link>
                </div>
              </div>

              <div>
                <h3 className={cn("text-sm font-semibold mb-3", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                  الفئة العمرية
                </h3>
                <div className="space-y-2">
                  {ageGroups.map((ageGroup) => (
                    <Link
                      key={ageGroup.name}
                      href={`/community/age-group/${encodeURIComponent(ageGroup.name)}`}
                      className={cn(
                        "flex items-center justify-between rounded-lg p-2 transition-all duration-200 group",
                        isDarkMode ? "bg-gray-800/50 hover:bg-gray-700/50" : "bg-gray-100 hover:bg-gray-200",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg group-hover:scale-110 transition-transform duration-200">
                          {ageGroup.icon}
                        </span>
                        <span className={cn("truncate", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                          {ageGroup.name}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h3
                  className={cn(
                    "text-sm font-semibold mb-3 flex items-center",
                    isDarkMode ? "text-gray-400" : "text-gray-600",
                  )}
                >
                  <TrendingUp className="h-4 w-4 ml-1.5" />
                  مواضيع شائعة
                </h3>
                <div className="space-y-3">
                  {popularTopics.map((topic) => (
                    <Link key={topic.id} href={`/community/topic/${topic.id}`}>
                      <div
                        className={cn(
                          "flex items-center space-x-3 space-x-reverse p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800",
                        )}
                      >
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={
                              topic.featured_image_url
                                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${topic.featured_image_url}`
                                : "/placeholder.svg?height=64&width=64"
                            }
                            alt={topic.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-grow">
                          <h4
                            className={cn(
                              "font-medium line-clamp-2 mb-1",
                              isDarkMode ? "text-gray-200" : "text-gray-800",
                            )}
                          >
                            {topic.title}
                          </h4>
                          <div className="flex items-center text-xs">
                            <span
                              className={cn(
                                "px-2 py-1 rounded-full",
                                isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700",
                              )}
                            >
                              {topic.category}
                            </span>
                            <span className={cn("ml-2", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                              {formatArabicDate(topic.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="md:col-span-7 space-y-6">{children}</main>

          {/* Left Sidebar - Events and Podcasts */}
          <aside className="hidden md:block md:col-span-3">
            <div
              className={cn(
                "space-y-6 sticky top-20 p-4 rounded-xl border transition-colors duration-200",
                isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-gray-50 border-gray-200",
              )}
            >
              <div>
                <h3
                  className={cn(
                    "text-sm font-semibold mb-3 flex items-center",
                    isDarkMode ? "text-gray-400" : "text-gray-600",
                  )}
                >
                  <Calendar className="h-4 w-4 ml-1.5" />
                  اللقاءات القادمة
                </h3>
                <div className="space-y-4">
                  {isLoading ? (
                    <>
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <Skeleton className="h-14 w-14 rounded-lg" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <Skeleton className="h-14 w-14 rounded-lg" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </>
                  ) : workshops && workshops.length > 0 ? (
                    workshops.map((workshop) => {
                      // Update the date handling for workshops in the sidebar
                      const [year, month, day] = workshop.date.split("-").map(Number)
                      const workshopDate = new Date(year, month - 1, day, 12, 0, 0)

                      return (
                        <Link key={workshop.id} href={`/community/workshops/${workshop.id}`}>
                          <div className="flex items-center space-x-4 space-x-reverse group">
                            <div className="relative h-14 w-14 rounded-lg overflow-hidden">
                              <img
                                src={workshop.image_url || "/placeholder.svg?height=56&width=56"}
                                alt={workshop.title}
                                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg?height=56&width=56"
                                }}
                              />
                              <div
                                className={cn(
                                  "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                                  isDarkMode ? "bg-primary" : "bg-primary",
                                )}
                              />
                            </div>
                            <div>
                              <h4
                                className={cn(
                                  "font-medium group-hover:text-primary transition-colors duration-200",
                                  isDarkMode ? "text-gray-200" : "text-gray-800",
                                )}
                              >
                                {workshop.title}
                              </h4>
                              <p className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                                {formatArabicDate(workshopDate)} • {workshop.time}
                              </p>
                            </div>
                          </div>
                        </Link>
                      )
                    })
                  ) : (
                    <p className={isDarkMode ? "text-gray-400 text-sm" : "text-gray-500 text-sm"}>
                      لا توجد لقاءات قادمة حالياً
                    </p>
                  )}

                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-full mt-2 rounded-lg transition-colors duration-200",
                      isDarkMode
                        ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700"
                        : "bg-white hover:bg-gray-100 text-gray-700 border-gray-300",
                    )}
                  >
                    <Link href="/community/workshops">عرض جميع اللقاءات</Link>
                  </Button>
                </div>
              </div>

              <div>
                <h3
                  className={cn(
                    "text-sm font-semibold mb-3 flex items-center",
                    isDarkMode ? "text-gray-400" : "text-gray-600",
                  )}
                >
                  <FileText className="h-4 w-4 ml-1.5" />
                  ملفات قابلة للتحميل
                </h3>
                <div className="space-y-3">
                  {downloadableFiles.length > 0 ? (
                    downloadableFiles.map((file) => (
                      <Link key={file.id} href={`/community/downloadable-files/${file.id}`}>
                        <div className="flex items-center space-x-3 space-x-reverse group">
                          <div className="relative h-12 w-12 rounded-lg overflow-hidden">
                            <img
                              src={
                                file.featured_image_url
                                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${file.featured_image_url}`
                                  : "/placeholder.svg?height=48&width=48"
                              }
                              alt={file.title}
                              className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg?height=48&width=48"
                              }}
                            />
                            <div
                              className={cn(
                                "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                                isDarkMode ? "bg-primary" : "bg-primary",
                              )}
                            />
                          </div>
                          <div className="flex-1">
                            <h4
                              className={cn(
                                "font-medium group-hover:text-primary transition-colors duration-200 line-clamp-2",
                                isDarkMode ? "text-gray-200" : "text-gray-800",
                              )}
                            >
                              {file.title}
                            </h4>
                            <p className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                              {file.file_type?.split("/")[1]?.toUpperCase() || "ملف"} • {file.download_count} تحميل
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className={isDarkMode ? "text-gray-400 text-sm" : "text-gray-500 text-sm"}>
                      لا توجد ملفات متاحة حالياً
                    </p>
                  )}

                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-full mt-2 rounded-lg transition-colors duration-200",
                      isDarkMode
                        ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700"
                        : "bg-white hover:bg-gray-100 text-gray-700 border-gray-300",
                    )}
                  >
                    <Link href="/community/downloadable-files">عرض جميع الملفات</Link>
                  </Button>
                </div>
              </div>

              <Separator className={isDarkMode ? "bg-gray-800" : "bg-gray-200"} />

              <div>
                <h3
                  className={cn(
                    "text-sm font-semibold mb-3 flex items-center",
                    isDarkMode ? "text-gray-400" : "text-gray-600",
                  )}
                >
                  تواصل معنا
                </h3>
                <div className="space-y-3">
                  <a
                    href="https://t.me/+D7BotU8cqRpjYzFj"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800",
                      isDarkMode ? "text-gray-200" : "text-gray-800",
                    )}
                  >
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white">
                      <MessageCircle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">انضم لمجموعة التلجرام</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">مجتمع الدعم التربوي</p>
                    </div>
                  </a>

                  <a
                    href="https://www.instagram.com/parentingsupporthub?igsh=bWw5anVnZWpyM2po&utm_source=qr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800",
                      isDarkMode ? "text-gray-200" : "text-gray-800",
                    )}
                  >
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-500 text-white">
                      <Instagram className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">تابعنا على انستجرام</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Parenting Support Hub</p>
                    </div>
                  </a>
                </div>
              </div>

              <Separator className={isDarkMode ? "bg-gray-800" : "bg-gray-200"} />

              <div>
                <h3
                  className={cn(
                    "text-sm font-semibold mb-3 flex items-center",
                    isDarkMode ? "text-gray-400" : "text-gray-600",
                  )}
                >
                  <CalendarCheck className="h-4 w-4 ml-1.5" />
                  حجز استشارة شخصية
                </h3>
                <Card
                  className={cn(
                    "border transition-colors duration-200 overflow-hidden",
                    isDarkMode ? "bg-gray-800/70 border-gray-700" : "bg-white border-gray-200",
                  )}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent opacity-60"></div>
                    <img
                      src="https://images.unsplash.com/photo-1573497620053-ea5300f94f21?q=80&w=2000&auto=format&fit=crop"
                      alt="استشارة شخصية"
                      className="w-full h-32 object-cover"
                    />
                  </div>
                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="text-base">استشارة تربوية مخصصة</CardTitle>
                    <CardDescription className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                      احصل على حلول مخصصة لتحديات طفلك
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center gap-2">
                        <span className="text-primary">✓</span>
                        <span>جلسة خاصة مع مستشارة متخصصة</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-primary">✓</span>
                        <span>خطة عملية قابلة للتطبيق</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      asChild
                      variant="default"
                      size="sm"
                      className={cn(
                        "w-full rounded-lg transition-all duration-200",
                        "bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-secondary",
                      )}
                    >
                      <Link
                        href="https://motherhoodclub.net/%D8%A7%D9%84%D9%85%D8%AE%D8%AA%D8%B5%D9%88%D9%86/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        احجز استشارتك الآن
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              <Separator className={isDarkMode ? "bg-gray-800" : "bg-gray-200"} />

              <div>
                <h3
                  className={cn(
                    "text-sm font-semibold mb-3 flex items-center",
                    isDarkMode ? "text-gray-400" : "text-gray-600",
                  )}
                >
                  <ShoppingBag className="h-4 w-4 ml-1.5" />
                  المتجر
                </h3>
                <Card
                  className={cn(
                    "border transition-colors duration-200 overflow-hidden",
                    isDarkMode ? "bg-gray-800/70 border-gray-700" : "bg-white border-gray-200",
                  )}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-secondary/20 to-transparent opacity-60"></div>
                    <img
                      src="https://images.unsplash.com/photo-1607082350899-7e105aa886ae?q=80&w=2000&auto=format&fit=crop"
                      alt="المتجر"
                      className="w-full h-32 object-cover"
                    />
                  </div>
                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="text-base">منتجات تربوية مميزة</CardTitle>
                    <CardDescription className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                      أدوات وموارد لدعم رحلة التربية
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center gap-2">
                        <span className="text-secondary">✓</span>
                        <span>كتب ومراجع تربوية</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-secondary">✓</span>
                        <span>ألعاب تعليمية وتنموية</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      asChild
                      variant="default"
                      size="sm"
                      className={cn(
                        "w-full rounded-lg transition-all duration-200",
                        "bg-gradient-to-r from-secondary to-primary hover:from-primary hover:to-secondary",
                      )}
                    >
                      <Link
                        href="https://motherhoodclub.net/%d8%a7%d9%84%d9%85%d8%aa%d8%ac%d8%b1/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        تسوق الآن
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              <Separator className={isDarkMode ? "bg-gray-800" : "bg-gray-200"} />
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Sidebar Content - Only visible on mobile */}
      <div className="md:hidden space-y-6 mt-8">
        {/* Categories */}
        <div
          className={cn(
            "p-4 rounded-xl border transition-colors duration-200",
            isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-gray-50 border-gray-200",
          )}
        >
          <h3 className={cn("text-sm font-semibold mb-3", isDarkMode ? "text-gray-400" : "text-gray-600")}>
            تصنيفات المواضيع
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={`/community?category=${encodeURIComponent(category.name)}`}
                className={cn(
                  "flex items-center justify-between rounded-lg p-2 transition-all duration-200 group",
                  isDarkMode ? "bg-gray-800/50 hover:bg-gray-700/50" : "bg-gray-100 hover:bg-gray-200",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg group-hover:scale-110 transition-transform duration-200">
                    {category.icon}
                  </span>
                  <span className={cn("text-xs truncate", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                    {category.name}
                  </span>
                </div>
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full",
                  isDarkMode ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-500",
                )}>
                  {category.count}
                </span>
              </Link>
            ))}
          </div>
          <Link
            href="/community?category=all"
            className={cn(
              "block text-center text-xs py-1.5 mt-2 rounded-lg transition-colors",
              isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700",
            )}
          >
            عرض الكل
          </Link>
        </div>

        {/* Age Groups */}
        <div
          className={cn(
            "p-4 rounded-xl border transition-colors duration-200",
            isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-gray-50 border-gray-200",
          )}
        >
          <h3 className={cn("text-sm font-semibold mb-3", isDarkMode ? "text-gray-400" : "text-gray-600")}>
            الفئة العمرية
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {ageGroups.map((ageGroup) => (
              <Link
                key={ageGroup.name}
                href={`/community/age-group/${encodeURIComponent(ageGroup.name)}`}
                className={cn(
                  "flex items-center justify-between rounded-lg p-2 transition-all duration-200 group",
                  isDarkMode ? "bg-gray-800/50 hover:bg-gray-700/50" : "bg-gray-100 hover:bg-gray-200",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg group-hover:scale-110 transition-transform duration-200">
                    {ageGroup.icon}
                  </span>
                  <span className={cn("truncate", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                    {ageGroup.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Popular Topics */}
        <div
          className={cn(
            "p-4 rounded-xl border transition-colors duration-200",
            isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-gray-50 border-gray-200",
          )}
        >
          <h3
            className={cn(
              "text-sm font-semibold mb-3 flex items-center",
              isDarkMode ? "text-gray-400" : "text-gray-600",
            )}
          >
            <TrendingUp className="h-4 w-4 ml-1.5" />
            مواضيع شائعة
          </h3>
          <div className="space-y-3">
            {popularTopics.slice(0, 3).map((topic) => (
              <Link key={topic.id} href={`/community/topic/${topic.id}`}>
                <div
                  className={cn(
                    "flex items-center space-x-3 space-x-reverse p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800",
                  )}
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={
                        topic.featured_image_url
                          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${topic.featured_image_url}`
                          : "/placeholder.svg?height=64&width=64"
                      }
                      alt={topic.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-grow">
                    <h4 className={cn("font-medium line-clamp-2 mb-1", isDarkMode ? "text-gray-200" : "text-gray-800")}>
                      {topic.title}
                    </h4>
                    <div className="flex items-center text-xs">
                      <span
                        className={cn(
                          "px-2 py-1 rounded-full",
                          isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700",
                        )}
                      >
                        {topic.category}
                      </span>
                      <span className={cn("ml-2", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                        {formatArabicDate(topic.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Upcoming Workshops */}
        <div
          className={cn(
            "p-4 rounded-xl border transition-colors duration-200",
            isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-gray-50 border-gray-200",
          )}
        >
          <h3
            className={cn(
              "text-sm font-semibold mb-3 flex items-center",
              isDarkMode ? "text-gray-400" : "text-gray-600",
            )}
          >
            <Calendar className="h-4 w-4 ml-1.5" />
            اللقاءات القادمة
          </h3>
          <div className="space-y-4">
            {isLoading ? (
              <>
                <div className="flex items-center space-x-4 space-x-reverse">
                  <Skeleton className="h-14 w-14 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </>
            ) : workshops && workshops.length > 0 ? (
              workshops.map((workshop) => {
                // Update the date handling for workshops in the sidebar
                const [year, month, day] = workshop.date.split("-").map(Number)
                const workshopDate = new Date(year, month - 1, day, 12, 0, 0)

                return (
                  <Link key={workshop.id} href={`/community/workshops/${workshop.id}`}>
                    <div className="flex items-center space-x-4 space-x-reverse group">
                      <div className="relative h-14 w-14 rounded-lg overflow-hidden">
                        <img
                          src={workshop.image_url || "/placeholder.svg?height=56&width=56"}
                          alt={workshop.title}
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=56&width=56"
                          }}
                        />
                        <div
                          className={cn(
                            "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                            isDarkMode ? "bg-primary" : "bg-primary",
                          )}
                        />
                      </div>
                      <div>
                        <h4
                          className={cn(
                            "font-medium group-hover:text-primary transition-colors duration-200",
                            isDarkMode ? "text-gray-200" : "text-gray-800",
                          )}
                        >
                          {workshop.title}
                        </h4>
                        <p className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                          {formatArabicDate(workshopDate)} • {workshop.time}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })
            ) : (
              <p className={isDarkMode ? "text-gray-400 text-sm" : "text-gray-500 text-sm"}>
                لا توجد لقاءات قادمة حالياً
              </p>
            )}

            <Button
              asChild
              variant="outline"
              size="sm"
              className={cn(
                "w-full mt-2 rounded-lg transition-colors duration-200",
                isDarkMode
                  ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700"
                  : "bg-white hover:bg-gray-100 text-gray-700 border-gray-300",
              )}
            >
              <Link href="/community/workshops">عرض جميع اللقاءات</Link>
            </Button>
          </div>
        </div>

        {/* Downloadable Files */}
        <div
          className={cn(
            "p-4 rounded-xl border transition-colors duration-200",
            isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-gray-50 border-gray-200",
          )}
        >
          <h3
            className={cn(
              "text-sm font-semibold mb-3 flex items-center",
              isDarkMode ? "text-gray-400" : "text-gray-600",
            )}
          >
            <FileText className="h-4 w-4 ml-1.5" />
            ملفات قابلة للتحميل
          </h3>
          <div className="space-y-3">
            {downloadableFiles.length > 0 ? (
              downloadableFiles.map((file) => (
                <Link key={file.id} href={`/community/downloadable-files/${file.id}`}>
                  <div className="flex items-center space-x-3 space-x-reverse group">
                    <div className="relative h-12 w-12 rounded-lg overflow-hidden">
                      <img
                        src={
                          file.featured_image_url
                            ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${file.featured_image_url}`
                            : "/placeholder.svg?height=48&width=48"
                        }
                        alt={file.title}
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=48&width=48"
                        }}
                      />
                      <div
                        className={cn(
                          "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                          isDarkMode ? "bg-primary" : "bg-primary",
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <h4
                        className={cn(
                          "font-medium group-hover:text-primary transition-colors duration-200 line-clamp-2",
                          isDarkMode ? "text-gray-200" : "text-gray-800",
                        )}
                      >
                        {file.title}
                      </h4>
                      <p className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                        {file.file_type?.split("/")[1]?.toUpperCase() || "ملف"} • {file.download_count} تحميل
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className={isDarkMode ? "text-gray-400 text-sm" : "text-gray-500 text-sm"}>
                لا توجد ملفات متاحة حالياً
              </p>
            )}

            <Button
              asChild
              variant="outline"
              size="sm"
              className={cn(
                "w-full mt-2 rounded-lg transition-colors duration-200",
                isDarkMode
                  ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700"
                  : "bg-white hover:bg-gray-100 text-gray-700 border-gray-300",
              )}
            >
              <Link href="/community/downloadable-files">عرض جميع الملفات</Link>
            </Button>
          </div>
        </div>

        {/* Consultation */}
        <div
          className={cn(
            "p-4 rounded-xl border transition-colors duration-200",
            isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-gray-50 border-gray-200",
          )}
        >
          <h3
            className={cn(
              "text-sm font-semibold mb-3 flex items-center",
              isDarkMode ? "text-gray-400" : "text-gray-600",
            )}
          >
            <CalendarCheck className="h-4 w-4 ml-1.5" />
            حجز استشارة شخصية
          </h3>
          <Card
            className={cn(
              "border transition-colors duration-200 overflow-hidden",
              isDarkMode ? "bg-gray-800/70 border-gray-700" : "bg-white border-gray-200",
            )}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent opacity-60"></div>
              <img
                src="https://images.unsplash.com/photo-1573497620053-ea5300f94f21?q=80&w=2000&auto=format&fit=crop"
                alt="استشارة شخصية"
                className="w-full h-32 object-cover"
              />
            </div>
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-base">استشارة تربوية مخصصة</CardTitle>
              <CardDescription className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                احصل على حلول مخصصة لتحديات طفلك
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  <span>جلسة خاصة مع مستشارة متخصصة</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  <span>خطة عملية قابلة للتطبيق</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                asChild
                variant="default"
                size="sm"
                className={cn(
                  "w-full rounded-lg transition-all duration-200",
                  "bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-secondary",
                )}
              >
                <Link
                  href="https://motherhoodclub.net/%D8%AD%D8%AC%D8%B2-%D8%A7%D8%B3%D8%AA%D8%B4%D8%A7%D8%B1%D8%A9/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  احجز استشارتك الآن
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Store */}
        <div
          className={cn(
            "p-4 rounded-xl border transition-colors duration-200",
            isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-gray-50 border-gray-200",
          )}
        >
          <h3
            className={cn(
              "text-sm font-semibold mb-3 flex items-center",
              isDarkMode ? "text-gray-400" : "text-gray-600",
            )}
          >
            <ShoppingBag className="h-4 w-4 ml-1.5" />
            المتجر
          </h3>
          <Card
            className={cn(
              "border transition-colors duration-200 overflow-hidden",
              isDarkMode ? "bg-gray-800/70 border-gray-700" : "bg-white border-gray-200",
            )}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-secondary/20 to-transparent opacity-60"></div>
              <img
                src="https://images.unsplash.com/photo-1607082350899-7e105aa886ae?q=80&w=2000&auto=format&fit=crop"
                alt="المتجر"
                className="w-full h-32 object-cover"
              />
            </div>
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-base">منتجات تربوية مميزة</CardTitle>
              <CardDescription className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                أدوات وموارد لدعم رحلة الأمومة
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-secondary">✓</span>
                  <span>كتب ومراجع تربوية</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-secondary">✓</span>
                  <span>ألعاب تعليمية وتنموية</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                asChild
                variant="default"
                size="sm"
                className={cn(
                  "w-full rounded-lg transition-all duration-200",
                  "bg-gradient-to-r from-secondary to-primary hover:from-primary hover:to-secondary",
                )}
              >
                <Link
                  href="https://motherhoodclub.net/%d8%a7%d9%84%d9%85%d8%aa%d8%ac%d8%b1/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  تسوق الآن
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Social Media Links - Mobile */}
        <div
          className={cn(
            "p-4 rounded-xl border transition-colors duration-200",
            isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-gray-50 border-gray-200",
          )}
        >
          <h3
            className={cn(
              "text-sm font-semibold mb-3 flex items-center",
              isDarkMode ? "text-gray-400" : "text-gray-600",
            )}
          >
            تواصل معنا
          </h3>
          <div className="space-y-3">
            <a
              href="https://t.me/+D7BotU8cqRpjYzFj"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800",
                isDarkMode ? "text-gray-200" : "text-gray-800",
              )}
            >
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="font-medium">انضم لمجموعة التلجرام</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">مجتمع الدعم التربوي</p>
              </div>
            </a>

            <a
              href="https://www.instagram.com/parentingsupporthub?igsh=bWw5anVnZWpyM2po&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800",
                isDarkMode ? "text-gray-200" : "text-gray-800",
              )}
            >
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-500 text-white">
                <Instagram className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="font-medium">تابعنا على انستجرام</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Parenting Support Hub</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Floating Chat */}
      <FloatingChat />
    </div>
  )
}

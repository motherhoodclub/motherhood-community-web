"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { motion } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"
import { isVideoUrl } from "@/lib/utils"

// UI Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

// Icons
import { MessageCircle, Heart, Eye, TrendingUp, BookmarkIcon, ArrowRight } from "lucide-react"

export default function BookmarksPage() {
  const [topics, setTopics] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [bookmarkedTopics, setBookmarkedTopics] = useState({})
  const [likedTopics, setLikedTopics] = useState({})

  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    // Load bookmarked topics from localStorage
    const savedBookmarks = localStorage.getItem("bookmarkedTopics")
    let bookmarks = {}

    if (savedBookmarks) {
      bookmarks = JSON.parse(savedBookmarks)
      setBookmarkedTopics(bookmarks)
    }

    // Load liked topics from localStorage
    const savedLikes = localStorage.getItem("likedTopics")
    if (savedLikes) {
      setLikedTopics(JSON.parse(savedLikes))
    }

    // Get the IDs of bookmarked topics
    const bookmarkedIds = Object.entries(bookmarks)
      .filter(([_, isBookmarked]) => isBookmarked)
      .map(([id, _]) => id)

    if (bookmarkedIds.length > 0) {
      fetchBookmarkedTopics(bookmarkedIds)
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchBookmarkedTopics = async (bookmarkedIds) => {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from("topics")
        .select("*")
        .in("id", bookmarkedIds)
        .order("created_at", { ascending: false })

      if (error) throw error

      setTopics(data || [])
    } catch (error) {
      console.error("Error fetching bookmarked topics:", error)
      setError(error.message)
      toast({
        title: "خطأ",
        description: `فشل في جلب المواضيع المحفوظة: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLike = (topicId) => {
    // Create a copy of the topics array
    const updatedTopics = [...topics]
    const topicIndex = updatedTopics.findIndex((t) => t.id === topicId)

    if (topicIndex !== -1) {
      const isLiked = likedTopics[topicId]

      // Update the likes count
      updatedTopics[topicIndex].likes = isLiked
        ? Math.max(0, (updatedTopics[topicIndex].likes || 0) - 1)
        : (updatedTopics[topicIndex].likes || 0) + 1

      // Update the topics state
      setTopics(updatedTopics)

      // Update the liked topics state
      const newLikedTopics = { ...likedTopics, [topicId]: !isLiked }
      setLikedTopics(newLikedTopics)

      // Save to localStorage
      localStorage.setItem("likedTopics", JSON.stringify(newLikedTopics))

      // Show a toast notification
      toast({
        title: isLiked ? "تم إلغاء الإعجاب" : "تم الإعجاب",
        description: isLiked ? "تم إلغاء إعجابك بهذا الموضوع" : "تم تسجيل إعجابك بهذا الموضوع",
        variant: "default",
      })
    }
  }

  const handleBookmark = (topicId) => {
    const isBookmarked = bookmarkedTopics[topicId]

    // Update the bookmarked topics state
    const newBookmarkedTopics = { ...bookmarkedTopics, [topicId]: !isBookmarked }
    setBookmarkedTopics(newBookmarkedTopics)

    // Save to localStorage
    localStorage.setItem("bookmarkedTopics", JSON.stringify(newBookmarkedTopics))

    // If unbookmarking, remove from the displayed list
    if (isBookmarked) {
      setTopics(topics.filter((topic) => topic.id !== topicId))
    }

    // Show a toast notification
    toast({
      title: "تم إلغاء الحفظ",
      description: "تم إلغاء حفظ هذا الموضوع من قائمة المحفوظات",
      variant: "default",
    })
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div className="container mx-auto space-y-8 py-6" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">المواضيع المحفوظة</h1>
          <p className="text-muted-foreground mt-1">المواضيع التي قمت بحفظها للرجوع إليها لاحقاً</p>
        </div>

        <Button variant="outline" className="flex items-center gap-2" asChild>
          <Link href="/community">
            <ArrowRight className="h-4 w-4" />
            العودة إلى المجتمع
          </Link>
        </Button>
      </div>

      {/* Content Section */}
      <div className="space-y-6">
        {isLoading ? (
          // Loading skeletons
          <div className="grid gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <Skeleton className="w-24 h-24 rounded-2xl" />
                    <div className="flex-1 space-y-4">
                      <Skeleton className="h-6 w-3/4" />
                      <div className="flex gap-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : topics.length === 0 ? (
          // Empty state
          <Card className="border-dashed bg-muted/20">
            <CardContent className="text-center py-12">
              <BookmarkIcon className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">لا توجد مواضيع محفوظة</h3>
              <p className="text-muted-foreground mb-6">
                لم تقم بحفظ أي موضوع بعد. يمكنك حفظ المواضيع للرجوع إليها لاحقاً.
              </p>
              <Button asChild>
                <Link href="/community">
                  <ArrowRight className="ml-2 h-4 w-4" />
                  استكشاف المجتمع
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          // Topics grid
          <motion.div className="grid gap-6" variants={containerVariants} initial="hidden" animate="visible">
            {topics.map((topic) => (
              <motion.div key={topic.id} variants={itemVariants} transition={{ duration: 0.3 }}>
                <Card className="overflow-hidden hover:shadow-md transition-all duration-300 border-muted/60 hover:border-primary/40 group">
                  <CardContent className="pt-6 pb-3 px-6">
                    <div className="flex flex-col sm:flex-row-reverse gap-4 sm:gap-6">
                      {/* Image container - Now on the right */}
                      <div className="relative w-full sm:w-36 h-32 shrink-0 rounded-xl overflow-hidden shadow-md border border-muted/50 group-hover:border-primary/30 transition-colors">
                        {topic.featured_image_url ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${topic.featured_image_url}`}
                            alt={topic.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : topic.media_urls && topic.media_urls.length > 0 ? (
                          topic.media_urls.map((mediaUrl, index) => (
                            <div key={index} className="absolute inset-0">
                              {isVideoUrl(mediaUrl) ? (
                                <video
                                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${mediaUrl}`}
                                  className="w-full h-full object-cover"
                                  muted
                                  loop
                                  autoPlay
                                />
                              ) : (
                                <img
                                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${mediaUrl}`}
                                  alt={`Media ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                          ))
                        ) : (
                          <img
                            src="/placeholder.svg?height=144&width=144"
                            alt={topic.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>

                      {/* Content container */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between text-right">
                        <div className="space-y-3">
                          {/* Category badges on top */}
                          <div className="flex flex-wrap gap-2 mb-2 justify-end">
                            {topic.category && (
                              <Badge
                                variant="secondary"
                                className="text-xs px-3 py-1 rounded-full font-medium bg-primary/10 text-primary border-none"
                              >
                                {topic.category}
                              </Badge>
                            )}
                            {topic.is_sticky && (
                              <Badge
                                variant="outline"
                                className="text-xs px-3 py-1 rounded-full border-amber-500/40 text-amber-600 bg-amber-500/10 font-medium"
                              >
                                <TrendingUp className="h-3 w-3 ml-1" />
                                مثبت
                              </Badge>
                            )}
                          </div>

                          {/* Title with better styling */}
                          <div className="text-right">
                            <Link
                              href={`/community/topic/${topic.id}`}
                              className="inline-block text-xl font-bold hover:text-primary transition-colors line-clamp-2 group-hover:text-primary"
                            >
                              {topic.title}
                            </Link>
                          </div>

                          {/* Topic excerpt/preview with better formatting */}
                          {topic.excerpt && (
                            <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed text-right">
                              {topic.excerpt}
                            </p>
                          )}
                        </div>

                        {/* Author and stats */}
                        <div className="flex flex-wrap items-center justify-between gap-y-3 text-sm text-muted-foreground pt-4 border-t border-muted/30 mt-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-7 h-7 ring-2 ring-primary/10">
                              <AvatarImage src={topic.author_avatar} alt={topic.author_name || "مستخدم"} />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                                {(topic.author_name || "م").charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{topic.author_name || "مستخدم"}</span>
                            <span className="text-muted-foreground/50">•</span>
                            <span title={new Date(topic.created_at).toLocaleString("ar-SA-u-ca-gregory")}>
                              {new Date(topic.created_at).toLocaleDateString("ar-SA-u-ca-gregory")}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span
                              className="flex items-center gap-1.5 bg-gray-50 dark:bg-muted/30 px-2 py-1 rounded-full"
                              title="عدد المشاهدات"
                            >
                              <Eye className="w-3.5 h-3.5 text-muted-foreground/70" />
                              {topic.views || 0}
                            </span>
                            <span
                              className="flex items-center gap-1.5 bg-gray-50 dark:bg-muted/30 px-2 py-1 rounded-full"
                              title="عدد الإعجابات"
                            >
                              <Heart className="w-3.5 h-3.5 text-muted-foreground/70" />
                              {topic.likes || 0}
                            </span>
                            <span
                              className="flex items-center gap-1.5 bg-gray-50 dark:bg-muted/30 px-2 py-1 rounded-full"
                              title="عدد التعليقات"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-muted-foreground/70" />
                              {topic.comments_count || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="px-4 py-3 border-t border-muted/30 bg-muted/5 flex justify-between items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-4 py-2 rounded-full bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary-foreground hover:bg-primary transition-all duration-200 text-sm font-medium"
                      asChild
                    >
                      <Link href={`/community/topic/${topic.id}`}>عرض الموضوع بالكامل</Link>
                    </Button>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 rounded-full hover:bg-primary/10 ${likedTopics[topic.id] ? "text-red-500" : "text-muted-foreground hover:text-primary"}`}
                        onClick={() => handleLike(topic.id)}
                        title={likedTopics[topic.id] ? "إلغاء الإعجاب" : "إعجاب"}
                      >
                        <Heart className={`h-4 w-4 ${likedTopics[topic.id] ? "fill-current" : ""}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-primary/10 text-primary"
                        onClick={() => handleBookmark(topic.id)}
                        title="إلغاء الحفظ"
                      >
                        <BookmarkIcon className="h-4 w-4 fill-current" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

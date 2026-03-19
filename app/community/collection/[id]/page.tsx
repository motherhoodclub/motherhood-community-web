"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { motion } from "framer-motion"
import { formatArabicDate } from "@/lib/date-utils"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/pagination"
import {
  MessageCircle,
  Heart,
  Eye,
  ArrowRight,
} from "lucide-react"

export default function CollectionPage() {
  const params = useParams()
  const collectionId = params.id as string

  const supabase = createClientComponentClient()

  const [collection, setCollection] = useState<any>(null)
  const [topics, setTopics] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [topicCount, setTopicCount] = useState(0)
  const itemsPerPage = 10

  // Fetch collection info
  useEffect(() => {
    const fetchCollection = async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("id", collectionId)
        .single()

      if (!error && data) {
        setCollection(data)
      }
    }
    fetchCollection()
  }, [collectionId])

  // Fetch topics in collection
  useEffect(() => {
    const fetchTopics = async () => {
      setIsLoading(true)
      try {
        // Count
        const { count } = await supabase
          .from("collection_topics")
          .select("id", { count: "exact", head: true })
          .eq("collection_id", collectionId)

        const total = Math.ceil((count || 0) / itemsPerPage)
        setTotalPages(total || 1)
        setTopicCount(count || 0)

        // Get topic IDs for this page
        const { data: junctionData, error: junctionError } = await supabase
          .from("collection_topics")
          .select("topic_id")
          .eq("collection_id", collectionId)
          .order("added_at", { ascending: false })
          .range(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage - 1
          )

        if (junctionError || !junctionData?.length) {
          setTopics([])
          setIsLoading(false)
          return
        }

        const topicIds = junctionData.map((j) => j.topic_id)

        // Fetch full topic data
        const { data: topicsData, error: topicsError } = await supabase
          .from("topics")
          .select("*")
          .in("id", topicIds)

        if (topicsError) throw topicsError

        // Preserve order from junction table
        const orderedTopics = topicIds
          .map((id) => topicsData?.find((t) => t.id === id))
          .filter(Boolean)

        // Fetch author profiles
        if (orderedTopics.length > 0) {
          const authorIds = [
            ...new Set(
              orderedTopics
                .map((t) => t.author_id || t.user_id || t.created_by || t.author)
                .filter(Boolean)
            ),
          ]

          if (authorIds.length > 0) {
            const { data: profiles } = await supabase
              .from("user_profiles")
              .select("id, username, avatar_url")
              .in("id", authorIds)

            const topicsWithProfiles = orderedTopics.map((topic) => {
              const authorId =
                topic.author_id || topic.user_id || topic.created_by || topic.author
              const profile = profiles?.find((p) => p.id === authorId)
              return { ...topic, user_profiles: profile || null }
            })

            setTopics(topicsWithProfiles)
          } else {
            setTopics(orderedTopics)
          }
        } else {
          setTopics([])
        }
      } catch (error) {
        console.error("Error fetching collection topics:", error)
        setTopics([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTopics()
  }, [collectionId, currentPage])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  if (!collection && !isLoading) {
    return (
      <div className="text-center py-12" dir="rtl">
        <h2 className="text-xl font-bold mb-2">المجموعة غير موجودة</h2>
        <Link href="/community" className="text-primary hover:underline">
          العودة للمجتمع
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Back link */}
      <Link
        href="/community"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowRight className="h-4 w-4" />
        العودة للمجتمع
      </Link>

      {/* Collection Header */}
      {collection && (
        <div className="bg-gradient-to-l from-primary/10 via-primary/5 to-transparent rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <span className="text-5xl">📂</span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary">
                {collection.name}
              </h1>
              {collection.description && (
                <p className="text-muted-foreground mt-1 text-sm">
                  {collection.description}
                </p>
              )}
              <p className="text-muted-foreground mt-1 text-xs">
                {topicCount} موضوع في هذه المجموعة
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Topics List */}
      {isLoading ? (
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
        <Card className="border-dashed bg-muted/20">
          <CardContent className="text-center py-12">
            <MessageCircle className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">لا توجد مواضيع</h3>
            <p className="text-muted-foreground">
              لا توجد مواضيع في هذه المجموعة حالياً
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <motion.div
            className="grid gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {topics.map((item) => (
              <motion.div
                key={item.id}
                variants={itemVariants}
                transition={{ duration: 0.3 }}
              >
                <Card className="overflow-hidden hover:shadow-md transition-all duration-300 border-muted/60 hover:border-primary/40 group">
                  <CardContent className="pt-6 pb-3 px-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row-reverse gap-4 sm:gap-6">
                      {/* Image */}
                      <div className="relative w-full sm:w-36 h-32 shrink-0 rounded-xl overflow-hidden shadow-md border border-muted/50 group-hover:border-primary/30 transition-colors">
                        {item.featured_image_url ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${item.featured_image_url}`}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <img
                            src="/placeholder.svg?height=144&width=144"
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between text-right">
                        <div className="space-y-3">
                          {/* Badges */}
                          <div className="flex flex-wrap gap-2 mb-2 justify-end">
                            {item.category && (
                              <Badge
                                variant="secondary"
                                className="text-xs px-3 py-1 rounded-full font-medium"
                              >
                                {item.category}
                              </Badge>
                            )}
                            {item.sorting && (
                              <Badge
                                variant="outline"
                                className="text-xs px-3 py-1 rounded-full border-blue-500/40 text-blue-600 bg-blue-500/10 font-medium"
                              >
                                {item.sorting}
                              </Badge>
                            )}
                          </div>

                          {/* Title */}
                          <div className="text-right">
                            <Link
                              href={`/community/topic/${item.id}`}
                              className="inline-block text-xl font-bold hover:text-primary transition-colors line-clamp-2 group-hover:text-primary"
                            >
                              {item.title}
                            </Link>
                          </div>

                          {/* Excerpt */}
                          {(item.excerpt || item.content) && (
                            <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed text-right">
                              {item.excerpt ||
                                (item.content.length > 150
                                  ? item.content.slice(0, 150) + "..."
                                  : item.content)}
                            </p>
                          )}
                        </div>

                        {/* Author and stats */}
                        <div className="flex flex-wrap items-center justify-between gap-y-3 text-sm text-muted-foreground pt-4 border-t border-muted/30 mt-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Avatar className="w-6 h-6 sm:w-7 sm:h-7 ring-2 ring-primary/10">
                              <AvatarImage
                                src={
                                  item.user_profiles?.avatar_url ||
                                  item.author_avatar ||
                                  "/placeholder.svg"
                                }
                                alt={
                                  item.user_profiles?.username ||
                                  item.author_name ||
                                  "مستخدم"
                                }
                              />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                                {(
                                  item.user_profiles?.username ||
                                  item.author_name ||
                                  "م"
                                ).charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-xs sm:text-sm">
                              {item.user_profiles?.username ||
                                item.author_name ||
                                "مستخدم"}
                            </span>
                            <span className="text-muted-foreground/50">&bull;</span>
                            <span className="text-xs sm:text-sm">
                              {formatArabicDate(item.created_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-4">
                            <span className="flex items-center gap-1 sm:gap-1.5 bg-gray-50 dark:bg-muted/30 px-1.5 sm:px-2 py-1 rounded-full text-xs sm:text-sm">
                              <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground/70" />
                              {item.views || 0}
                            </span>
                            <span className="flex items-center gap-1 sm:gap-1.5 bg-gray-50 dark:bg-muted/30 px-1.5 sm:px-2 py-1 rounded-full text-xs sm:text-sm">
                              <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground/70" />
                              {item.likes || 0}
                            </span>
                            <span className="flex items-center gap-1 sm:gap-1.5 bg-gray-50 dark:bg-muted/30 px-1.5 sm:px-2 py-1 rounded-full text-xs sm:text-sm">
                              <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground/70" />
                              {item.comments_count || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="px-3 sm:px-4 py-3 border-t border-muted/30 bg-muted/5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-3 sm:px-4 py-2 rounded-full bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary-foreground hover:bg-primary transition-all duration-200 text-sm font-medium"
                      asChild
                    >
                      <Link href={`/community/topic/${item.id}`}>
                        عرض الموضوع بالكامل
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

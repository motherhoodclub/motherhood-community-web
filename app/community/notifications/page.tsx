"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Calendar, MessageSquare, AlertCircle, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function NotificationsPage() {
  const [user, setUser] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState("all") // all, topics, workshops
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error("Error fetching user:", error)
      }
    }
    getUser()
  }, [supabase])

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return

      setIsLoading(true)
      try {
        // Fetch topics (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: topicNotifications, error: topicError } = await supabase
          .from("topics")
          .select("id, title, created_at, user_id, category, featured_image_url")
          .gte("created_at", thirtyDaysAgo.toISOString())
          .order("created_at", { ascending: false })
          .limit(50)

        // Fetch workshops (upcoming and recent)
        const { data: workshopNotifications, error: workshopError } = await supabase
          .from("workshops")
          .select("id, title, date, time, description, image_url")
          .order("date", { ascending: true })
          .limit(20)

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
            .limit(20)

          if (!commentsError && comments && comments.length > 0) {
            // Get topic titles
            const { data: topics } = await supabase
              .from("topics")
              .select("id, title, category, featured_image_url")
              .in(
                "id",
                comments.map((c) => c.topic_id),
              )

            const topicMap = {}
            if (topics) {
              topics.forEach((topic) => {
                topicMap[topic.id] = {
                  title: topic.title,
                  category: topic.category,
                  featured_image_url: topic.featured_image_url,
                }
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
              const topicInfo = topicMap[comment.topic_id] || { title: "موضوع", category: "", featured_image_url: null }

              return {
                id: `comment-${comment.id}`,
                title: `تعليق جديد من ${username}`,
                content: comment.content,
                type: "comment",
                entityId: comment.topic_id,
                commentId: comment.id,
                date: new Date(comment.created_at),
                category: topicInfo.title,
                imageUrl: userMap[comment.user_id]?.avatar_url,
                topicImageUrl: topicInfo.featured_image_url,
                isNew: new Date(comment.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000),
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

        // Fetch all questions where the user is the author
        const { data: userQuestions } = await supabase.from("questions").select("id").eq("user_id", user.id)

        const userQuestionIds = userQuestions ? userQuestions.map((q) => q.id) : []

        // Fetch replies to the user's questions or all question replies for admins
        const questionRepliesQuery = supabase
          .from("question_replies")
          .select(`
            id, 
            content, 
            created_at, 
            question_id,
            user_id
          `)
          .order("created_at", { ascending: false })
          .limit(20)

        // If user is not an admin, only show replies to their questions
        if (!isAdmin && userQuestionIds.length > 0) {
          questionRepliesQuery.in("question_id", userQuestionIds)
        }

        const { data: questionReplies, error: questionRepliesError } = await questionRepliesQuery

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
            .select("id, username, avatar_url")
            .in(
              "id",
              questionReplies.map((r) => r.user_id),
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

          questionReplyNotifications = questionReplies.map((reply) => {
            const username = userMap[reply.user_id]?.username || "مستخدم"
            const questionTitle = questionMap[reply.question_id] || "سؤال"

            return {
              id: `question-reply-${reply.id}`,
              title: `رد جديد من ${username}`,
              content: reply.content,
              type: "question-reply",
              entityId: reply.question_id,
              replyId: reply.id,
              date: new Date(reply.created_at),
              category: questionTitle,
              imageUrl: userMap[reply.user_id]?.avatar_url,
              isNew: new Date(reply.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000),
            }
          })
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
            category: topic.category,
            imageUrl: topic.featured_image_url,
            isNew: new Date(topic.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000),
          })),
          ...(workshopNotifications || []).map((workshop) => ({
            id: `workshop-${workshop.id}`,
            title: workshop.title,
            type: "workshop",
            entityId: workshop.id,
            date: new Date(workshop.date),
            time: workshop.time,
            description: workshop.description,
            imageUrl: workshop.image_url,
            isNew:
              new Date(workshop.date) > new Date() &&
              new Date(workshop.date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          })),
          ...commentNotifications,
          ...questionReplyNotifications,
        ].sort((a, b) => b.date - a.date)

        setNotifications(combinedNotifications)
      } catch (error) {
        console.error("Error fetching notifications:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchNotifications()
    }
  }, [user, supabase])

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "all") return true
    return notification.type === filter
  })

  const formatDate = (date) => {
    const now = new Date()
    const diff = now - date
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return "اليوم"
    } else if (diffDays === 1) {
      return "الأمس"
    } else if (diffDays < 7) {
      return `منذ ${diffDays} أيام`
    } else {
      return date.toLocaleDateString("ar-SA-u-ca-gregory")
    }
  }

  return (
    <div className="container max-w-4xl py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">الإشعارات</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              <span>تصفية</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setFilter("all")}>جميع الإشعارات</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter("topic")}>المواضيع الجديدة</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter("workshop")}>ورش العمل</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter("comment")}>التعليقات على مواضيعي</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter("question-reply")}>الردود على الأسئلة</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs defaultValue="all" className="mb-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" onClick={() => setFilter("all")}>
            الكل
          </TabsTrigger>
          <TabsTrigger value="topics" onClick={() => setFilter("topic")}>
            المواضيع
          </TabsTrigger>
          <TabsTrigger value="workshops" onClick={() => setFilter("workshop")}>
            ورش العمل
          </TabsTrigger>
          <TabsTrigger value="comments" onClick={() => setFilter("comment")}>
            التعليقات
          </TabsTrigger>
          <TabsTrigger value="replies" onClick={() => setFilter("question-reply")}>
            الردود
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-start p-4 gap-4">
                  <Skeleton className="h-12 w-12 rounded-md flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredNotifications.length > 0 ? (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={cn(
                "overflow-hidden transition-all duration-200",
                notification.isNew ? "border-primary/30 shadow-md" : "",
              )}
            >
              <CardContent className="p-0">
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
                  className="flex items-start p-4 gap-4 hover:bg-muted/50 transition-colors duration-200"
                >
                  <div className="relative h-12 w-12 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                    {notification.imageUrl ? (
                      <img
                        src={
                          notification.imageUrl.startsWith("http")
                            ? notification.imageUrl
                            : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${notification.imageUrl}`
                        }
                        alt={notification.title}
                        className="h-full w-full object-cover"
                      />
                    ) : notification.type === "topic" ? (
                      <MessageSquare className="h-6 w-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
                    ) : notification.type === "workshop" ? (
                      <Calendar className="h-6 w-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
                    ) : notification.type === "comment" ? (
                      <MessageSquare className="h-6 w-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-500" />
                    ) : (
                      <AlertCircle className="h-6 w-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium line-clamp-1">{notification.title}</h3>
                      {notification.isNew && (
                        <Badge variant="default" className="ml-2 text-xs">
                          جديد
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span className="ml-2">
                        {notification.type === "topic"
                          ? "موضوع جديد"
                          : notification.type === "workshop"
                            ? "ورشة عمل"
                            : notification.type === "comment"
                              ? "تعليق جديد"
                              : notification.type === "question-reply"
                                ? "رد على سؤال"
                                : "إشعار"}
                      </span>
                      {notification.category && (
                        <>
                          <span className="mx-1">•</span>
                          <span>{notification.category}</span>
                        </>
                      )}
                      <span className="mx-1">•</span>
                      <span>{formatDate(notification.date)}</span>
                      {notification.time && (
                        <>
                          <span className="mx-1">•</span>
                          <span>{notification.time}</span>
                        </>
                      )}
                    </div>
                    {(notification.content || notification.description) && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {notification.content || notification.description}
                      </p>
                    )}
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">لا توجد إشعارات</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {filter === "all"
                ? "لا توجد إشعارات جديدة في الوقت الحالي. تحقق مرة أخرى لاحقًا."
                : filter === "topic"
                  ? "لا توجد مواضيع جديدة في الوقت الحالي."
                  : filter === "workshop"
                    ? "لا توجد ورش عمل جديدة في الوقت الحالي."
                    : filter === "comment"
                      ? "لا توجد تعليقات جديدة على مواضيعك في الوقت الحالي."
                      : "لا توجد ردود جديدة على الأسئلة في الوقت الحالي."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

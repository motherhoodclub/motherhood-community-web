"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, MessageCircle, Reply, MoreVertical, RefreshCw, Trash2, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ShareButton } from "@/components/share-button"
import Link from "next/link"
import { formatArabicDateTime } from "@/lib/date-utils"

interface Comment {
  id: number
  content: string
  user_id: string
  topic_id: string
  parent_id: number | null
  created_at: string
  user_profile?: {
    username: string
    avatar_url: string
  }
  replies?: Comment[]
}

interface Topic {
  id: number
  title: string
  content: string
  category: string
  created_at: string
  updated_at: string
  views: number
  featured_image_url?: string | null
  media_urls?: string[]
  user_id: string
  sorting?: string
  is_hot?: boolean
  is_sticky?: boolean
  loom_embed_code?: string
  age_group?: string | null
  user_profile?: {
    username: string
    avatar_url: string
  }
}

export default function TopicPage({ params }: { params: { id: string } }) {
  const [topic, setTopic] = useState<Topic | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [imageError, setImageError] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  // Add these new state variables after the existing state declarations
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editCommentContent, setEditCommentContent] = useState("")

  // Force refresh on mount
  useEffect(() => {
    // Add a random parameter to force cache invalidation
    const cacheBuster = new Date().getTime()
    window.history.replaceState(null, "", `${window.location.pathname}?t=${cacheBuster}`)

    fetchTopic()
    fetchComments()
    getCurrentUser()
  }, [refreshKey])

  const refreshData = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const handleDeleteTopic = async () => {
    if (!isAdmin) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك صلاحيات لحذف هذا الموضوع",
        variant: "destructive",
      })
      return
    }

    setIsDeleting(true)
    try {
      // Verify admin status from the database
      const { data: authData } = await supabase.auth.getSession()
      if (!authData.session) {
        throw new Error("جلسة المستخدم غير صالحة")
      }

      const { data: adminCheck, error: adminCheckError } = await supabase
        .from("user_profiles")
        .select("is_admin")
        .eq("id", authData.session.user.id)
        .single()

      if (adminCheckError || !adminCheck || !adminCheck.is_admin) {
        throw new Error("ليس لديك صلاحيات كافية لحذف هذا الموضوع")
      }

      // Delete all comments associated with this topic first
      const { error: commentsError } = await supabase
        .from("comments")
        .delete()
        .eq("topic_id", params.id)

      if (commentsError) {
        console.error("Error deleting comments:", commentsError)
      }

      // Delete the topic
      const { error } = await supabase
        .from("topics")
        .delete()
        .eq("id", params.id)

      if (error) throw error

      toast({
        title: "تم الحذف",
        description: "تم حذف الموضوع بنجاح",
      })

      // Redirect to community page
      router.push("/community")
    } catch (error: any) {
      console.error("Error deleting topic:", error)
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف الموضوع",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()
      setCurrentUser(data)
      setIsAdmin(data?.is_admin === true || data?.is_admin === "true")
    }
  }

  const fetchTopic = async () => {
    setIsLoading(true)
    try {
      // Add a cache-busting parameter to avoid getting cached results
      const timestamp = new Date().getTime()
      const { data: topicData, error: topicError } = await supabase
        .from("topics")
        .select("*, age_group")
        .eq("id", params.id)
        .single()

      if (topicError) throw topicError

      console.log("Fetched topic data:", topicData)

      // Fetch user profile for the topic author
      const { data: userData, error: userError } = await supabase
        .from("user_profiles")
        .select("username, avatar_url")
        .eq("id", topicData.user_id)
        .single()

      if (userError) throw userError

      setTopic({ ...topicData, user_profile: userData })
      setImageError(false) // Reset image error state on new data

      // Increment view count
      const { error: updateError } = await supabase
        .from("topics")
        .update({ views: (topicData.views || 0) + 1 })
        .eq("id", params.id)

      if (updateError) console.error("Error updating view count:", updateError)
    } catch (error) {
      console.error("Error fetching topic:", error)
      toast({
        title: "Error",
        description: "Failed to fetch topic",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select("*")
        .eq("topic_id", params.id)
        .order("created_at", { ascending: true })

      if (commentsError) throw commentsError

      // Fetch user profiles for all comment authors
      const userIds = [...new Set(commentsData.map((comment) => comment.user_id))]
      const { data: userProfiles, error: userProfilesError } = await supabase
        .from("user_profiles")
        .select("id, username, avatar_url")
        .in("id", userIds)

      if (userProfilesError) throw userProfilesError

      const userProfileMap = Object.fromEntries(userProfiles.map((profile) => [profile.id, profile]))

      // Organize comments into threads
      const rootComments: Comment[] = []
      const commentMap = new Map<number, Comment>()

      // First pass: create all comment objects with user profiles
      commentsData.forEach((comment) => {
        const commentWithProfile = {
          ...comment,
          user_profile: userProfileMap[comment.user_id],
          replies: [],
        }
        commentMap.set(comment.id, commentWithProfile)
      })

      // Second pass: organize into parent-child relationships
      commentsData.forEach((comment) => {
        const commentWithProfile = commentMap.get(comment.id)!

        if (comment.parent_id === null) {
          // This is a root comment
          rootComments.push(commentWithProfile)
        } else {
          // This is a reply
          const parentComment = commentMap.get(comment.parent_id)
          if (parentComment) {
            parentComment.replies!.push(commentWithProfile)
          } else {
            // Fallback if parent doesn't exist for some reason
            rootComments.push(commentWithProfile)
          }
        }
      })

      setComments(rootComments)
    } catch (error) {
      console.error("Error fetching comments:", error)
      toast({
        title: "Error",
        description: "Failed to fetch comments",
        variant: "destructive",
      })
    }
  }

  // Add these new functions before the handleImageError function

  const handleEditComment = async (commentId: number, content: string) => {
    setEditingCommentId(commentId)
    setEditCommentContent(content)
  }

  const handleSaveEditedComment = async (commentId: number) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "يجب تسجيل الدخول لتعديل التعليق",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from("comments")
        .update({ content: editCommentContent })
        .eq("id", commentId)
        .eq("user_id", currentUser.id)

      if (error) throw error

      setEditingCommentId(null)
      setEditCommentContent("")
      fetchComments() // Refresh comments after editing
      toast({
        title: "Success",
        description: "تم تعديل التعليق بنجاح",
      })
    } catch (error) {
      console.error("Error editing comment:", error)
      toast({
        title: "Error",
        description: "فشل في تعديل التعليق",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "يجب تسجيل الدخول لحذف التعليق",
        variant: "destructive",
      })
      return
    }

    if (!confirm("هل أنت متأكد من حذف هذا التعليق؟")) {
      return
    }

    try {
      // First check if this comment has replies
      const { data: replies, error: repliesError } = await supabase
        .from("comments")
        .select("id")
        .eq("parent_id", commentId)

      if (repliesError) throw repliesError

      // If there are replies, delete them first
      if (replies && replies.length > 0) {
        const replyIds = replies.map((reply) => reply.id)
        const { error: deleteRepliesError } = await supabase.from("comments").delete().in("id", replyIds)

        if (deleteRepliesError) throw deleteRepliesError
      }

      // Now delete the comment itself - fixed to not reference is_admin column in comments table
      let deleteQuery = supabase.from("comments").delete().eq("id", commentId)

      // If user is not an admin, restrict to only their own comments
      if (!isAdmin) {
        deleteQuery = deleteQuery.eq("user_id", currentUser.id)
      }

      const { error } = await deleteQuery

      if (error) throw error

      fetchComments() // Refresh comments after deletion
      toast({
        title: "Success",
        description: "تم حذف التعليق بنجاح",
      })
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast({
        title: "Error",
        description: "فشل في حذف التعليق",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser) {
      toast({
        title: "Error",
        description: "يجب تسجيل الدخول لإضافة تعليق",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from("comments").insert({
        content: newComment,
        user_id: currentUser.id,
        topic_id: params.id,
      })

      if (error) throw error

      setNewComment("")
      fetchComments() // Refresh comments after adding a new comment
      toast({
        title: "Success",
        description: "تم إضافة التعليق بنجاح",
      })

      // Send notification to the topic author
      if (topic?.user_id && topic.user_id !== currentUser.id) {
        try {
          const formData = new FormData()
          formData.append("comment", newComment)
          formData.append("postId", params.id)
          formData.append("authorId", topic.user_id)
          formData.append("authorEmail", topic.user_profile?.email) // Assuming author's email is available here
          formData.append("postTitle", topic.title)

          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/new-comment`, {
            method: "POST",
            body: formData,
          })
        } catch (error) {
          console.error("Error sending comment notification:", error)
        }
      }
    } catch (error) {
      console.error("Error adding comment:", error)
      toast({
        title: "Error",
        description: "فشل في إضافة التعليق",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentCommentId: number) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "يجب تسجيل الدخول لإضافة رد",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from("comments").insert({
        content: replyContent,
        user_id: currentUser.id,
        topic_id: params.id,
        parent_id: parentCommentId,
      })

      if (error) throw error

      setReplyContent("")
      setReplyingTo(null)
      fetchComments() // Refresh comments after adding a new reply
      toast({
        title: "Success",
        description: "تم إضافة الرد بنجاح",
      })
    } catch (error) {
      console.error("Error adding reply:", error)
      toast({
        title: "Error",
        description: "فشل في إضافة الرد",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageError = () => {
    setImageError(true)
  }

  const renderMediaContent = (mediaUrl: string) => {
    const fileExtension = mediaUrl.split(".").pop()?.toLowerCase()
    const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(fileExtension || "")
    const isVideo = ["mp4", "webm", "ogg"].includes(fileExtension || "")

    if (isImage) {
      return (
        <div className="relative">
          <img
            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${mediaUrl}?t=${new Date().getTime()}`}
            alt="Topic media"
            className="max-w-full h-auto mb-4 rounded-lg"
            onError={handleImageError}
          />
        </div>
      )
    } else if (isVideo) {
      return (
        <video
          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${mediaUrl}?t=${new Date().getTime()}`}
          controls
          className="max-w-full h-auto mb-4 rounded-lg"
        >
          Your browser does not support the video tag.
        </video>
      )
    } else {
      return <p>Unsupported media type: {mediaUrl}</p>
    }
  }

  const renderLoomEmbed = (embedCode: string) => {
    if (!embedCode) return null

    // Parse the embed code to modify it
    let modifiedEmbedCode = embedCode

    // If it's an iframe (which Loom embeds typically are)
    if (embedCode.includes("<iframe")) {
      // Add sandbox attribute to restrict functionality while allowing necessary features
      modifiedEmbedCode = embedCode.replace(
        "<iframe",
        '<iframe sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"',
      )

      // Add parameters to the src URL to disable sharing options if possible
      modifiedEmbedCode = modifiedEmbedCode.replace(/src="([^"]+)"/, (match, src) => {
        // Add hide_share=true parameter if it's a Loom URL
        const updatedSrc = src.includes("?")
          ? `${src}&hide_share=true&hide_owner=true&hideEmbedTopBar=true`
          : `${src}?hide_share=true&hide_owner=true&hideEmbedTopBar=true`
        return `src="${updatedSrc}"`
      })
    }

    // Create a wrapper with event listeners to prevent right-click and other ways to access the video
    return (
      <div
        className="mt-4 mb-4 sm:mt-6 sm:mb-6 w-full aspect-video"
        onContextMenu={(e) => e.preventDefault()} // Prevent right-click
      >
        <div
          className="rounded-lg overflow-hidden relative"
          dangerouslySetInnerHTML={{ __html: modifiedEmbedCode }}
          style={{ pointerEvents: "auto" }} // Allow interaction with the video player
        />
        {/* Invisible overlay to prevent certain interactions while allowing video playback */}
        <style jsx global>{`
          .loom-embed-wrapper {
            position: relative;
          }
          .loom-embed-wrapper iframe {
            position: relative;
            z-index: 1;
          }
          /* Disable selection of text within the embed */
          .loom-embed-wrapper ::selection {
            background: transparent;
          }
        `}</style>
      </div>
    )
  }

  const renderComment = (comment: Comment, depth = 0) => {
    return (
      <div
        key={comment.id}
        className={`mb-4 ${depth > 0 ? "mr-3 sm:mr-8 border-r-2 border-gray-200 pr-2 sm:pr-4" : ""}`}
      >
        <Card className={depth > 0 ? "bg-gray-50" : ""}>
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-4">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                  <AvatarImage src={comment.user_profile?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>{comment.user_profile?.username?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{comment.user_profile?.username}</div>
                  <div className="text-sm text-muted-foreground">{formatArabicDateTime(comment.created_at)}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                {currentUser && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Reply className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                    <span className="hidden xs:inline-block">رد</span>
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {currentUser && currentUser.id === comment.user_id && (
                      <DropdownMenuItem onClick={() => handleEditComment(comment.id, comment.content)}>
                        تعديل التعليق
                      </DropdownMenuItem>
                    )}
                    {currentUser && (currentUser.id === comment.user_id || isAdmin) && (
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteComment(comment.id)}>
                        حذف التعليق
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {editingCommentId === comment.id ? (
              <div>
                <Textarea
                  value={editCommentContent}
                  onChange={(e) => setEditCommentContent(e.target.value)}
                  className="mb-2"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingCommentId(null)
                      setEditCommentContent("")
                    }}
                  >
                    إلغاء
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSaveEditedComment(comment.id)}
                    disabled={isSubmitting || !editCommentContent.trim()}
                  >
                    {isSubmitting ? "جاري الحفظ..." : "حفظ التعديل"}
                  </Button>
                </div>
              </div>
            ) : (
              <p>{comment.content}</p>
            )}

            {/* Reply form */}
            {replyingTo === comment.id && (
              <div className="mt-3 bg-gray-50 p-2 sm:p-3 rounded-md">
                <div className="text-sm font-medium mb-2">الرد على {comment.user_profile?.username}</div>
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="اكتب ردك هنا..."
                  className="mb-2"
                />
                <div className="flex justify-end gap-1 sm:gap-2">
                  <Button variant="outline" size="sm" onClick={() => setReplyingTo(null)}>
                    إلغاء
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={isSubmitting || !replyContent.trim()}
                  >
                    {isSubmitting ? "جاري الإرسال..." : "إرسال الرد"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">{comment.replies.map((reply) => renderComment(reply, depth + 1))}</div>
        )}
      </div>
    )
  }

  if (isLoading) return <div>جاري التحميل...</div>
  if (!topic) return <div>لم يتم العثور على الموضوع</div>

  return (
    <div className="container px-4 sm:px-6 py-6 sm:py-8 animate-fadeIn">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
            <div>
              <CardTitle className="text-xl sm:text-2xl break-words">{topic.title}</CardTitle>
              <CardDescription>
                {formatArabicDateTime(topic.created_at)} • بواسطة {topic.user_profile?.username}
                {topic.age_group && (
                  <>
                    <br />
                    <span className="text-sm text-muted-foreground">الفئة العمرية: {topic.age_group}</span>
                  </>
                )}
              </CardDescription>
              {topic.sorting && (
                <Badge variant="outline" className="mt-2">
                  {topic.sorting}
                </Badge>
              )}
              {topic.is_hot && (
                <Badge variant="secondary" className="mt-2 mr-2 bg-red-100 text-red-800">
                  ساخن
                </Badge>
              )}
              {topic.is_sticky && (
                <Badge variant="secondary" className="mt-2 mr-2 bg-blue-100 text-blue-800">
                  مثبت
                </Badge>
              )}
            </div>
            <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 mt-2 sm:mt-0">
              <Badge>{topic.category}</Badge>
              {isAdmin && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/community/edit-topic/${topic.id}`}>تعديل</Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={isDeleting}>
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 ml-1" />
                            حذف
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد حذف الموضوع</AlertDialogTitle>
                        <AlertDialogDescription>
                          هل أنت متأكد من حذف هذا الموضوع؟ سيتم حذف جميع التعليقات المرتبطة به. هذا الإجراء لا يمكن التراجع عنه.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteTopic}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          حذف الموضوع
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={refreshData} title="تحديث البيانات">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Featured Image */}
          {topic.featured_image_url && !imageError && (
            <div className="mb-6">
              <img
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${topic.featured_image_url}?t=${new Date().getTime()}`}
                alt={topic.title}
                className="w-full max-h-[300px] sm:max-h-[500px] object-contain rounded-lg mx-auto"
                onError={handleImageError}
              />
            </div>
          )}

          <p className="text-base sm:text-lg mb-4 break-words">{topic.content}</p>

          {/* Loom Video Embed */}
          {topic.loom_embed_code && renderLoomEmbed(topic.loom_embed_code)}

          {/* Media Content */}
          {topic.media_urls && topic.media_urls.length > 0 && (
            <div className="mt-6 space-y-4">
              {topic.media_urls.map((mediaUrl, index) => (
                <div key={index} className="mb-4">
                  {renderMediaContent(mediaUrl)}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-3">
            <span className="flex items-center">
              <Eye className="mr-1 h-4 w-4" />
              {topic.views} مشاهدة
            </span>
            <span className="flex items-center">
              <MessageCircle className="mr-1 h-4 w-4" />
              {comments.reduce((total, comment) => total + 1 + (comment.replies?.length || 0), 0)} تعليق
            </span>
            <ShareButton title={topic.title} variant="ghost" size="sm" />
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <div className="mt-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
          التعليقات ({comments.reduce((total, comment) => total + 1 + (comment.replies?.length || 0), 0)})
        </h2>

        {/* Comment Form */}
        {currentUser && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmitComment}>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="اكتب تعليقك هنا..."
                  className="mb-4"
                />
                <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
                  {isSubmitting ? "جاري الإرسال..." : "إضافة تعليق"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length > 0 ? (
            comments.map((comment) => renderComment(comment))
          ) : (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                لا توجد تعليقات بعد. كن أول من يعلق!
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

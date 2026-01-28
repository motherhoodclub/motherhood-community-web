"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"

// UI Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Icons
import { ArrowLeft, Heart, MessageCircle, Eye, Clock, MoreVertical, Reply, Trash, Edit } from "lucide-react"

import { ShareButton } from "@/components/share-button"

export default function QuestionDetailPage({ params }) {
  const { id } = params
  const [question, setQuestion] = useState(null)
  const [replies, setReplies] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [replyContent, setReplyContent] = useState("")
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [isLiked, setIsLiked] = useState(false)
  const [editingReply, setEditingReply] = useState(null)
  const [editContent, setEditContent] = useState("")
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [replyToDelete, setReplyToDelete] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const replyInputRef = useRef(null)
  const replyToCommentRef = useRef(null)

  useEffect(() => {
    fetchQuestion()
    fetchReplies()
    fetchCurrentUser()
    incrementViewCount()

    // Check if the question is liked from localStorage
    const savedLikes = localStorage.getItem("likedTopics")
    if (savedLikes) {
      const likedTopics = JSON.parse(savedLikes)
      setIsLiked(likedTopics[id] || false)
    }
  }, [id])

  useEffect(() => {
    if (replyInputRef.current) {
      replyInputRef.current.focus()
    }
  }, [])

  useEffect(() => {
    if (replyingTo && replyToCommentRef.current) {
      replyToCommentRef.current.focus()
    }
  }, [replyingTo])

  const fetchQuestion = async () => {
    try {
      const { data, error } = await supabase.from("questions").select("*").eq("id", id).single()

      if (error) throw error
      setQuestion(data)
    } catch (error) {
      console.error("Error fetching question:", error)
      toast({
        title: "خطأ",
        description: "فشل في جلب السؤال",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchReplies = async () => {
    try {
      // First, fetch all replies for this question
      const { data: repliesData, error: repliesError } = await supabase
        .from("question_replies")
        .select("*")
        .eq("question_id", id)
        .order("created_at", { ascending: true })

      if (repliesError) throw repliesError

      if (repliesData && repliesData.length > 0) {
        // Create a set of unique user IDs from the replies
        const userIds = [...new Set(repliesData.map((reply) => reply.user_id))]

        // Fetch user profiles for these IDs
        const { data: profilesData, error: profilesError } = await supabase
          .from("user_profiles")
          .select("id, username, avatar_url")
          .in("id", userIds)

        if (profilesError) throw profilesError

        // Create a map of user IDs to profiles for quick lookup
        const profilesMap = {}
        profilesData?.forEach((profile) => {
          profilesMap[profile.id] = profile
        })

        // Combine the replies with their user profiles
        const repliesWithProfiles = repliesData.map((reply) => ({
          ...reply,
          user_profile: profilesMap[reply.user_id] || null,
        }))

        setReplies(repliesWithProfiles)
      } else {
        setReplies([])
      }
    } catch (error) {
      console.error("Error fetching replies:", error)
      toast({
        title: "خطأ",
        description: "فشل في جلب الردود",
        variant: "destructive",
      })
    }
  }

  const fetchCurrentUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data, error } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()

        if (error) throw error
        setCurrentUser(data)

        // Check if user is admin
        if (data.is_admin) {
          setIsAdmin(true)
        }
      }
    } catch (error) {
      console.error("Error fetching current user:", error)
    }
  }

  const incrementViewCount = async () => {
    try {
      // Check if the user has already viewed this question
      const viewedQuestions = JSON.parse(localStorage.getItem("viewedQuestions") || "[]")
      if (!viewedQuestions.includes(id)) {
        // Update view count in the database
        const { error } = await supabase
          .from("questions")
          .update({ views: (question?.views || 0) + 1 })
          .eq("id", id)

        if (error) throw error

        // Add this question to the viewed questions in localStorage
        viewedQuestions.push(id)
        localStorage.setItem("viewedQuestions", JSON.stringify(viewedQuestions))
      }
    } catch (error) {
      console.error("Error incrementing view count:", error)
    }
  }

  const handleLike = async () => {
    if (!currentUser) {
      toast({
        title: "تنبيه",
        description: "يجب تسجيل الدخول للإعجاب بالسؤال",
        variant: "default",
      })
      return
    }

    try {
      // Update the likes count in the database
      const newLikesCount = isLiked ? (question.likes || 1) - 1 : (question.likes || 0) + 1
      const { error } = await supabase.from("questions").update({ likes: newLikesCount }).eq("id", id)

      if (error) throw error

      // Update the question state
      setQuestion({ ...question, likes: newLikesCount })

      // Update the isLiked state
      setIsLiked(!isLiked)

      // Update localStorage
      const savedLikes = JSON.parse(localStorage.getItem("likedTopics") || "{}")
      savedLikes[id] = !isLiked
      localStorage.setItem("likedTopics", JSON.stringify(savedLikes))

      toast({
        title: isLiked ? "تم إلغاء الإعجاب" : "تم الإعجاب",
        description: isLiked ? "تم إلغاء إعجابك بهذا السؤال" : "تم تسجيل إعجابك بهذا السؤال",
        variant: "default",
      })
    } catch (error) {
      console.error("Error updating likes:", error)
      toast({
        title: "خطأ",
        description: "فشل في تحديث الإعجابات",
        variant: "destructive",
      })
    }
  }

  const handleReplyClick = (replyId, username, userId) => {
    setReplyingTo({ id: replyId, username, userId })
    setReplyContent("")
  }

  const handleCancelReply = () => {
    setReplyingTo(null)
    setReplyContent("")
  }

  const handleSubmitReply = async (e) => {
    e.preventDefault()

    if (!currentUser) {
      toast({
        title: "تنبيه",
        description: "يجب تسجيل الدخول للرد",
        variant: "default",
      })
      return
    }

    if (!replyContent.trim()) {
      toast({
        title: "تنبيه",
        description: "لا يمكن إرسال رد فارغ",
        variant: "default",
      })
      return
    }

    setIsSubmittingReply(true)

    try {
      // Insert the reply
      const { data, error } = await supabase
        .from("question_replies")
        .insert({
          content: replyContent,
          user_id: currentUser.id,
          question_id: id,
          parent_id: replyingTo ? replyingTo.id : null,
        })
        .select()

      if (error) throw error

      // Update the comments count in the question
      await supabase
        .from("questions")
        .update({ comments_count: (question.comments_count || 0) + 1 })
        .eq("id", id)

      // Update the question state
      setQuestion({ ...question, comments_count: (question.comments_count || 0) + 1 })

      // Add the new reply to the replies state
      const newReply = {
        ...data[0],
        user_profile: {
          id: currentUser.id,
          username: currentUser.username,
          avatar_url: currentUser.avatar_url,
        },
      }
      setReplies([...replies, newReply])

      // Clear the reply input and reset replyingTo
      setReplyContent("")
      setReplyingTo(null)

      toast({
        title: "تم الرد",
        description: "تم إضافة ردك بنجاح",
        variant: "default",
      })

      // Send notification to the question author
      if (question?.user_id && question.user_id !== currentUser.id) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/new-comment`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contentType: "question",
              contentId: params.id,
              title: question.title,
              authorId: question.user_id,
              commenterId: currentUser.id,
            }),
          })
        } catch (error) {
          console.error("Error sending reply notification:", error)
        }
      }

      // If replying to someone else's reply, notify that person too
      if (replyingTo && replyingTo.userId && replyingTo.userId !== currentUser.id) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/new-comment`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contentType: "question-reply",
              contentId: params.id,
              title: `رد على تعليقك في سؤال "${question.title}"`,
              authorId: replyingTo.userId,
              commenterId: currentUser.id,
            }),
          })
        } catch (error) {
          console.error("Error sending reply notification:", error)
        }
      }

      // Notify all admins about new question replies
      try {
        const { data: admins } = await supabase.from("user_profiles").select("id").eq("is_admin", true)

        if (admins && admins.length > 0) {
          // Filter out the current user if they're an admin
          const adminIds = admins.filter((admin) => admin.id !== currentUser.id).map((admin) => admin.id)

          for (const adminId of adminIds) {
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/new-comment`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                contentType: "admin-question-reply",
                contentId: params.id,
                title: `رد جديد على سؤال "${question.title}"`,
                authorId: adminId,
                commenterId: currentUser.id,
              }),
            })
          }
        }
      } catch (error) {
        console.error("Error sending admin notifications:", error)
      }
    } catch (error) {
      console.error("Error submitting reply:", error)
      toast({
        title: "خطأ",
        description: "فشل في إضافة الرد",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const handleEditClick = (reply) => {
    setEditingReply(reply.id)
    setEditContent(reply.content)
  }

  const handleCancelEdit = () => {
    setEditingReply(null)
    setEditContent("")
  }

  const handleSubmitEdit = async (e, replyId) => {
    e.preventDefault()

    if (!editContent.trim()) {
      toast({
        title: "تنبيه",
        description: "لا يمكن حفظ رد فارغ",
        variant: "default",
      })
      return
    }

    setIsSubmittingEdit(true)

    try {
      // Update the reply
      const { data, error } = await supabase
        .from("question_replies")
        .update({
          content: editContent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", replyId)
        .select()

      if (error) throw error

      // Update the replies state
      setReplies(
        replies.map((r) =>
          r.id === replyId ? { ...r, content: editContent, updated_at: new Date().toISOString() } : r,
        ),
      )

      // Reset editing state
      setEditingReply(null)
      setEditContent("")

      toast({
        title: "تم التعديل",
        description: "تم تعديل الرد بنجاح",
        variant: "default",
      })
    } catch (error) {
      console.error("Error editing reply:", error)
      toast({
        title: "خطأ",
        description: "فشل في تعديل الرد",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  const handleDeleteClick = (replyId) => {
    setReplyToDelete(replyId)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!replyToDelete) return

    try {
      // Delete the reply
      const { error } = await supabase.from("question_replies").delete().eq("id", replyToDelete)

      if (error) throw error

      // Also delete any replies to this reply
      await supabase.from("question_replies").delete().eq("parent_id", replyToDelete)

      // Count how many replies were deleted (the main reply + any child replies)
      const childRepliesCount = replies.filter((r) => r.parent_id === replyToDelete).length
      const totalDeleted = 1 + childRepliesCount

      // Update the replies state
      setReplies(replies.filter((r) => r.id !== replyToDelete && r.parent_id !== replyToDelete))

      // Update the comments count in the question
      await supabase
        .from("questions")
        .update({ comments_count: Math.max(0, (question.comments_count || 0) - totalDeleted) })
        .eq("id", id)

      // Update the question state
      setQuestion({
        ...question,
        comments_count: Math.max(0, (question.comments_count || 0) - totalDeleted),
      })

      toast({
        title: "تم الحذف",
        description: "تم حذف الرد بنجاح",
        variant: "default",
      })
    } catch (error) {
      console.error("Error deleting reply:", error)
      toast({
        title: "خطأ",
        description: "فشل في حذف الرد",
        variant: "destructive",
      })
    } finally {
      setDeleteConfirmOpen(false)
      setReplyToDelete(null)
    }
  }

  const canEditReply = (reply) => {
    return currentUser && (currentUser.id === reply.user_id || isAdmin)
  }

  // Get replies for a specific comment
  const getChildReplies = (parentId) => {
    return replies.filter((reply) => reply.parent_id === parentId)
  }

  // Get top-level replies (those without a parent)
  const getTopLevelReplies = () => {
    return replies.filter((reply) => !reply.parent_id)
  }

  if (isLoading) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">لم يتم العثور على السؤال</h3>
            <p className="text-muted-foreground mb-6">قد يكون السؤال غير موجود أو تم حذفه</p>
            <Button asChild>
              <Link href="/community">العودة إلى المجتمع</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8" dir="rtl">
      <Button variant="ghost" className="mb-4" asChild>
        <Link href="/community?category=أسئلة">
          <ArrowLeft className="ml-2 h-4 w-4" />
          العودة إلى الأسئلة
        </Link>
      </Button>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <Badge className="mb-2 bg-blue-500/10 text-blue-600 border-none">سؤال</Badge>
              <CardTitle className="text-2xl font-bold">{question.title}</CardTitle>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={question.author_avatar || "/placeholder.svg"} alt={question.author_name || "مستخدم"} />
              <AvatarFallback>{(question.author_name || "م").charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{question.author_name || "مستخدم"}</span>
            <span className="text-muted-foreground/50">•</span>
            <span className="flex items-center">
              <Clock className="ml-1 h-3.5 w-3.5" />
              {new Date(question.created_at).toLocaleDateString("ar-SA-u-ca-gregory")}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-lg max-w-none">
            <p className="whitespace-pre-wrap">{question.content}</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4 text-muted-foreground" />
              {question.views || 0} مشاهدة
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              {question.comments_count || 0} رد
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={`flex items-center gap-1 ${isLiked ? "text-red-500" : ""}`}
              onClick={handleLike}
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
              {isLiked ? "إلغاء الإعجاب" : "إعجاب"}
              {question.likes > 0 && ` (${question.likes})`}
            </Button>
            <ShareButton title={question.title} variant="ghost" size="sm" />
          </div>
        </CardFooter>
      </Card>

      {/* Replies Section */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold">الردود ({replies.length})</h3>

        {replies.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageCircle className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
              <h4 className="text-lg font-semibold mb-2">لا توجد ردود</h4>
              <p className="text-muted-foreground">كن أول من يرد على هذا السؤال</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {getTopLevelReplies().map((reply) => (
              <div key={reply.id} className="space-y-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage
                          src={reply.user_profile?.avatar_url || "/placeholder.svg"}
                          alt={reply.user_profile?.username || "مستخدم"}
                        />
                        <AvatarFallback>{(reply.user_profile?.username || "م").charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{reply.user_profile?.username || "مستخدم"}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(reply.created_at).toLocaleDateString("ar-SA-u-ca-gregory")}
                            </span>
                          </div>
                          <div className="flex items-center">
                            {currentUser && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleReplyClick(reply.id, reply.user_profile?.username, reply.user_id)}
                              >
                                <Reply className="h-4 w-4" />
                                <span className="sr-only">رد</span>
                              </Button>
                            )}
                            {canEditReply(reply) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                    <span className="sr-only">خيارات</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditClick(reply)}>
                                    <Edit className="ml-2 h-4 w-4" />
                                    تعديل الرد
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleDeleteClick(reply.id)}
                                  >
                                    <Trash className="ml-2 h-4 w-4" />
                                    حذف الرد
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>

                        {editingReply === reply.id ? (
                          <form onSubmit={(e) => handleSubmitEdit(e, reply.id)} className="mt-2">
                            <Textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="mb-2 text-right"
                              rows={3}
                            />
                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" size="sm" onClick={handleCancelEdit}>
                                إلغاء
                              </Button>
                              <Button type="submit" size="sm" disabled={isSubmittingEdit}>
                                {isSubmittingEdit ? "جاري الحفظ..." : "حفظ التعديلات"}
                              </Button>
                            </div>
                          </form>
                        ) : (
                          <p className="mt-2 text-sm whitespace-pre-wrap">{reply.content}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Reply form for this comment */}
                {replyingTo && replyingTo.id === reply.id && (
                  <Card className="mr-8 border-r-4 border-r-gray-100">
                    <CardContent className="p-4">
                      <form onSubmit={handleSubmitReply}>
                        <h5 className="text-sm font-medium mb-2">الرد على {replyingTo.username || "مستخدم"}</h5>
                        <Textarea
                          ref={replyToCommentRef}
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="اكتب ردك هنا..."
                          className="mb-3 text-right"
                          rows={2}
                        />
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={handleCancelReply}>
                            إلغاء
                          </Button>
                          <Button type="submit" size="sm" disabled={isSubmittingReply}>
                            {isSubmittingReply ? "جاري الإرسال..." : "إرسال الرد"}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {/* Child replies */}
                {getChildReplies(reply.id).map((childReply) => (
                  <Card key={childReply.id} className="mr-8 border-r-4 border-r-gray-100">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-7 h-7">
                          <AvatarImage
                            src={childReply.user_profile?.avatar_url || "/placeholder.svg"}
                            alt={childReply.user_profile?.username || "مستخدم"}
                          />
                          <AvatarFallback>{(childReply.user_profile?.username || "م").charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{childReply.user_profile?.username || "مستخدم"}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(childReply.created_at).toLocaleDateString("ar-SA-u-ca-gregory")}
                              </span>
                            </div>
                            {canEditReply(childReply) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                    <MoreVertical className="h-3.5 w-3.5" />
                                    <span className="sr-only">خيارات</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditClick(childReply)}>
                                    <Edit className="ml-2 h-4 w-4" />
                                    تعديل الرد
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleDeleteClick(childReply.id)}
                                  >
                                    <Trash className="ml-2 h-4 w-4" />
                                    حذف الرد
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>

                          {editingReply === childReply.id ? (
                            <form onSubmit={(e) => handleSubmitEdit(e, childReply.id)} className="mt-2">
                              <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="mb-2 text-right"
                                rows={2}
                              />
                              <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={handleCancelEdit}>
                                  إلغاء
                                </Button>
                                <Button type="submit" size="sm" disabled={isSubmittingEdit}>
                                  {isSubmittingEdit ? "جاري الحفظ..." : "حفظ التعديلات"}
                                </Button>
                              </div>
                            </form>
                          ) : (
                            <p className="mt-1 text-sm whitespace-pre-wrap">{childReply.content}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Add Reply Form */}
        {!replyingTo && (
          <Card>
            <CardContent className="p-4">
              <form onSubmit={handleSubmitReply}>
                <h4 className="text-lg font-semibold mb-2">إضافة رد</h4>
                <Textarea
                  ref={replyInputRef}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="اكتب ردك هنا..."
                  className="mb-3 text-right"
                  rows={3}
                />
                <Button type="submit" disabled={isSubmittingReply || !currentUser}>
                  {isSubmittingReply ? "جاري الإرسال..." : "إرسال الرد"}
                </Button>
                {!currentUser && (
                  <p className="text-sm text-muted-foreground mt-2">
                    يجب{" "}
                    <Link href="/auth/login" className="text-primary hover:underline">
                      تسجيل الدخول
                    </Link>{" "}
                    للرد
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>هل أنت متأكد من رغبتك في حذف هذا الرد؟ لا يمك التراجع عن هذا الإجراء.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

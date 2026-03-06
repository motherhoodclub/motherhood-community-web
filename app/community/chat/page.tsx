"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Send, Users, MessageCircle, Clock, Mic, Square, Play, Pause, ChevronDown, Trash2, Ban, MoreVertical, ShieldAlert, Pencil, Check, X, ImageIcon, Paperclip, FileText, Download } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { formatArabicDate } from "@/lib/date-utils"

interface Message {
  id: string
  content: string
  audio_url?: string
  image_url?: string
  file_url?: string
  file_name?: string
  user_id: string
  created_at: string
  user_profiles: {
    username: string
    avatar_url: string
    is_admin: boolean
  }
}

interface OnlineUser {
  user_id: string
  username: string
  avatar_url: string
  is_admin: boolean
  last_seen: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [isBanned, setIsBanned] = useState(false)
  const [bannedUsers, setBannedUsers] = useState<string[]>([])
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; messageId: string | null }>({ open: false, messageId: null })
  const [banConfirm, setBanConfirm] = useState<{ open: boolean; userId: string | null; username: string | null }>({ open: false, userId: null, username: null })
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const getScrollContainer = () => {
    return scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement | null
  }

  const scrollToBottom = () => {
    const scrollContainer = getScrollContainer()
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight
    }
  }

  const handleScroll = () => {
    const scrollContainer = getScrollContainer()
    if (scrollContainer) {
      const distanceFromBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight
      setIsAtBottom(distanceFromBottom < 100)
    }
  }

  useEffect(() => {
    const getUser = async () => {
      try {
        setIsAuthLoading(true)
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          setUser(user)

          // Get user profile
          const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()

          setUserProfile(profile)
        }
      } catch (error) {
        console.error("Error fetching user:", error)
      } finally {
        setIsAuthLoading(false)
      }
    }
    getUser()
  }, [supabase])

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("chat_messages")
          .select(`
            id,
            content,
            audio_url,
            image_url,
            file_url,
            file_name,
            user_id,
            created_at,
            user_profiles (
              username,
              avatar_url,
              is_admin
            )
          `)
          .order("created_at", { ascending: false })
          .limit(100)

        if (error) throw error
        const sorted = (data || []).reverse()
        console.log("[Chat] Fetched messages:", sorted.length, "- sample image_url:", sorted.find((m: any) => m.image_url)?.image_url || "none")
        setMessages(sorted)
      } catch (error) {
        console.error("[Chat] Error fetching messages:", error)
        toast({
          title: "خطأ",
          description: "فشل في تحميل الرسائل",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    const fetchOnlineUsers = async () => {
      try {
        const { data, error } = await supabase
          .from("chat_presence")
          .select(`
            user_id,
            user_profiles (
              username,
              avatar_url,
              is_admin
            ),
            last_seen
          `)
          .gte("last_seen", new Date(Date.now() - 5 * 60 * 1000).toISOString())

        if (error) throw error

        const formattedUsers =
          data?.map((item) => ({
            user_id: item.user_id,
            username: item.user_profiles?.username || "مستخدم",
            avatar_url: item.user_profiles?.avatar_url,
            is_admin: item.user_profiles?.is_admin || false,
            last_seen: item.last_seen,
          })) || []

        setOnlineUsers(formattedUsers)
      } catch (error) {
        console.error("Error fetching online users:", error)
      }
    }

    if (user && userProfile) {
      fetchMessages()
      fetchOnlineUsers()

      // Update user presence
      const updatePresence = async () => {
        await supabase.from("chat_presence").upsert({
          user_id: user.id,
          last_seen: new Date().toISOString(),
        })
      }

      updatePresence()
      const presenceInterval = setInterval(updatePresence, 30000) // Update every 30 seconds

      // Set up real-time subscriptions
      const messagesChannel = supabase
        .channel("chat_messages")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
          },
          async (payload) => {
            // Fetch the complete message with user profile
            const { data } = await supabase
              .from("chat_messages")
              .select(`
                id,
                content,
                audio_url,
                image_url,
                file_url,
                file_name,
                user_id,
                created_at,
                user_profiles (
                  username,
                  avatar_url,
                  is_admin
                )
              `)
              .eq("id", payload.new.id)
              .single()

            console.log("[Chat] Realtime INSERT received:", { id: data?.id, image_url: data?.image_url, file_url: data?.file_url })
            if (data) {
              setMessages((prev) => [...prev, data])
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "chat_messages",
          },
          async (payload) => {
            const { data } = await supabase
              .from("chat_messages")
              .select(`
                id,
                content,
                audio_url,
                image_url,
                file_url,
                file_name,
                user_id,
                created_at,
                user_profiles (
                  username,
                  avatar_url,
                  is_admin
                )
              `)
              .eq("id", payload.new.id)
              .single()

            if (data) {
              setMessages((prev) => prev.map((m) => m.id === data.id ? data : m))
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "chat_messages",
          },
          (payload) => {
            setMessages((prev) => prev.filter((m) => m.id !== payload.old.id))
          },
        )
        .subscribe()

      const presenceChannel = supabase
        .channel("chat_presence")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "chat_presence",
          },
          () => {
            fetchOnlineUsers()
          },
        )
        .subscribe()

      return () => {
        clearInterval(presenceInterval)
        messagesChannel.unsubscribe()
        presenceChannel.unsubscribe()
      }
    }
  }, [user, userProfile, supabase, toast])

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom()
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  useEffect(() => {
    if (isAtBottom) {
      const timer = setTimeout(() => {
        scrollToBottom()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [messages, isAtBottom])

  // Attach scroll listener to the radix scroll viewport
  useEffect(() => {
    const scrollContainer = getScrollContainer()
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll)
      return () => scrollContainer.removeEventListener("scroll", handleScroll)
    }
  }, [messages])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "خطأ", description: "حجم الملف يجب أن لا يتجاوز 5 ميجابايت", variant: "destructive" })
      return
    }

    setSelectedFile(file)
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => setFilePreview(e.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setFilePreview(null)
    }
  }

  const clearSelectedFile = () => {
    setSelectedFile(null)
    setFilePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!newMessage.trim() && !selectedFile) || !user || !userProfile || isSending) return

    setIsSending(true)
    try {
      let imageUrl = null
      let fileUrl = null
      let fileName = null

      if (selectedFile) {
        const ext = selectedFile.name.split(".").pop()
        const path = `chat-files/${user.id}-${Date.now()}.${ext}`
        console.log("[Chat] Uploading file:", { name: selectedFile.name, type: selectedFile.type, path })
        const { error: uploadError } = await supabase.storage
          .from("uploads")
          .upload(path, selectedFile, { contentType: selectedFile.type })

        if (uploadError) {
          console.error("[Chat] Upload error:", uploadError)
          throw uploadError
        }

        const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(path)
        console.log("[Chat] Public URL:", urlData.publicUrl)

        if (selectedFile.type.startsWith("image/")) {
          imageUrl = urlData.publicUrl
        } else {
          fileUrl = urlData.publicUrl
          fileName = selectedFile.name
        }
      }

      const insertPayload: any = {
        content: newMessage.trim() || (imageUrl ? "📷 صورة" : "📎 ملف"),
        user_id: user.id,
        image_url: imageUrl || null,
        file_url: fileUrl || null,
        file_name: fileName || null,
      }
      console.log("[Chat] Inserting message:", JSON.stringify(insertPayload))

      const { data: insertedData, error } = await supabase.from("chat_messages").insert(insertPayload).select("id, image_url, file_url, file_name").single()

      if (error) {
        console.error("[Chat] Insert error:", error)
        throw error
      }
      console.log("[Chat] Message saved - DB returned:", JSON.stringify(insertedData))
      setNewMessage("")
      clearSelectedFile()
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "خطأ",
        description: "فشل في إرسال الرسالة",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Check for supported MIME type
      let mimeType = "audio/webm"
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus"
      } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
        mimeType = "audio/ogg;codecs=opus"
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4"
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        stream.getTracks().forEach((track) => track.stop())
        await uploadAndSendVoiceMessage(audioBlob, mimeType)
      }

      // Start with timeslice to capture data every 200ms
      mediaRecorder.start(200)
      setIsRecording(true)
      setRecordingTime(0)

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Error starting recording:", error)
      toast({
        title: "خطأ",
        description: "فشل في الوصول إلى الميكروفون",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
    }
  }

  const uploadAndSendVoiceMessage = async (audioBlob: Blob, mimeType: string) => {
    if (!user || !userProfile) return

    setIsSending(true)
    try {
      // Determine file extension based on MIME type
      let extension = "webm"
      if (mimeType.includes("ogg")) extension = "ogg"
      else if (mimeType.includes("mp4")) extension = "mp4"

      const fileName = `${user.id}-${Date.now()}.${extension}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("voice-messages")
        .upload(fileName, audioBlob, {
          contentType: mimeType,
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from("voice-messages").getPublicUrl(fileName)

      const { error } = await supabase.from("chat_messages").insert({
        content: "🎤 رسالة صوتية",
        audio_url: urlData.publicUrl,
        user_id: user.id,
      })

      if (error) throw error
    } catch (error) {
      console.error("Error sending voice message:", error)
      toast({
        title: "خطأ",
        description: "فشل في إرسال الرسالة الصوتية",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
      setRecordingTime(0)
    }
  }

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const playAudio = (messageId: string, audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.pause()
    }

    if (playingAudioId === messageId) {
      setPlayingAudioId(null)
      return
    }

    const audio = new Audio(audioUrl)
    audioRef.current = audio
    audio.play()
    setPlayingAudioId(messageId)

    audio.onended = () => {
      setPlayingAudioId(null)
    }
  }

  const isAdmin = userProfile?.is_admin === true || userProfile?.is_admin === "true" || userProfile?.is_admin === 1 || userProfile?.is_admin === "1"

  // Check if current user is banned from chat
  useEffect(() => {
    if (!user) return

    const checkBanStatus = async () => {
      const { data } = await supabase
        .from("banned_chat_users")
        .select("id")
        .eq("user_id", user.id)
        .single()
      setIsBanned(!!data)
    }

    checkBanStatus()
  }, [user, supabase])

  // Fetch banned users list (for admins)
  useEffect(() => {
    if (!isAdmin) return

    const fetchBannedUsers = async () => {
      const { data } = await supabase
        .from("banned_chat_users")
        .select("user_id")
      setBannedUsers(data?.map((b) => b.user_id) || [])
    }

    fetchBannedUsers()

    const bannedChannel = supabase
      .channel("banned_chat_users")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "banned_chat_users" },
        () => fetchBannedUsers(),
      )
      .subscribe()

    return () => {
      bannedChannel.unsubscribe()
    }
  }, [isAdmin, supabase])

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("chat_messages")
        .delete()
        .eq("id", messageId)
      if (error) throw error
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
      toast({ title: "تم", description: "تم حذف الرسالة بنجاح" })
    } catch (error) {
      console.error("Error deleting message:", error)
      toast({ title: "خطأ", description: "فشل في حذف الرسالة", variant: "destructive" })
    }
    setDeleteConfirm({ open: false, messageId: null })
  }

  const startEditing = (message: Message) => {
    setEditingMessageId(message.id)
    setEditContent(message.content)
  }

  const cancelEditing = () => {
    setEditingMessageId(null)
    setEditContent("")
  }

  const saveEdit = async () => {
    if (!editingMessageId || !editContent.trim()) return
    try {
      const { error } = await supabase
        .from("chat_messages")
        .update({ content: editContent.trim() })
        .eq("id", editingMessageId)
      if (error) throw error
      setMessages((prev) => prev.map((m) => m.id === editingMessageId ? { ...m, content: editContent.trim() } : m))
      toast({ title: "تم", description: "تم تعديل الرسالة" })
    } catch (error) {
      console.error("Error editing message:", error)
      toast({ title: "خطأ", description: "فشل في تعديل الرسالة", variant: "destructive" })
    }
    cancelEditing()
  }

  const banUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("banned_chat_users")
        .insert({ user_id: userId, banned_by: user.id })
      if (error) throw error
      setBannedUsers((prev) => [...prev, userId])
      toast({ title: "تم", description: "تم حظر المستخدم من المحادثة" })
    } catch (error) {
      console.error("Error banning user:", error)
      toast({ title: "خطأ", description: "فشل في حظر المستخدم", variant: "destructive" })
    }
    setBanConfirm({ open: false, userId: null, username: null })
  }

  const unbanUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("banned_chat_users")
        .delete()
        .eq("user_id", userId)
      if (error) throw error
      setBannedUsers((prev) => prev.filter((id) => id !== userId))
      toast({ title: "تم", description: "تم رفع الحظر عن المستخدم" })
    } catch (error) {
      console.error("Error unbanning user:", error)
      toast({ title: "خطأ", description: "فشل في رفع الحظر", variant: "destructive" })
    }
  }

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">جاري التحميل</h3>
              <p className="text-muted-foreground">لحظة من فضلك...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user || !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">تسجيل الدخول مطلوب</h3>
              <p className="text-muted-foreground">يجب تسجيل الدخول للمشاركة في المحادثة</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">المحادثة المباشرة</h1>
          <p className="text-muted-foreground">تواصل مع أعضاء المجتمع في الوقت الفعلي</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          {onlineUsers.length} متصل الآن
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Area */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                المحادثة العامة
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              {/* Messages */}
              <div className="flex-1 overflow-hidden">
                <ScrollArea ref={scrollAreaRef} className="h-full px-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-muted-foreground">جاري تحميل الرسائل...</p>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">لا توجد رسائل بعد</p>
                        <p className="text-sm text-muted-foreground">كن أول من يبدأ المحادثة!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 py-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn("flex gap-3 group", message.user_id === user.id ? "flex-row-reverse" : "flex-row")}
                        >
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={message.user_profiles?.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>{message.user_profiles?.username?.[0] || "م"}</AvatarFallback>
                          </Avatar>

                          <div
                            className={cn(
                              "flex flex-col max-w-[70%] min-w-0",
                              message.user_id === user.id ? "items-end" : "items-start",
                            )}
                          >
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-sm font-medium truncate">
                                {message.user_profiles?.username || "مستخدم"}
                              </span>
                              {message.user_profiles?.is_admin && (
                                <Badge variant="secondary" className="text-xs">
                                  مشرف
                                </Badge>
                              )}
                              {isAdmin && bannedUsers.includes(message.user_id) && (
                                <Badge variant="destructive" className="text-xs">
                                  محظور
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatArabicDate(new Date(message.created_at))}
                              </span>

                              {/* Message actions: own messages or admin */}
                              {(message.user_id === user.id || isAdmin) && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start">
                                    {!message.audio_url && (
                                      <DropdownMenuItem onClick={() => startEditing(message)}>
                                        <Pencil className="h-4 w-4 ml-2" />
                                        تعديل الرسالة
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => setDeleteConfirm({ open: true, messageId: message.id })}
                                    >
                                      <Trash2 className="h-4 w-4 ml-2" />
                                      حذف الرسالة
                                    </DropdownMenuItem>
                                    {isAdmin && message.user_id !== user.id && (
                                      !bannedUsers.includes(message.user_id) ? (
                                        <DropdownMenuItem
                                          className="text-destructive focus:text-destructive"
                                          onClick={() => setBanConfirm({ open: true, userId: message.user_id, username: message.user_profiles?.username || "مستخدم" })}
                                        >
                                          <Ban className="h-4 w-4 ml-2" />
                                          حظر من المحادثة
                                        </DropdownMenuItem>
                                      ) : (
                                        <DropdownMenuItem onClick={() => unbanUser(message.user_id)}>
                                          <ShieldAlert className="h-4 w-4 ml-2" />
                                          رفع الحظر
                                        </DropdownMenuItem>
                                      )
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>

                            {editingMessageId === message.id ? (
                              <div className="flex items-center gap-2 w-full">
                                <Input
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveEdit()
                                    if (e.key === "Escape") cancelEditing()
                                  }}
                                  className="flex-1 h-8 text-sm"
                                  autoFocus
                                />
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={saveEdit}>
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={cancelEditing}>
                                  <X className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <div
                                  className={cn(
                                    "rounded-lg px-3 py-2 text-sm break-words",
                                    message.user_id === user.id ? "bg-primary text-primary-foreground" : "bg-muted",
                                  )}
                                >
                                  {message.audio_url ? (
                                    <div className="flex items-center gap-2">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                          "h-8 w-8 p-0 rounded-full",
                                          message.user_id === user.id
                                            ? "hover:bg-primary-foreground/20"
                                            : "hover:bg-muted-foreground/20",
                                        )}
                                        onClick={() => playAudio(message.id, message.audio_url!)}
                                      >
                                        {playingAudioId === message.id ? (
                                          <Pause className="h-4 w-4" />
                                        ) : (
                                          <Play className="h-4 w-4" />
                                        )}
                                      </Button>
                                      <span>رسالة صوتية</span>
                                    </div>
                                  ) : message.image_url ? (
                                    <div className="space-y-1">
                                      <img
                                        src={message.image_url}
                                        alt="صورة"
                                        className="max-h-48 max-w-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => setPreviewImage(message.image_url)}
                                      />
                                      {message.content && message.content !== "📷 صورة" && (
                                        <p>{message.content}</p>
                                      )}
                                    </div>
                                  ) : message.file_url ? (
                                    <div className="space-y-1">
                                      <a
                                        href={message.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                      >
                                        <FileText className="h-4 w-4 shrink-0" />
                                        <span className="truncate max-w-[180px]">{message.file_name || "ملف"}</span>
                                        <Download className="h-3 w-3 shrink-0" />
                                      </a>
                                      {message.content && message.content !== "📎 ملف" && (
                                        <p>{message.content}</p>
                                      )}
                                    </div>
                                  ) : (
                                    message.content
                                  )}
                                </div>
                                {/* Edit button for own messages (not audio) */}
                                {!message.audio_url && (message.user_id === user.id || isAdmin) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => startEditing(message)}
                                  >
                                    <Pencil className="h-3 w-3 text-muted-foreground" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}

                  {/* Scroll to bottom button */}
                  {!isAtBottom && messages.length > 0 && (
                    <Button
                      onClick={scrollToBottom}
                      size="icon"
                      className="sticky bottom-2 left-1/2 -translate-x-1/2 h-9 w-9 rounded-full shadow-lg z-10"
                    >
                      <ChevronDown className="h-5 w-5" />
                    </Button>
                  )}
                </ScrollArea>
              </div>

              {/* Message Input */}
              <div className="p-4 border-t flex-shrink-0">
                {isBanned ? (
                  <div className="flex items-center justify-center gap-2 py-2 text-destructive">
                    <Ban className="h-4 w-4" />
                    <span className="text-sm font-medium">تم حظرك من إرسال الرسائل في المحادثة</span>
                  </div>
                ) : isRecording ? (
                  <div className="flex items-center justify-center gap-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium">جاري التسجيل: {formatRecordingTime(recordingTime)}</span>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={stopRecording}
                      disabled={isSending}
                    >
                      <Square className="h-4 w-4 ml-2" />
                      إيقاف وإرسال
                    </Button>
                  </div>
                ) : (
                  <div>
                    {selectedFile && (
                      <div className="flex items-center gap-2 mb-2 p-2 bg-muted/50 rounded-lg">
                        {filePreview ? (
                          <img src={filePreview} alt="معاينة" className="h-12 w-12 object-cover rounded" />
                        ) : (
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        )}
                        <span className="text-sm truncate flex-1">{selectedFile.name}</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={clearSelectedFile}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <form onSubmit={sendMessage} className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="اكتب رسالتك هنا..."
                        disabled={isSending}
                        className="flex-1"
                        maxLength={500}
                      />
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                        onChange={handleFileSelect}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSending}
                        title="إرفاق ملف أو صورة"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={startRecording}
                        disabled={isSending}
                        title="تسجيل رسالة صوتية"
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                      <Button type="submit" disabled={(!newMessage.trim() && !selectedFile) || isSending}>
                        {isSending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Online Users Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                المتصلون الآن ({onlineUsers.length})
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {onlineUsers.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">لا يوجد مستخدمون متصلون</div>
                ) : (
                  <div className="space-y-1 p-2">
                    {onlineUsers.map((onlineUser) => (
                      <div
                        key={onlineUser.user_id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={onlineUser.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">{onlineUser.username[0] || "م"}</AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-background rounded-full"></div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="text-sm font-medium truncate">{onlineUser.username}</p>
                            {onlineUser.is_admin && (
                              <Badge variant="secondary" className="text-xs">
                                مشرف
                              </Badge>
                            )}
                            {isAdmin && bannedUsers.includes(onlineUser.user_id) && (
                              <Badge variant="destructive" className="text-xs">
                                محظور
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">متصل الآن</p>
                        </div>

                        {/* Admin ban/unban in sidebar */}
                        {isAdmin && onlineUser.user_id !== user.id && !onlineUser.is_admin && (
                          bannedUsers.includes(onlineUser.user_id) ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => unbanUser(onlineUser.user_id)}
                            >
                              رفع الحظر
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                              onClick={() => setBanConfirm({ open: true, userId: onlineUser.user_id, username: onlineUser.username })}
                            >
                              <Ban className="h-3 w-3" />
                            </Button>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Separator className="my-4" />
        </div>
      </div>

      {/* Delete message confirmation dialog */}
      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => !open && setDeleteConfirm({ open: false, messageId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الرسالة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه الرسالة؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirm.messageId && deleteMessage(deleteConfirm.messageId)}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ban user confirmation dialog */}
      <AlertDialog open={banConfirm.open} onOpenChange={(open) => !open && setBanConfirm({ open: false, userId: null, username: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حظر المستخدم</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حظر "{banConfirm.username}" من إرسال الرسائل في المحادثة؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => banConfirm.userId && banUser(banConfirm.userId)}
            >
              حظر
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image preview modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={() => setPreviewImage(null)}
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={previewImage}
            alt="معاينة الصورة"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

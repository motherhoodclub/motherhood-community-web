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
import { Send, MessageCircle, Clock, X, Minimize2, Mic, Square, Play, Pause, ChevronDown, Trash2, Ban, MoreVertical, ShieldAlert, Pencil, Check, Paperclip, FileText, Download } from "lucide-react"
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

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaWidgetRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const getWidgetScrollContainer = () => {
    return scrollAreaWidgetRef.current?.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement | null
  }

  const scrollToBottom = () => {
    const container = getWidgetScrollContainer()
    if (container) {
      container.scrollTop = container.scrollHeight
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }

  const handleWidgetScroll = () => {
    const container = getWidgetScrollContainer()
    if (container) {
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
      setIsAtBottom(distanceFromBottom < 80)
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
    if (!user || !userProfile) return

    let messagesChannel: any = null
    let presenceChannel: any = null
    let presenceInterval: NodeJS.Timeout | null = null

    const setupChat = async () => {
      try {
        // Fetch initial messages
        const { data: messagesData, error: messagesError } = await supabase
          .from("chat_messages")
          .select(`
            id,
            content,
            audio_url,
            user_id,
            created_at,
            user_profiles (
              username,
              avatar_url,
              is_admin
            )
          `)
          .order("created_at", { ascending: true })
          .limit(100)

        if (messagesError) throw messagesError
        setMessages(messagesData || [])

        // Fetch initial online users
        const { data: presenceData, error: presenceError } = await supabase
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

        if (presenceError) throw presenceError

        const formattedUsers =
          presenceData?.map((item) => ({
            user_id: item.user_id,
            username: item.user_profiles?.username || "مستخدم",
            avatar_url: item.user_profiles?.avatar_url,
            is_admin: item.user_profiles?.is_admin || false,
            last_seen: item.last_seen,
          })) || []

        setOnlineUsers(formattedUsers)
        setIsLoading(false)

        // Update presence
        const updatePresence = async () => {
          try {
            await supabase.from("chat_presence").upsert({
              user_id: user.id,
              last_seen: new Date().toISOString(),
            })
          } catch (error) {
            console.error("Error updating presence:", error)
          }
        }

        await updatePresence()
        presenceInterval = setInterval(updatePresence, 30000)

        // Setup real-time subscriptions with unique channel names
        const channelId = `chat_${Date.now()}_${Math.random()}`

        messagesChannel = supabase
          .channel(`messages_${channelId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "chat_messages",
            },
            async (payload) => {
              try {
                const { data } = await supabase
                  .from("chat_messages")
                  .select(`
                    id,
                    content,
                    audio_url,
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
                  setMessages((prev) => [...prev, data])
                  // Increment unread count if chat is closed or minimized
                  if (!isOpen || isMinimized) {
                    setUnreadCount((prev) => prev + 1)
                  }
                }
              } catch (error) {
                console.error("Error fetching new message:", error)
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
              try {
                const { data } = await supabase
                  .from("chat_messages")
                  .select(`id, content, audio_url, user_id, created_at, user_profiles (username, avatar_url, is_admin)`)
                  .eq("id", payload.new.id)
                  .single()
                if (data) {
                  setMessages((prev) => prev.map((m) => m.id === data.id ? data : m))
                }
              } catch (error) {
                console.error("Error fetching updated message:", error)
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

        presenceChannel = supabase
          .channel(`presence_${channelId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "chat_presence",
            },
            async () => {
              try {
                const { data } = await supabase
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
            },
          )
          .subscribe()
      } catch (error) {
        console.error("Error setting up chat:", error)
        setIsLoading(false)
      }
    }

    setupChat()

    // Cleanup function
    return () => {
      if (presenceInterval) {
        clearInterval(presenceInterval)
      }
      if (messagesChannel) {
        supabase.removeChannel(messagesChannel)
      }
      if (presenceChannel) {
        supabase.removeChannel(presenceChannel)
      }
    }
  }, [user, userProfile]) // Only depend on user and profile objects

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom()
    }
  }, [messages, isAtBottom])

  // Scroll to bottom when chat opens or is maximized
  useEffect(() => {
    if (isOpen && !isMinimized) {
      // Small delay to ensure ScrollArea viewport is rendered
      const timer = setTimeout(() => {
        scrollToBottom()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen, isMinimized])

  // Attach scroll listener to the radix scroll viewport
  useEffect(() => {
    const container = getWidgetScrollContainer()
    if (container) {
      container.addEventListener("scroll", handleWidgetScroll)
      return () => container.removeEventListener("scroll", handleWidgetScroll)
    }
  }, [messages, isOpen, isMinimized])

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setUnreadCount(0)
    }
  }, [isOpen, isMinimized])

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
        const { error: uploadError } = await supabase.storage
          .from("uploads")
          .upload(path, selectedFile, { contentType: selectedFile.type })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(path)

        if (selectedFile.type.startsWith("image/")) {
          imageUrl = urlData.publicUrl
        } else {
          fileUrl = urlData.publicUrl
          fileName = selectedFile.name
        }
      }

      const { error } = await supabase.from("chat_messages").insert({
        content: newMessage.trim() || (imageUrl ? "📷 صورة" : "📎 ملف"),
        user_id: user.id,
        ...(imageUrl && { image_url: imageUrl }),
        ...(fileUrl && { file_url: fileUrl }),
        ...(fileName && { file_name: fileName }),
      })

      if (error) throw error
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
      let extension = "webm"
      if (mimeType.includes("ogg")) extension = "ogg"
      else if (mimeType.includes("mp4")) extension = "mp4"

      const fileName = `${user.id}-${Date.now()}.${extension}`
      const { error: uploadError } = await supabase.storage
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
      .channel("floating_banned_chat_users")
      .on("postgres_changes", { event: "*", schema: "public", table: "banned_chat_users" }, () => fetchBannedUsers())
      .subscribe()

    return () => { bannedChannel.unsubscribe() }
  }, [isAdmin, supabase])

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase.from("chat_messages").delete().eq("id", messageId)
      if (error) throw error
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
      toast({ title: "تم", description: "تم حذف الرسالة بنجاح" })
    } catch (error) {
      console.error("Error deleting message:", error)
      toast({ title: "خطأ", description: "فشل في حذف الرسالة", variant: "destructive" })
    }
    setDeleteConfirm({ open: false, messageId: null })
  }

  const banUser = async (userId: string) => {
    try {
      const { error } = await supabase.from("banned_chat_users").insert({ user_id: userId, banned_by: user.id })
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
      const { error } = await supabase.from("banned_chat_users").delete().eq("user_id", userId)
      if (error) throw error
      setBannedUsers((prev) => prev.filter((id) => id !== userId))
      toast({ title: "تم", description: "تم رفع الحظر عن المستخدم" })
    } catch (error) {
      console.error("Error unbanning user:", error)
      toast({ title: "خطأ", description: "فشل في رفع الحظر", variant: "destructive" })
    }
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

  const toggleChat = () => {
    setIsOpen(!isOpen)
    setIsMinimized(false)
    if (!isOpen) {
      setUnreadCount(0)
    }
  }

  const minimizeChat = () => {
    setIsMinimized(true)
  }

  const maximizeChat = () => {
    setIsMinimized(false)
    setUnreadCount(0)
  }

  if (isAuthLoading || !user || !userProfile) {
    return null
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={toggleChat}
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90 relative"
            size="icon"
          >
            <MessageCircle className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Card className={cn("w-80 shadow-2xl transition-all duration-300", isMinimized ? "h-14" : "h-96")}>
            {/* Header */}
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">المحادثة المباشرة</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {onlineUsers.length}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={isMinimized ? maximizeChat : minimizeChat}
                  >
                    <Minimize2 className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleChat}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {!isMinimized && (
              <CardContent className="flex flex-col p-0 h-80">
                {/* Messages */}
                <ScrollArea ref={scrollAreaWidgetRef} className="flex-1 px-3">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-xs text-muted-foreground">جاري التحميل...</p>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-xs text-muted-foreground">لا توجد رسائل</p>
                        <p className="text-xs text-muted-foreground">ابدأ المحادثة!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 py-3">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn("flex gap-2 group", message.user_id === user.id ? "flex-row-reverse" : "flex-row")}
                        >
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarImage src={message.user_profiles?.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">
                              {message.user_profiles?.username?.[0] || "م"}
                            </AvatarFallback>
                          </Avatar>

                          <div
                            className={cn(
                              "flex flex-col max-w-[75%]",
                              message.user_id === user.id ? "items-end" : "items-start",
                            )}
                          >
                            <div className="flex items-center gap-1 mb-1">
                              <span className="text-xs font-medium">{message.user_profiles?.username || "مستخدم"}</span>
                              {message.user_profiles?.is_admin && (
                                <Badge variant="secondary" className="text-xs px-1 py-0">
                                  مشرف
                                </Badge>
                              )}
                              {/* Admin actions */}
                              {isAdmin && message.user_id !== user.id && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start">
                                    {!message.audio_url && (
                                      <DropdownMenuItem className="text-xs" onClick={() => startEditing(message)}>
                                        <Pencil className="h-3 w-3 ml-1" />
                                        تعديل
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive text-xs"
                                      onClick={() => setDeleteConfirm({ open: true, messageId: message.id })}
                                    >
                                      <Trash2 className="h-3 w-3 ml-1" />
                                      حذف الرسالة
                                    </DropdownMenuItem>
                                    {!bannedUsers.includes(message.user_id) ? (
                                      <DropdownMenuItem
                                        className="text-destructive focus:text-destructive text-xs"
                                        onClick={() => setBanConfirm({ open: true, userId: message.user_id, username: message.user_profiles?.username || "مستخدم" })}
                                      >
                                        <Ban className="h-3 w-3 ml-1" />
                                        حظر
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem className="text-xs" onClick={() => unbanUser(message.user_id)}>
                                        <ShieldAlert className="h-3 w-3 ml-1" />
                                        رفع الحظر
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>

                            {editingMessageId === message.id ? (
                              <div className="flex items-center gap-1 w-full">
                                <Input
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveEdit()
                                    if (e.key === "Escape") cancelEditing()
                                  }}
                                  className="flex-1 h-6 text-xs"
                                  autoFocus
                                />
                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={saveEdit}>
                                  <Check className="h-3 w-3 text-green-600" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={cancelEditing}>
                                  <X className="h-3 w-3 text-red-500" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <div
                                  className={cn(
                                    "rounded-lg px-2 py-1 text-xs",
                                    message.user_id === user.id ? "bg-primary text-primary-foreground" : "bg-muted",
                                  )}
                                >
                                  {message.audio_url ? (
                                    <div className="flex items-center gap-1">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                          "h-6 w-6 p-0 rounded-full",
                                          message.user_id === user.id
                                            ? "hover:bg-primary-foreground/20"
                                            : "hover:bg-muted-foreground/20",
                                        )}
                                        onClick={() => playAudio(message.id, message.audio_url!)}
                                      >
                                        {playingAudioId === message.id ? (
                                          <Pause className="h-3 w-3" />
                                        ) : (
                                          <Play className="h-3 w-3" />
                                        )}
                                      </Button>
                                      <span>صوتية</span>
                                    </div>
                                  ) : message.image_url ? (
                                    <div className="space-y-1">
                                      <a href={message.image_url} target="_blank" rel="noopener noreferrer">
                                        <img
                                          src={message.image_url}
                                          alt="صورة"
                                          className="max-h-32 max-w-48 rounded cursor-pointer hover:opacity-90 transition-opacity"
                                        />
                                      </a>
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
                                        className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                                      >
                                        <FileText className="h-3 w-3 shrink-0" />
                                        <span className="truncate max-w-[120px]">{message.file_name || "ملف"}</span>
                                        <Download className="h-2.5 w-2.5 shrink-0" />
                                      </a>
                                      {message.content && message.content !== "📎 ملف" && (
                                        <p>{message.content}</p>
                                      )}
                                    </div>
                                  ) : (
                                    message.content
                                  )}
                                </div>
                                {!message.audio_url && (message.user_id === user.id || isAdmin) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => startEditing(message)}
                                  >
                                    <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                                  </Button>
                                )}
                              </div>
                            )}

                            <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock className="h-2 w-2" />
                              {formatArabicDate(new Date(message.created_at))}
                            </span>
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
                      className="sticky bottom-1 left-1/2 -translate-x-1/2 h-7 w-7 rounded-full shadow-lg z-10"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="p-3 border-t">
                  {isBanned ? (
                    <div className="flex items-center justify-center gap-1 py-1 text-destructive">
                      <Ban className="h-3 w-3" />
                      <span className="text-xs font-medium">تم حظرك من إرسال الرسائل</span>
                    </div>
                  ) : isRecording ? (
                    <div className="flex items-center justify-center gap-2 py-1">
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-xs">{formatRecordingTime(recordingTime)}</span>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={stopRecording}
                        disabled={isSending}
                      >
                        <Square className="h-3 w-3 ml-1" />
                        إرسال
                      </Button>
                    </div>
                  ) : (
                    <div>
                      {selectedFile && (
                        <div className="flex items-center gap-1 mb-1 p-1 bg-muted/50 rounded text-xs">
                          {filePreview ? (
                            <img src={filePreview} alt="معاينة" className="h-8 w-8 object-cover rounded" />
                          ) : (
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          )}
                          <span className="truncate flex-1">{selectedFile.name}</span>
                          <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={clearSelectedFile}>
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      )}
                      <form onSubmit={sendMessage} className="flex gap-1">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="اكتب رسالتك..."
                          disabled={isSending}
                          className="flex-1 h-8 text-xs"
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
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isSending}
                        >
                          <Paperclip className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={startRecording}
                          disabled={isSending}
                        >
                          <Mic className="h-3 w-3" />
                        </Button>
                        <Button type="submit" disabled={(!newMessage.trim() && !selectedFile) || isSending} size="sm" className="h-8 w-8 p-0">
                          {isSending ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          ) : (
                            <Send className="h-3 w-3" />
                          )}
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}
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
    </>
  )
}

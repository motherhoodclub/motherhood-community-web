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
import { Send, MessageCircle, Clock, X, Minimize2, Mic, Square, Play, Pause } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { formatArabicDate } from "@/lib/date-utils"

interface Message {
  id: string
  content: string
  audio_url?: string
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
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
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setUnreadCount(0)
    }
  }, [isOpen, isMinimized])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !userProfile || isSending) return

    setIsSending(true)
    try {
      const { error } = await supabase.from("chat_messages").insert({
        content: newMessage.trim(),
        user_id: user.id,
      })

      if (error) throw error
      setNewMessage("")
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
                <ScrollArea className="flex-1 px-3">
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
                          className={cn("flex gap-2", message.user_id === user.id ? "flex-row-reverse" : "flex-row")}
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
                            </div>

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
                              ) : (
                                message.content
                              )}
                            </div>

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
                </ScrollArea>

                {/* Message Input */}
                <div className="p-3 border-t">
                  {isRecording ? (
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
                    <form onSubmit={sendMessage} className="flex gap-1">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="اكتب رسالتك..."
                        disabled={isSending}
                        className="flex-1 h-8 text-xs"
                        maxLength={500}
                      />
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
                      <Button type="submit" disabled={!newMessage.trim() || isSending} size="sm" className="h-8 w-8 p-0">
                        {isSending ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                      </Button>
                    </form>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </>
  )
}

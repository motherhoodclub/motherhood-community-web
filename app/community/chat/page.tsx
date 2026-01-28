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
import { Send, Users, MessageCircle, Clock, Mic, Square, Play, Pause } from "lucide-react"
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
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

        if (error) throw error
        setMessages(data || [])
      } catch (error) {
        console.error("Error fetching messages:", error)
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
            }
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

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom()
    }, 100)
    return () => clearTimeout(timer)
  }, [messages])

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
                          className={cn("flex gap-3", message.user_id === user.id ? "flex-row-reverse" : "flex-row")}
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
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatArabicDate(new Date(message.created_at))}
                              </span>
                            </div>

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
                              ) : (
                                message.content
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Message Input */}
              <div className="p-4 border-t flex-shrink-0">
                {isRecording ? (
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
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="اكتب رسالتك هنا..."
                      disabled={isSending}
                      className="flex-1"
                      maxLength={500}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={startRecording}
                      disabled={isSending}
                      title="تسجيل رسالة صوتية"
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                    <Button type="submit" disabled={!newMessage.trim() || isSending}>
                      {isSending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
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
                          </div>
                          <p className="text-xs text-muted-foreground">متصل الآن</p>
                        </div>
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
    </div>
  )
}

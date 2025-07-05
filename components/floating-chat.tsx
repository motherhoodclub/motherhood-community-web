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
import { Send, MessageCircle, Clock, X, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { formatArabicDate } from "@/lib/date-utils"

interface Message {
  id: string
  content: string
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
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
            user_id,
            created_at,
            user_profiles (
              username,
              avatar_url,
              is_admin
            )
          `)
          .order("created_at", { ascending: true })
          .limit(50)

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
                              {message.content}
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
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="اكتب رسالتك..."
                      disabled={isSending}
                      className="flex-1 h-8 text-xs"
                      maxLength={500}
                    />
                    <Button type="submit" disabled={!newMessage.trim() || isSending} size="sm" className="h-8 w-8 p-0">
                      {isSending ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      ) : (
                        <Send className="h-3 w-3" />
                      )}
                    </Button>
                  </form>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </>
  )
}

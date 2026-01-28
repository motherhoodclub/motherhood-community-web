"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Mail, Edit2, Upload, Loader2 } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"
import { createAvatar } from "@dicebear/core"
import { initials } from "@dicebear/collection"

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({
    username: "",
    email: "",
    bio: "",
    avatar_url: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [activityData, setActivityData] = useState({
    topics: [],
    comments: [],
    likes: [],
    bookmarks: [],
  })
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setIsLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }

    const { data, error } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch profile",
        variant: "destructive",
      })
    } else if (data) {
      setProfile({
        username: data.username || "",
        email: user.email || "",
        bio: data.bio || "",
        avatar_url: data.avatar_url || "",
      })
    }

    // Fetch activity data
    fetchActivityData(user.id)

    setIsLoading(false)
  }

  const generateAvatar = async () => {
    setIsLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Generate avatar using DiceBear
      const seed = profile.username || user.email || Math.random().toString()
      const avatar = createAvatar(initials, {
        seed,
        backgroundColor: ["b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf"],
      })

      const dataUrl = await avatar.toDataUri()

      // Convert data URL to Blob
      const res = await fetch(dataUrl)
      const blob = await res.blob()

      // Create a File object
      const file = new File([blob], `${seed}.png`, { type: "image/png" })

      // Upload using the existing avatar upload function
      const fileName = `${user.id}/${Date.now()}.png`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage.from("uploads").upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", user.id)

      if (updateError) {
        throw updateError
      }

      setProfile((prev) => ({ ...prev, avatar_url: urlData.publicUrl }))

      toast({
        title: "نجاح",
        description: "تم إنشاء صورة رمزية جديدة",
      })
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء صورة رمزية",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfile((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }

    const { error } = await supabase
      .from("user_profiles")
      .update({
        username: profile.username,
        bio: profile.bio,
      })
      .eq("id", user.id)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
      setIsEditing(false)
    }
    setIsLoading(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return
    }
    const file = e.target.files[0]
    const fileExt = file.name.split(".").pop()
    const fileName = `${Math.random()}.${fileExt}`
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const filePath = `${user.id}/${fileName}`

    setIsLoading(true)

    try {
      const { error: uploadError } = await supabase.storage.from("uploads").upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", user.id)

      if (updateError) {
        throw updateError
      }

      setProfile((prev) => ({ ...prev, avatar_url: urlData.publicUrl }))
      toast({
        title: "Success",
        description: "Avatar updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update avatar",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchActivityData = async (userId) => {
    try {
      const [topicsRes, commentsRes, likesRes, bookmarksRes] = await Promise.all([
        supabase
          .from("topics")
          .select("id, title, created_at, category")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("comments")
          .select("id, content, created_at, topic_id, topics(id, title)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("topic_likes")
          .select("created_at, topic_id, topics(id, title)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("bookmarks")
          .select("created_at, topic_id, topics(id, title)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5),
      ])

      setActivityData({
        topics: topicsRes.data || [],
        comments: commentsRes.data || [],
        likes: likesRes.data || [],
        bookmarks: bookmarksRes.data || [],
      })
    } catch (error) {
      console.error("Error fetching activity data:", error)
    }
  }

  if (isLoading) {
    return <div>جاري التحميل...</div>
  }

  return (
    <div className="container py-8 animate-fadeIn">
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4 relative">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile.avatar_url} alt={profile.username} />
              <AvatarFallback>{profile.username ? profile.username[0]?.toUpperCase() : "?"}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 right-0 flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full bg-background"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <Upload className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full bg-background"
                onClick={generateAvatar}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <User className="h-4 w-4" />}
              </Button>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
          </div>
          <CardTitle className="text-3xl">{profile.username}</CardTitle>
          <CardDescription>{profile.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">المعلومات الشخصية</TabsTrigger>
              <TabsTrigger value="activity">النشاط</TabsTrigger>
            </TabsList>
            <TabsContent value="info">
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center gap-2 justify-end">
                    اسم المستخدم
                    <User className="w-4 h-4" />
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    value={profile.username}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 justify-end">
                    البريد الإلكتروني
                    <Mail className="w-4 h-4" />
                  </Label>
                  <Input id="email" name="email" type="email" value={profile.email} disabled className="text-right" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio" className="flex items-center gap-2 justify-end">
                    نبذة شخصية
                    <Edit2 className="w-4 h-4" />
                  </Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={profile.bio}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="text-right"
                  />
                </div>
              </form>
            </TabsContent>
            <TabsContent value="activity">
              <div className="space-y-6">
                {/* المواضيع */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-right">المواضيع الأخيرة</h3>
                  {activityData.topics.length > 0 ? (
                    <ul className="space-y-2">
                      {activityData.topics.map((topic) => (
                        <li key={topic.id} className="border-b pb-2 text-right">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              {new Date(topic.created_at).toLocaleDateString("ar-SA-u-ca-gregory")}
                            </span>
                            <a href={`/community/topic/${topic.id}`} className="text-primary hover:underline">
                              {topic.title}
                            </a>
                          </div>
                          <div className="text-xs text-muted-foreground text-right">القسم: {topic.category}</div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-right">لم تنشئ أي مواضيع بعد.</p>
                  )}
                </div>

                {/* التعليقات */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-right">التعليقات الأخيرة</h3>
                  {activityData.comments.length > 0 ? (
                    <ul className="space-y-2">
                      {activityData.comments.map((comment) => (
                        <li key={comment.id} className="border-b pb-2 text-right">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              {new Date(comment.created_at).toLocaleDateString("ar-SA-u-ca-gregory")}
                            </span>
                            <a href={`/community/topic/${comment.topic_id}`} className="text-primary hover:underline">
                              {comment.topics?.title || "موضوع محذوف"}
                            </a>
                          </div>
                          <p className="text-sm line-clamp-1 text-right">{comment.content}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-right">لم تقم بالتعليق على أي موضوع بعد.</p>
                  )}
                </div>

                {/* الإعجابات */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-right">الإعجابات الأخيرة</h3>
                  {activityData.likes.length > 0 ? (
                    <ul className="space-y-2">
                      {activityData.likes.map((like, index) => (
                        <li key={index} className="border-b pb-2 text-right">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              {new Date(like.created_at).toLocaleDateString("ar-SA-u-ca-gregory")}
                            </span>
                            <a href={`/community/topic/${like.topic_id}`} className="text-primary hover:underline">
                              {like.topics?.title || "موضوع محذوف"}
                            </a>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-right">لم تقم بالإعجاب بأي موضوع بعد.</p>
                  )}
                </div>

                {/* المحفوظات */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-right">المحفوظات الأخيرة</h3>
                  {activityData.bookmarks.length > 0 ? (
                    <ul className="space-y-2">
                      {activityData.bookmarks.map((bookmark, index) => (
                        <li key={index} className="border-b pb-2 text-right">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              {new Date(bookmark.created_at).toLocaleDateString("ar-SA-u-ca-gregory")}
                            </span>
                            <a href={`/community/topic/${bookmark.topic_id}`} className="text-primary hover:underline">
                              {bookmark.topics?.title || "موضوع محذوف"}
                            </a>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-right">لم تقم بحفظ أي موضوع بعد.</p>
                  )}
                </div>

                <div className="flex justify-center mt-4">
                  <Button variant="outline" asChild>
                    <a href="/community/activity">عرض كل النشاطات</a>
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2 space-x-reverse">
          {isEditing ? (
            <>
              <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
                حفظ التغييرات
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isLoading}>
                إلغاء
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} disabled={isLoading}>
              تعديل الملف الشخصي
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

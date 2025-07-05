"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"
import ProtectedRoute from "@/components/protected-route"
import { Upload, LinkIcon } from "lucide-react"

export default function NewDownloadableFilePage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [featuredImage, setFeaturedImage] = useState<File | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [driveLink, setDriveLink] = useState("")
  const [uploadMethod, setUploadMethod] = useState<"upload" | "link">("upload")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    checkAdminStatus()
  }, [])

  const checkAdminStatus = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: userProfile } = await supabase.from("user_profiles").select("is_admin").eq("id", user.id).single()

      const adminStatus =
        userProfile?.is_admin === true ||
        userProfile?.is_admin === "true" ||
        userProfile?.is_admin === 1 ||
        userProfile?.is_admin === "1"

      if (!adminStatus) {
        router.push("/community")
        toast({
          title: "غير مصرح",
          description: "هذه الصفحة متاحة للمشرفين فقط",
          variant: "destructive",
        })
        return
      }

      setIsAdmin(true)
    } catch (error) {
      console.error("Error checking admin status:", error)
      router.push("/community")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال عنوان الملف",
        variant: "destructive",
      })
      return
    }

    if (uploadMethod === "upload" && !file) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار ملف للرفع",
        variant: "destructive",
      })
      return
    }

    if (uploadMethod === "link" && !driveLink.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رابط الملف",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      let featuredImageUrl = null
      let fileUrl = null
      let fileType = null
      let fileSize = null

      // Upload featured image if provided
      if (featuredImage) {
        const { data: imageData, error: imageError } = await supabase.storage
          .from("uploads")
          .upload(`downloadable-files/featured/${Date.now()}-${featuredImage.name}`, featuredImage)

        if (imageError) {
          console.error("Error uploading featured image:", imageError)
        } else {
          featuredImageUrl = imageData.path
        }
      }

      // Upload file if upload method is selected
      if (uploadMethod === "upload" && file) {
        const { data: fileData, error: fileError } = await supabase.storage
          .from("uploads")
          .upload(`downloadable-files/files/${Date.now()}-${file.name}`, file)

        if (fileError) {
          throw new Error("فشل في رفع الملف")
        }

        fileUrl = fileData.path
        fileType = file.type
        fileSize = file.size
      }

      // Create the downloadable file record
      const response = await fetch("/api/downloadable-files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          featured_image_url: featuredImageUrl,
          file_url: uploadMethod === "upload" ? fileUrl : null,
          file_drive_link: uploadMethod === "link" ? driveLink : null,
          file_type: fileType,
          file_size: fileSize,
        }),
      })

      if (!response.ok) {
        throw new Error("فشل في إنشاء الملف")
      }

      const data = await response.json()

      toast({
        title: "تم بنجاح",
        description: "تم إضافة الملف بنجاح",
      })

      router.push(`/community/downloadable-files/${data.id}`)
    } catch (error) {
      console.error("Error creating file:", error)
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء إضافة الملف",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <ProtectedRoute>
      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">إضافة ملف جديد</h1>
            <p className="text-muted-foreground mt-2">أضف ملف جديد قابل للتحميل للمجتمع</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>تفاصيل الملف</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">عنوان الملف *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="أدخل عنوان الملف"
                    required
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">وصف الملف</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="أدخل وصف مختصر للملف"
                    className="text-right"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="featured-image">الصورة المميزة</Label>
                  <Input
                    id="featured-image"
                    type="file"
                    onChange={(e) => setFeaturedImage(e.target.files?.[0] || null)}
                    accept="image/*"
                  />
                  <p className="text-sm text-muted-foreground">اختياري - صورة تمثل الملف</p>
                </div>

                <div className="space-y-4">
                  <Label>طريقة إضافة الملف</Label>
                  <Tabs value={uploadMethod} onValueChange={(value) => setUploadMethod(value as "upload" | "link")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="upload" className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        رفع ملف
                      </TabsTrigger>
                      <TabsTrigger value="link" className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" />
                        رابط خارجي
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="upload" className="space-y-2">
                      <Label htmlFor="file">الملف *</Label>
                      <Input
                        id="file"
                        type="file"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                      />
                      <p className="text-sm text-muted-foreground">
                        الملفات المدعومة: PDF, Word, Excel, PowerPoint (حتى 50 ميجابايت)
                      </p>
                    </TabsContent>

                    <TabsContent value="link" className="space-y-2">
                      <Label htmlFor="drive-link">رابط الملف *</Label>
                      <Input
                        id="drive-link"
                        value={driveLink}
                        onChange={(e) => setDriveLink(e.target.value)}
                        placeholder="https://drive.google.com/file/d/..."
                        className="text-left"
                        dir="ltr"
                      />
                      <p className="text-sm text-muted-foreground">
                        رابط مباشر للملف من Google Drive أو أي خدمة تخزين سحابي أخرى
                      </p>
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? "جاري الإضافة..." : "إضافة الملف"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                    إلغاء
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}

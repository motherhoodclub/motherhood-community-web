"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"
import ProtectedRoute from "@/components/protected-route"
import { Upload, LinkIcon, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { MIN_TIER_OPTIONS } from "@/lib/entitlements"

interface DownloadableFile {
  id: string
  title: string
  description: string
  featured_image_url: string | null
  file_url: string | null
  file_drive_link: string | null
  file_type: string | null
  file_size: number | null
  min_tier: number | null
}

export default function EditDownloadableFilePage() {
  const [file, setFile] = useState<DownloadableFile | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [featuredImage, setFeaturedImage] = useState<File | null>(null)
  const [newFile, setNewFile] = useState<File | null>(null)
  const [driveLink, setDriveLink] = useState("")
  const [minTier, setMinTier] = useState(0)
  const [uploadMethod, setUploadMethod] = useState<"upload" | "link">("upload")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const router = useRouter()
  const params = useParams()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    if (params.id) {
      checkAdminStatus()
      fetchFile()
    }
  }, [params.id])

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

      if (!userProfile?.is_admin) {
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
    }
  }

  const fetchFile = async () => {
    try {
      const response = await fetch(`/api/downloadable-files/${params.id}`)

      if (!response.ok) {
        throw new Error("File not found")
      }

      const data = await response.json()
      setFile(data)
      setTitle(data.title)
      setDescription(data.description || "")
      setDriveLink(data.file_drive_link || "")
      setMinTier(data.min_tier ?? 0)
      setUploadMethod(data.file_url ? "upload" : "link")
    } catch (error) {
      console.error("Error fetching file:", error)
      toast({
        title: "خطأ",
        description: "لم يتم العثور على الملف",
        variant: "destructive",
      })
      router.push("/community/downloadable-files")
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

    setIsSubmitting(true)

    try {
      let featuredImageUrl = file?.featured_image_url
      let fileUrl = file?.file_url
      let fileType = file?.file_type
      let fileSize = file?.file_size

      // Upload new featured image if provided
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

      // Upload new file if provided
      if (uploadMethod === "upload" && newFile) {
        const { data: fileData, error: fileError } = await supabase.storage
          .from("uploads")
          .upload(`downloadable-files/files/${Date.now()}-${newFile.name}`, newFile)

        if (fileError) {
          throw new Error("فشل في رفع الملف")
        }

        fileUrl = fileData.path
        fileType = newFile.type
        fileSize = newFile.size
      }

      // Update the downloadable file record
      const response = await fetch(`/api/downloadable-files/${params.id}`, {
        method: "PUT",
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
          min_tier: minTier,
        }),
      })

      if (!response.ok) {
        throw new Error("فشل في تحديث الملف")
      }

      toast({
        title: "تم بنجاح",
        description: "تم تحديث الملف بنجاح",
      })

      router.push(`/community/downloadable-files/${params.id}`)
    } catch (error) {
      console.error("Error updating file:", error)
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء تحديث الملف",
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

  if (!isAdmin || !file) {
    return null
  }

  return (
    <ProtectedRoute>
      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" asChild>
              <Link href={`/community/downloadable-files/${params.id}`}>
                <ArrowLeft className="h-4 w-4 ml-2" />
                العودة للملف
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">تعديل الملف</h1>
              <p className="text-muted-foreground mt-2">تعديل تفاصيل الملف</p>
            </div>
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
                  <Label htmlFor="featured-image">الصورة المميزة الجديدة</Label>
                  {file.featured_image_url && (
                    <div className="mb-2">
                      <img
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${file.featured_image_url}`}
                        alt="Current featured image"
                        className="w-32 h-20 object-cover rounded border"
                      />
                      <p className="text-sm text-muted-foreground mt-1">الصورة الحالية</p>
                    </div>
                  )}
                  <Input
                    id="featured-image"
                    type="file"
                    onChange={(e) => setFeaturedImage(e.target.files?.[0] || null)}
                    accept="image/*"
                  />
                  <p className="text-sm text-muted-foreground">اختياري - اترك فارغاً للاحتفاظ بالصورة الحالية</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min-tier">مستوى الوصول (الباقة)</Label>
                  <select
                    id="min-tier"
                    value={minTier}
                    onChange={(e) => setMinTier(Number(e.target.value))}
                    className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                  >
                    {MIN_TIER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-muted-foreground">
                    حدد الباقة المطلوبة للوصول إلى هذا الملف (مكتبة الملفات المميزة).
                  </p>
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
                      <Label htmlFor="file">ملف جديد</Label>
                      {file.file_url && (
                        <div className="mb-2 p-2 bg-muted rounded">
                          <p className="text-sm">الملف الحالي موجود</p>
                        </div>
                      )}
                      <Input
                        id="file"
                        type="file"
                        onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                      />
                      <p className="text-sm text-muted-foreground">اختياري - اترك فارغاً للاحتفاظ بالملف الحالي</p>
                    </TabsContent>

                    <TabsContent value="link" className="space-y-2">
                      <Label htmlFor="drive-link">رابط الملف</Label>
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
                    {isSubmitting ? "جاري التحديث..." : "تحديث الملف"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/community/downloadable-files/${params.id}`)}
                    disabled={isSubmitting}
                  >
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

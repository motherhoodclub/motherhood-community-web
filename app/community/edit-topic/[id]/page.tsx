"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"

// UI Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"

// Icons
import { ArrowRight, Save, Trash, Loader2 } from "lucide-react"

const categories = ["الحمل والولادة", "تربية الأطفال", "الصحة والتغذية", "النمو والتطور", "الدعم النفسي", "أخرى"]
const sortingOptions = ["دروس", "أسئلة", "مشاريع", "بدون تصنيف"]
const ageGroups = ["عمر من صفر لسنتين", "سنتين ل 6 سنوات", "6-14 سنة"]

export default function EditTopicPage({ params }: { params: { id: string } }) {
  const [topic, setTopic] = useState({
    id: "",
    title: "",
    content: "",
    category: "",
    age_group: "",
    featured_image_url: null,
    media_urls: [],
    tags: [],
    is_sticky: false,
    is_hot: false,
    sorting: "",
  })
  const [currentTag, setCurrentTag] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [featuredImage, setFeaturedImage] = useState<File | null>(null)
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [previewFeaturedImage, setPreviewFeaturedImage] = useState("")
  const [previewMediaUrls, setPreviewMediaUrls] = useState<string[]>([])
  const [updateStatus, setUpdateStatus] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)

  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    checkAdminStatus()
    fetchTopic()
  }, [])

  const checkAdminStatus = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile, error } = await supabase
          .from("user_profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single()

        if (error) {
          console.error("Error fetching user profile:", error)
          router.push("/community")
          return
        }

        const isUserAdmin = profile.is_admin === true || profile.is_admin === "true"
        setIsAdmin(isUserAdmin)

        if (!isUserAdmin) {
          toast({
            title: "غير مصرح",
            description: "ليس لديك صلاحية تعديل المواضيع",
            variant: "destructive",
          })
          router.push("/community")
        }
      } else {
        router.push("/auth/login")
      }
    } catch (error) {
      console.error("Error checking admin status:", error)
      router.push("/community")
    }
  }

  const fetchTopic = async () => {
    setIsLoading(true)
    try {
      // Add cache buster
      const cacheBuster = new Date().getTime()
      const { data, error } = await supabase.from("topics").select("*").eq("id", params.id).single()

      if (error) {
        throw error
      }

      if (data) {
        setTopic({
          id: data.id,
          title: data.title || "",
          content: data.content || "",
          category: data.category || "",
          age_group: data.age_group || "",
          featured_image_url: data.featured_image_url,
          media_urls: data.media_urls || [],
          tags: data.tags || [],
          is_sticky: data.is_sticky || false,
          is_hot: data.is_hot || false,
          sorting: data.sorting || "",
        })

        // Set preview images
        if (data.featured_image_url) {
          setPreviewFeaturedImage(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${data.featured_image_url}`,
          )
        }

        if (data.media_urls && data.media_urls.length > 0) {
          const mediaUrlPreviews = data.media_urls.map(
            (url) => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${url}`,
          )
          setPreviewMediaUrls(mediaUrlPreviews)
        }
      }
    } catch (error) {
      console.error("Error fetching topic:", error)
      toast({
        title: "خطأ",
        description: "فشل في جلب بيانات الموضوع",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setTopic((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setTopic((prev) => ({ ...prev, [name]: checked }))
  }

  const handleCategoryChange = (value: string) => {
    setTopic((prev) => ({ ...prev, category: value }))
  }

  const handleSortingChange = (value: string) => {
    const newValue = value === "بدون تصنيف" ? "" : value
    setTopic((prev) => ({ ...prev, sorting: newValue }))
  }

  const handleAgeGroupChange = (value: string) => {
    const newValue = value === "بدون فئة عمرية" ? "" : value
    setTopic((prev) => ({ ...prev, age_group: newValue }))
  }

  const handleFeaturedImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFeaturedImage(file)

      // Create a preview URL
      const previewUrl = URL.createObjectURL(file)
      setPreviewFeaturedImage(previewUrl)
    }
  }

  const handleMediaFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      setMediaFiles(files)

      // Create preview URLs
      const previewUrls = files.map((file) => URL.createObjectURL(file))
      setPreviewMediaUrls(previewUrls)
    }
  }

  const handleAddTag = () => {
    if (currentTag && !topic.tags.includes(currentTag)) {
      setTopic((prev) => ({ ...prev, tags: [...prev.tags, currentTag] }))
      setCurrentTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTopic((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const uploadImages = async () => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      let featuredImageUrl = topic.featured_image_url
      let mediaUrls = [...(topic.media_urls || [])]

      // Upload new featured image if selected
      if (featuredImage) {
        setUploadProgress(10)
        setUpdateStatus("جاري رفع الصورة الرئيسية...")

        const { data: featuredData, error: featuredError } = await supabase.storage
          .from("uploads")
          .upload(`featured-images/${Date.now()}-${featuredImage.name}`, featuredImage, {
            cacheControl: "0",
            upsert: true,
          })

        if (featuredError) {
          throw new Error(`فشل في رفع الصورة الرئيسية: ${featuredError.message}`)
        }

        featuredImageUrl = featuredData.path
        setUploadProgress(50)
      }

      // Upload new media files if selected
      if (mediaFiles.length > 0) {
        setUpdateStatus("جاري رفع الوسائط المتعددة...")
        mediaUrls = [] // Replace existing media

        let progress = 50
        const progressIncrement = 50 / mediaFiles.length

        for (const file of mediaFiles) {
          const { data: mediaData, error: mediaError } = await supabase.storage
            .from("uploads")
            .upload(`topic-media/${Date.now()}-${file.name}`, file, {
              cacheControl: "0",
              upsert: true,
            })

          if (mediaError) {
            throw new Error(`فشل في رفع الوسائط: ${mediaError.message}`)
          }

          mediaUrls.push(mediaData.path)
          progress += progressIncrement
          setUploadProgress(Math.min(progress, 95))
        }
      }

      setUploadProgress(100)
      return { featuredImageUrl, mediaUrls }
    } catch (error) {
      console.error("Error uploading images:", error)
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAdmin) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك صلاحية تعديل المواضيع",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setUpdateStatus("جاري التحديث...")

    try {
      // First upload any new images
      let featuredImageUrl = topic.featured_image_url
      let mediaUrls = [...(topic.media_urls || [])]

      if (featuredImage || mediaFiles.length > 0) {
        try {
          const uploadResult = await uploadImages()
          featuredImageUrl = uploadResult.featuredImageUrl
          mediaUrls = uploadResult.mediaUrls
        } catch (uploadError) {
          setUpdateStatus(`فشل في رفع الصور: ${(uploadError as Error).message}`)
          toast({
            title: "خطأ",
            description: `فشل في رفع الصور: ${(uploadError as Error).message}`,
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
      }

      setUpdateStatus("جاري تحديث بيانات الموضوع...")

      // Use the direct update API with service role
      const response = await fetch("/api/topics/direct-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: topic.id,
          title: topic.title,
          content: topic.content,
          category: topic.category,
          age_group: topic.age_group,
          sorting: topic.sorting,
          is_hot: topic.is_hot,
          is_sticky: topic.is_sticky,
          featured_image_url: featuredImageUrl,
          media_urls: mediaUrls,
          tags: topic.tags,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update topic")
      }

      setUpdateStatus("تم التحديث بنجاح! جاري إعادة التوجيه...")

      toast({
        title: "تم التحديث",
        description: "تم تحديث الموضوع بنجاح",
      })

      // Force a complete page reload to the topic page
      setTimeout(() => {
        window.location.href = `/community/topic/${topic.id}?t=${new Date().getTime()}`
      }, 2000)
    } catch (error) {
      console.error("Error updating topic:", error)
      setUpdateStatus("فشل التحديث: " + (error as Error).message)

      toast({
        title: "خطأ",
        description: "فشل في تحديث الوضوع: " + (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!isAdmin) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك صلاحية حذف المواضيع",
        variant: "destructive",
      })
      return
    }

    if (!confirm("هل أنت متأكد من حذف هذا الموضوع؟ سيتم حذف جميع التعليقات والوسائط المرتبطة به.")) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/topics/${topic.id}/delete`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete topic")
      }

      toast({
        title: "تم الحذف",
        description: "تم حذف الموضوع وجميع البيانات المرتبطة به بنجاح",
      })

      router.push("/community")
    } catch (error) {
      console.error("Error deleting topic:", error)
      toast({
        title: "خطأ",
        description: "فشل في حذف الموضوع: " + (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAdmin) {
    return null // Don't render anything if not admin (will redirect)
  }

  return (
    <div className="container mx-auto py-8 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="flex items-center gap-2" asChild>
          <Link href="/community">
            <ArrowRight className="h-4 w-4" />
            العودة إلى المجتمع
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">تعديل الموضوع</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">عنوان الموضوع</Label>
                <Input
                  id="title"
                  name="title"
                  value={topic.title}
                  onChange={handleInputChange}
                  required
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">محتوى الموضوع</Label>
                <Textarea
                  id="content"
                  name="content"
                  value={topic.content}
                  onChange={handleInputChange}
                  required
                  className="text-right min-h-[200px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">الفئة</Label>
                <Select value={topic.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger id="category" className="text-right">
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sorting">التصنيف</Label>
                <Select value={topic.sorting || "بدون تصنيف"} onValueChange={handleSortingChange}>
                  <SelectTrigger id="sorting" className="text-right">
                    <SelectValue placeholder="اختر التصنيف" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortingOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="age_group">الفئة العمرية</Label>
                <Select value={topic.age_group || "بدون فئة عمرية"} onValueChange={handleAgeGroupChange}>
                  <SelectTrigger id="age_group" className="text-right">
                    <SelectValue placeholder="اختر الفئة العمرية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="بدون فئة عمرية">بدون فئة عمرية</SelectItem>
                    {ageGroups.map((ageGroup) => (
                      <SelectItem key={ageGroup} value={ageGroup}>
                        {ageGroup}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">الوسوم</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    className="text-right"
                    placeholder="أدخل وسماً"
                  />
                  <Button type="button" onClick={handleAddTag}>
                    إضافة
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {topic.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag} &#x2715;
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="featured_image">الصورة الرئيسية</Label>
                <Input id="featured_image" type="file" accept="image/*" onChange={handleFeaturedImageChange} />
                {previewFeaturedImage && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-1">معاينة الصورة الرئيسية:</p>
                    <img
                      src={previewFeaturedImage || "/placeholder.svg"}
                      alt="معاينة الصورة الرئيسية"
                      className="max-h-40 rounded-md border"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="media_files">الوسائط المتعددة</Label>
                <Input
                  id="media_files"
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleMediaFilesChange}
                  multiple
                />
                {previewMediaUrls.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-1">معاينة الوسائط:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {previewMediaUrls.map((url, index) => (
                        <div key={index} className="relative">
                          <img
                            src={url || "/placeholder.svg"}
                            alt={`معاينة الوسائط ${index + 1}`}
                            className="h-24 w-full object-cover rounded-md border"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="is_sticky"
                    checked={topic.is_sticky}
                    onCheckedChange={(checked) => handleCheckboxChange("is_sticky", checked as boolean)}
                  />
                  <Label htmlFor="is_sticky">تثبيت الموضوع</Label>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="is_hot"
                    checked={topic.is_hot}
                    onCheckedChange={(checked) => handleCheckboxChange("is_hot", checked as boolean)}
                  />
                  <Label htmlFor="is_hot">موضوع ساخن</Label>
                </div>
              </div>

              {isUploading && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">جاري رفع الصور: {uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}

              {updateStatus && (
                <div
                  className={`p-3 rounded-md text-center font-medium ${
                    updateStatus.includes("فشل")
                      ? "bg-red-100 text-red-800"
                      : updateStatus.includes("تم")
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {updateStatus}
                </div>
              )}
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting || isLoading}>
            <Trash className="ml-2 h-4 w-4" />
            حذف الموضوع
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/community")} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || isLoading || isUploading}
              className="relative"
            >
              {isSubmitting || isUploading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  {isUploading ? "جاري الرفع..." : "جاري الحفظ..."}
                </>
              ) : (
                <>
                  <Save className="ml-2 h-4 w-4" />
                  حفظ التغييرات
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

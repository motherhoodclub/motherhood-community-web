"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Download, Eye, FileText, ExternalLink, ArrowLeft, Edit, Trash2 } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"
import { formatArabicDate } from "@/lib/date-utils"
import Link from "next/link"

interface DownloadableFile {
  id: string
  title: string
  description: string
  featured_image_url: string | null
  file_url: string | null
  file_drive_link: string | null
  file_type: string | null
  file_size: number | null
  download_count: number
  created_at: string
  user_profiles?: {
    username: string
    avatar_url: string | null
  }
}

export default function DownloadableFileDetailsPage() {
  const [file, setFile] = useState<DownloadableFile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const params = useParams()
  const router = useRouter()
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

      if (user) {
        const { data: userProfile } = await supabase.from("user_profiles").select("is_admin").eq("id", user.id).single()

        setIsAdmin(!!userProfile?.is_admin)
      }
    } catch (error) {
      console.error("Error checking admin status:", error)
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

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!file) return

    setIsDownloading(true)

    try {
      // Increment download count first
      await fetch(`/api/downloadable-files/${file.id}/download`, {
        method: "POST",
      })

      if (file.file_url) {
        const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${file.file_url}`

        // Mobile-first approach: fetch the file and create blob URL
        try {
          const response = await fetch(fileUrl)
          const blob = await response.blob()
          const blobUrl = window.URL.createObjectURL(blob)

          // Create download link
          const link = document.createElement("a")
          link.href = blobUrl
          link.download = file.title || "download"
          link.style.display = "none"

          // Add to DOM, click, and remove
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)

          // Clean up blob URL
          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100)
        } catch (fetchError) {
          // Fallback: direct window.open for mobile
          console.log("Fetch failed, using fallback method")
          window.location.href = fileUrl
        }
      } else if (file.file_drive_link) {
        window.open(file.file_drive_link, "_blank")
      }

      // Update download count in UI
      setFile((prev) => (prev ? { ...prev, download_count: prev.download_count + 1 } : null))

      toast({
        title: "تم بنجاح",
        description: "بدأ تحميل الملف",
      })
    } catch (error) {
      console.error("Error downloading file:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل الملف",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDelete = async () => {
    if (!file || !confirm("هل أنت متأكد من حذف هذا الملف؟")) return

    try {
      const response = await fetch(`/api/downloadable-files/${file.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete file")
      }

      toast({
        title: "تم بنجاح",
        description: "تم حذف الملف بنجاح",
      })

      router.push("/community/downloadable-files")
    } catch (error) {
      console.error("Error deleting file:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الملف",
        variant: "destructive",
      })
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return ""
    const sizes = ["بايت", "كيلوبايت", "ميجابايت", "جيجابايت"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
  }

  const getFileTypeIcon = (fileType: string | null) => {
    if (!fileType) return <FileText className="h-8 w-8" />

    if (fileType.includes("pdf")) return "📄"
    if (fileType.includes("word") || fileType.includes("doc")) return "📝"
    if (fileType.includes("excel") || fileType.includes("sheet")) return "📊"
    if (fileType.includes("powerpoint") || fileType.includes("presentation")) return "📊"
    return <FileText className="h-8 w-8" />
  }

  const canPreview = (fileType: string | null) => {
    return fileType?.includes("pdf") || false
  }

  const getPreviewUrl = (fileUrl: string) => {
    const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${fileUrl}`
    return `https://docs.google.com/viewer?url=${encodeURIComponent(baseUrl)}&embedded=true`
  }

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!file) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">الملف غير موجود</h3>
          <p className="text-muted-foreground mb-4">لم يتم العثور على الملف المطلوب</p>
          <Button asChild>
            <Link href="/community/downloadable-files">
              <ArrowLeft className="h-4 w-4 ml-2" />
              العودة للملفات
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" asChild>
            <Link href="/community/downloadable-files">
              <ArrowLeft className="h-4 w-4 ml-2" />
              العودة للملفات
            </Link>
          </Button>

          {isAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/community/downloadable-files/${file.id}/edit`}>
                  <Edit className="h-4 w-4 ml-2" />
                  تعديل
                </Link>
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 ml-2" />
                حذف
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Preview/Image */}
            <Card>
              <CardContent className="p-0">
                {file.featured_image_url ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${file.featured_image_url}`}
                    alt={file.title}
                    className="w-full h-64 object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="w-full h-64 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-t-lg flex items-center justify-center">
                    <div className="text-8xl">{getFileTypeIcon(file.file_type)}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* File Details */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2 text-right">{file.title}</CardTitle>
                    {file.description && (
                      <CardDescription className="text-base text-right">{file.description}</CardDescription>
                    )}
                  </div>
                  <Badge variant="secondary" className="ml-4">
                    {file.file_type?.split("/")[1]?.toUpperCase() || "ملف"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <Separator />

                {/* File Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-right">
                    <span className="font-medium">عدد التحميلات:</span>
                    <span className="mr-2">{file.download_count}</span>
                  </div>
                  {file.file_size && (
                    <div className="text-right">
                      <span className="font-medium">حجم الملف:</span>
                      <span className="mr-2">{formatFileSize(file.file_size)}</span>
                    </div>
                  )}
                  <div className="text-right">
                    <span className="font-medium">تاريخ الإضافة:</span>
                    <span className="mr-2">{formatArabicDate(file.created_at)}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">أضيف بواسطة:</span>
                    <span className="mr-2">مشرف</span>
                  </div>
                </div>

                <Separator />

                {/* Author Info */}
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>م</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">مشرف</p>
                    <p className="text-sm text-muted-foreground">مشرف</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PDF Preview */}
            {canPreview(file.file_type) && file.file_url && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    معاينة الملف
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <iframe
                    src={getPreviewUrl(file.file_url)}
                    className="w-full h-96 border rounded-lg"
                    title="File Preview"
                    frameBorder="0"
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Download Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center">تحميل الملف</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleDownload} disabled={isDownloading} className="w-full" size="lg">
                  {isDownloading ? (
                    "جاري التحميل..."
                  ) : (
                    <>
                      <Download className="h-5 w-5 ml-2" />
                      تحميل الملف
                    </>
                  )}
                </Button>

                {file.file_drive_link && (
                  <Button variant="outline" asChild className="w-full bg-transparent">
                    <a href={file.file_drive_link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 ml-2" />
                      فتح في متصفح جديد
                    </a>
                  </Button>
                )}

                <div className="text-center text-sm text-muted-foreground">
                  تم تحميل هذا الملف {file.download_count} مرة
                </div>
              </CardContent>
            </Card>

            {/* File Stats */}
            <Card>
              <CardHeader>
                <CardTitle>إحصائيات الملف</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>عدد التحميلات</span>
                  <span className="font-medium">{file.download_count}</span>
                </div>
                {file.file_size && (
                  <div className="flex justify-between">
                    <span>حجم الملف</span>
                    <span className="font-medium">{formatFileSize(file.file_size)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>نوع الملف</span>
                  <span className="font-medium">{file.file_type?.split("/")[1]?.toUpperCase() || "غير محدد"}</span>
                </div>
                <div className="flex justify-between">
                  <span>تاريخ الإضافة</span>
                  <span className="font-medium">{formatArabicDate(file.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Download, FileText, Plus, Eye } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"
import { formatArabicDate } from "@/lib/date-utils"

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
  user_profiles: {
    username: string
    avatar_url: string | null
  }
}

export default function DownloadableFilesPage() {
  const [files, setFiles] = useState<DownloadableFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    checkAdminStatus()
    fetchFiles()
  }, [currentPage])

  const checkAdminStatus = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: userProfile } = await supabase.from("user_profiles").select("is_admin").eq("id", user.id).single()

        const adminStatus =
          userProfile?.is_admin === true ||
          userProfile?.is_admin === "true" ||
          userProfile?.is_admin === 1 ||
          userProfile?.is_admin === "1"

        setIsAdmin(adminStatus)
      }
    } catch (error) {
      console.error("Error checking admin status:", error)
    }
  }

  const fetchFiles = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/downloadable-files?page=${currentPage}&limit=12`)
      const data = await response.json()

      if (response.ok) {
        setFiles(data.files)
        setTotalPages(data.totalPages)
      } else {
        toast({
          title: "خطأ",
          description: "فشل في تحميل الملفات",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching files:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل الملفات",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return ""
    const sizes = ["بايت", "كيلوبايت", "ميجابايت", "جيجابايت"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
  }

  const getFileTypeIcon = (fileType: string | null) => {
    if (!fileType) return <FileText className="h-5 w-5" />

    if (fileType.includes("pdf")) return "📄"
    if (fileType.includes("word") || fileType.includes("doc")) return "📝"
    if (fileType.includes("excel") || fileType.includes("sheet")) return "📊"
    if (fileType.includes("powerpoint") || fileType.includes("presentation")) return "📊"
    return <FileText className="h-5 w-5" />
  }

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">ملفات قابلة للتحميل</h1>
            <p className="text-muted-foreground mt-2">مجموعة من الملفات والموارد المفيدة</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">ملفات قابلة للتحميل</h1>
          <p className="text-muted-foreground mt-2">مجموعة من الملفات والموارد المفيدة للتحميل</p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/community/downloadable-files/new">
              <Plus className="h-4 w-4 ml-2" />
              إضافة ملف جديد
            </Link>
          </Button>
        )}
      </div>

      {files.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">لا توجد ملفات متاحة</h3>
          <p className="text-muted-foreground">لم يتم رفع أي ملفات بعد</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {files.map((file) => (
              <Card key={file.id} className="group hover:shadow-lg transition-shadow duration-200">
                <div className="relative">
                  {file.featured_image_url ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${file.featured_image_url}`}
                      alt={file.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-t-lg flex items-center justify-center">
                      <div className="text-6xl">{getFileTypeIcon(file.file_type)}</div>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-white/90 text-gray-800">
                      {file.file_type?.split("/")[1]?.toUpperCase() || "ملف"}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="pb-2">
                  <CardTitle className="line-clamp-2 text-right">{file.title}</CardTitle>
                  {file.description && (
                    <CardDescription className="line-clamp-2 text-right">{file.description}</CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={file.user_profiles?.avatar_url || ""} />
                        <AvatarFallback className="text-xs">{file.user_profiles?.username?.[0] || "م"}</AvatarFallback>
                      </Avatar>
                      <span>{file.user_profiles?.username || "مجهول"}</span>
                    </div>
                    <span>{formatArabicDate(file.created_at)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        <span>{file.download_count}</span>
                      </div>
                      {file.file_size && (
                        <span className="text-muted-foreground">{formatFileSize(file.file_size)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/community/downloadable-files/${file.id}`}>
                        <Eye className="h-4 w-4 ml-2" />
                        عرض التفاصيل
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                السابق
              </Button>
              <span className="flex items-center px-4">
                صفحة {currentPage} من {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                التالي
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

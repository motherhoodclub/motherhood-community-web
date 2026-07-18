"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, GraduationCap, Lock, PlayCircle, FileDown, Sparkles, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSubscription } from "@/context/subscription-context"
import { UpgradeCard } from "@/components/tier-gate"
import { videoEmbedUrl, type CourseDetail, type CourseLesson } from "@/lib/courses"
import { cn } from "@/lib/utils"

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { canAccess } = useSubscription()
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [activeLesson, setActiveLesson] = useState<CourseLesson | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEnrolling, setIsEnrolling] = useState(false)

  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/courses/${params.id}`)
      if (!res.ok) throw new Error("not found")
      const data: CourseDetail = await res.json()
      setCourse(data)
      // Preselect the first watchable lesson.
      const firstPlayable = data.sections.flatMap((s) => s.lessons).find((l) => l.video_url)
      setActiveLesson(firstPlayable ?? null)
    } catch {
      toast({ title: "خطأ", description: "لم يتم العثور على الدورة", variant: "destructive" })
      router.push("/community/courses")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (params.id) fetchCourse()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const handleEnroll = async () => {
    setIsEnrolling(true)
    try {
      const res = await fetch(`/api/courses/${params.id}/enroll`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "failed")
      toast({ title: "تم فتح الدورة", description: "يمكنك الآن مشاهدة جميع الدروس." })
      await fetchCourse()
    } catch (e) {
      toast({
        title: "تعذّر فتح الدورة",
        description: e instanceof Error ? e.message : "حدث خطأ",
        variant: "destructive",
      })
    } finally {
      setIsEnrolling(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container py-8 max-w-6xl">
        <Skeleton className="h-8 w-40 mb-6" />
        <Skeleton className="h-72 w-full rounded-xl mb-6" />
        <Skeleton className="h-10 w-2/3 mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!course) return null

  const tierEligible = canAccess(course.min_tier)
  const creditsLeft = course.creditsRemaining // null => unlimited (admin)
  const hasCredits = creditsLeft === null || (creditsLeft ?? 0) > 0
  const canUnlockWithCredit = !course.hasAccess && course.requires_credit && tierEligible && hasCredits

  return (
    <div className="container py-8 max-w-6xl">
      <Button variant="ghost" size="sm" className="gap-1 mb-6" onClick={() => router.push("/community/courses")}>
        <ArrowRight className="h-4 w-4" />
        <span>العودة إلى الدورات</span>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Player or cover */}
          {course.hasAccess && activeLesson?.video_url ? (
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow">
              <iframe
                src={videoEmbedUrl(activeLesson.video_url) ?? undefined}
                title={activeLesson.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl shadow">
              {course.cover_image_url ? (
                <img src={course.cover_image_url} alt={course.title} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center">
                  <GraduationCap className="h-16 w-16 text-primary/40" />
                </div>
              )}
              {!course.hasAccess && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Lock className="h-12 w-12 text-white/90" />
                </div>
              )}
            </div>
          )}

          <div>
            <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
            {activeLesson && course.hasAccess && (
              <p className="text-primary font-medium mb-2">{activeLesson.title}</p>
            )}
            {course.description && <p className="text-muted-foreground leading-relaxed">{course.description}</p>}
            {activeLesson?.description && course.hasAccess && (
              <p className="text-sm text-muted-foreground mt-3 whitespace-pre-line">{activeLesson.description}</p>
            )}
            {course.hasAccess && activeLesson?.attachment_url && (
              <Button asChild variant="outline" size="sm" className="mt-4 gap-2">
                <a href={activeLesson.attachment_url} target="_blank" rel="noopener noreferrer">
                  <FileDown className="h-4 w-4" />
                  تحميل ملف الدرس
                </a>
              </Button>
            )}
          </div>

          {/* Access gate (when locked) */}
          {!course.hasAccess && (
            <div>
              {canUnlockWithCredit ? (
                <Card className="border-amber-200 bg-amber-50/60">
                  <CardContent className="flex flex-col items-center text-center gap-3 py-8">
                    <div className="rounded-full bg-amber-100 p-3">
                      <Sparkles className="h-6 w-6 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-semibold">افتحي هذه الدورة برصيدك</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      {creditsLeft === null
                        ? "لديك وصول كامل."
                        : `لديك ${creditsLeft} من رصيد الدورات. سيتم خصم رصيد واحد لفتح هذه الدورة نهائياً.`}
                    </p>
                    <Button onClick={handleEnroll} disabled={isEnrolling} className="mt-2 gap-2">
                      {isEnrolling ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                      فتح الدورة الآن
                    </Button>
                  </CardContent>
                </Card>
              ) : !tierEligible ? (
                <UpgradeCard
                  minTier={course.min_tier}
                  description="الدورات المسجلة متاحة ضمن الباقة السنوية. رقّي اشتراكك للوصول إليها."
                />
              ) : (
                <Card className="border-amber-200 bg-amber-50/60">
                  <CardContent className="flex flex-col items-center text-center gap-3 py-8">
                    <Lock className="h-6 w-6 text-amber-600" />
                    <h3 className="text-lg font-semibold">لا يوجد رصيد دورات متاح</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      لقد استخدمت كامل رصيد الدورات الخاص بباقتك. تواصلي معنا إذا رغبتِ بالمزيد.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Sidebar: curriculum */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">محتوى الدورة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {course.sections.length === 0 && (
                <p className="text-sm text-muted-foreground">لم تتم إضافة دروس بعد.</p>
              )}
              {course.sections.map((section) => (
                <div key={section.id} className="space-y-1">
                  {section.title && <p className="font-semibold text-sm">{section.title}</p>}
                  {section.lessons.map((lesson) => {
                    const isActive = activeLesson?.id === lesson.id
                    const playable = course.hasAccess && !!lesson.video_url
                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        onClick={() => playable && setActiveLesson(lesson)}
                        disabled={!playable}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2 py-2 text-right text-sm transition-colors",
                          isActive ? "bg-primary/10 text-primary" : "hover:bg-muted",
                          !playable && "cursor-not-allowed opacity-70",
                        )}
                      >
                        {lesson.locked ? (
                          <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : isActive ? (
                          <PlayCircle className="h-4 w-4 shrink-0 text-primary" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className="flex-1 line-clamp-2">{lesson.title}</span>
                        {lesson.duration && <span className="text-xs text-muted-foreground">{lesson.duration}</span>}
                      </button>
                    )
                  })}
                </div>
              ))}
            </CardContent>
          </Card>

          {course.requires_credit && !course.hasAccess && creditsLeft !== null && (
            <Badge variant="outline" className="w-full justify-center py-2 gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              رصيد الدورات المتاح: {creditsLeft}
            </Badge>
          )}

          <Button asChild variant="ghost" className="w-full" size="sm">
            <Link href="/community/subscription">إدارة الاشتراك</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

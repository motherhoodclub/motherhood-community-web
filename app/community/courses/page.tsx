"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { GraduationCap, Lock, Sparkles, PlayCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { TierBadge } from "@/components/tier-gate"
import type { Course } from "@/lib/courses"

type CourseCard = Course & { enrolled: boolean; hasAccess: boolean }

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseCard[]>([])
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch("/api/courses")
        const data = await res.json()
        if (res.ok) {
          setCourses(data.courses ?? [])
          setCreditsRemaining(data.creditsRemaining)
        } else {
          toast({ title: "خطأ", description: "فشل في تحميل الدورات", variant: "destructive" })
        }
      } catch {
        toast({ title: "خطأ", description: "حدث خطأ أثناء تحميل الدورات", variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }
    fetchCourses()
  }, [toast])

  const unlimited = creditsRemaining === null // admin
  const showCredits = unlimited || (creditsRemaining ?? 0) >= 0

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            الدورات المسجلة
          </h1>
          <p className="text-muted-foreground mt-2">دورات تدريبية متكاملة لمرافقتك في رحلتك التربوية</p>
        </div>
        {showCredits && !unlimited && (
          <Badge variant="outline" className="text-sm py-2 px-4 gap-2 self-start">
            <Sparkles className="h-4 w-4 text-amber-500" />
            رصيد الدورات المتاح: {creditsRemaining}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-44 bg-gray-200 rounded-t-lg" />
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16">
          <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">لا توجد دورات متاحة حالياً</h3>
          <p className="text-muted-foreground">سيتم إضافة الدورات قريباً.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link key={course.id} href={`/community/courses/${course.id}`}>
              <Card className="group h-full hover:shadow-lg transition-shadow duration-200 overflow-hidden">
                <div className="relative h-44 w-full overflow-hidden">
                  {course.cover_image_url ? (
                    <img
                      src={course.cover_image_url}
                      alt={course.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center">
                      <GraduationCap className="h-12 w-12 text-primary/40" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {course.hasAccess ? (
                      <Badge className="bg-green-500/90 text-white gap-1">
                        <PlayCircle className="h-3 w-3" />
                        متاحة
                      </Badge>
                    ) : (
                      <TierBadge minTier={course.min_tier} />
                    )}
                  </div>
                  {!course.published && (
                    <Badge className="absolute top-2 left-2 bg-gray-700 text-white">مسودة</Badge>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-2 text-right">{course.title}</CardTitle>
                  {course.description && (
                    <CardDescription className="line-clamp-2 text-right">{course.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {course.hasAccess ? (
                    <Button variant="outline" className="w-full" size="sm">
                      متابعة الدورة
                    </Button>
                  ) : course.requires_credit ? (
                    <Button variant="outline" className="w-full gap-1 text-amber-600 border-amber-200" size="sm">
                      <Lock className="h-3 w-3" />
                      افتحيها برصيدك
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full gap-1 text-amber-600 border-amber-200" size="sm">
                      <Lock className="h-3 w-3" />
                      ترقية للوصول
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

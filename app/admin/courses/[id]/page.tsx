"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowRight, Plus, Pencil, Trash2, Loader2, GripVertical, PlayCircle } from "lucide-react"
import type { SectionWithLessons, CourseLesson } from "@/lib/courses"

const emptyLesson = {
  id: null as string | null,
  section_id: null as string | null,
  title: "",
  description: "",
  video_url: "",
  duration: "",
  attachment_url: "",
  display_order: 0,
}

export default function AdminCourseContentPage() {
  const params = useParams()
  const courseId = params.id as string
  const { toast } = useToast()
  const [title, setTitle] = useState("")
  const [sections, setSections] = useState<SectionWithLessons[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newSection, setNewSection] = useState("")
  const [lesson, setLesson] = useState<typeof emptyLesson>(emptyLesson)
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const fetchCourse = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTitle(data.title)
      setSections(data.sections ?? [])
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل الدورة", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCourse()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

  // Sections -----------------------------------------------------------------
  const addSection = async () => {
    if (!newSection.trim()) return
    try {
      const res = await fetch("/api/admin/courses/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: courseId, title: newSection, display_order: sections.length }),
      })
      if (!res.ok) throw new Error()
      setNewSection("")
      fetchCourse()
    } catch {
      toast({ title: "خطأ", description: "فشل إضافة القسم", variant: "destructive" })
    }
  }

  const renameSection = async (section: SectionWithLessons) => {
    const title = prompt("اسم القسم:", section.title)
    if (title === null) return
    await fetch("/api/admin/courses/sections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: section.id, title }),
    })
    fetchCourse()
  }

  const deleteSection = async (id: string) => {
    if (!confirm("حذف هذا القسم وكل دروسه؟")) return
    await fetch(`/api/admin/courses/sections?id=${id}`, { method: "DELETE" })
    fetchCourse()
  }

  // Lessons ------------------------------------------------------------------
  const openNewLesson = (sectionId: string, order: number) => {
    setLesson({ ...emptyLesson, section_id: sectionId, display_order: order })
    setLessonDialogOpen(true)
  }

  const openEditLesson = (l: CourseLesson) => {
    setLesson({
      id: l.id,
      section_id: l.section_id,
      title: l.title,
      description: l.description ?? "",
      video_url: l.video_url ?? "",
      duration: l.duration ?? "",
      attachment_url: l.attachment_url ?? "",
      display_order: l.display_order,
    })
    setLessonDialogOpen(true)
  }

  const saveLesson = async () => {
    if (!lesson.title.trim()) {
      toast({ title: "خطأ", description: "عنوان الدرس مطلوب", variant: "destructive" })
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch("/api/admin/courses/lessons", {
        method: lesson.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lesson.id ? lesson : { ...lesson, course_id: courseId }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setLessonDialogOpen(false)
      fetchCourse()
    } catch (e) {
      toast({ title: "خطأ", description: e instanceof Error ? e.message : "فشل حفظ الدرس", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const deleteLesson = async (id: string) => {
    if (!confirm("حذف هذا الدرس؟")) return
    await fetch(`/api/admin/courses/lessons?id=${id}`, { method: "DELETE" })
    fetchCourse()
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/courses">
              <ArrowRight className="h-4 w-4 ml-1" />
              الدورات
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{isLoading ? "..." : title}</h1>
        </div>
      </div>

      {/* Add section */}
      <div className="flex gap-2 max-w-md">
        <Input
          value={newSection}
          onChange={(e) => setNewSection(e.target.value)}
          placeholder="اسم قسم جديد (مثال: الوحدة الأولى)"
          className="text-right"
          onKeyDown={(e) => e.key === "Enter" && addSection()}
        />
        <Button onClick={addSection}>
          <Plus className="h-4 w-4 ml-1" />
          إضافة قسم
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">جاري التحميل...</p>
      ) : sections.length === 0 ? (
        <p className="text-muted-foreground">لا توجد أقسام بعد. أضف قسماً لتبدأ بإضافة الدروس.</p>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => (
            <Card key={section.id}>
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  {section.title || "دروس"}
                </CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => renameSection(section)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteSection(section.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {section.lessons.length === 0 && (
                  <p className="text-sm text-muted-foreground">لا توجد دروس في هذا القسم.</p>
                )}
                {section.lessons.map((l) => (
                  <div key={l.id} className="flex items-center justify-between rounded-md border p-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <PlayCircle className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">{l.title}</span>
                      {l.duration && <span className="text-xs text-muted-foreground">{l.duration}</span>}
                      {!l.video_url && <span className="text-xs text-amber-600">(بدون فيديو)</span>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => openEditLesson(l)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteLesson(l.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => openNewLesson(section.id, section.lessons.length)}
                >
                  <Plus className="h-4 w-4 ml-1" />
                  إضافة درس
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Lesson dialog */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{lesson.id ? "تعديل الدرس" : "إضافة درس"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>عنوان الدرس</Label>
              <Input
                value={lesson.title}
                onChange={(e) => setLesson((p) => ({ ...p, title: e.target.value }))}
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label>رابط الفيديو (YouTube / Vimeo)</Label>
              <Input
                value={lesson.video_url}
                onChange={(e) => setLesson((p) => ({ ...p, video_url: e.target.value }))}
                placeholder="https://youtu.be/... أو https://vimeo.com/..."
                dir="ltr"
                className="text-left"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>المدة</Label>
                <Input
                  value={lesson.duration}
                  onChange={(e) => setLesson((p) => ({ ...p, duration: e.target.value }))}
                  placeholder="12:30"
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label>الترتيب</Label>
                <Input
                  type="number"
                  value={lesson.display_order}
                  onChange={(e) => setLesson((p) => ({ ...p, display_order: Number(e.target.value) }))}
                  className="text-right"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>وصف الدرس (اختياري)</Label>
              <Textarea
                value={lesson.description}
                onChange={(e) => setLesson((p) => ({ ...p, description: e.target.value }))}
                className="text-right"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>رابط ملف مرفق (اختياري)</Label>
              <Input
                value={lesson.attachment_url}
                onChange={(e) => setLesson((p) => ({ ...p, attachment_url: e.target.value }))}
                dir="ltr"
                className="text-left"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveLesson} disabled={isSaving}>
              {isSaving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              حفظ
            </Button>
            <Button variant="outline" onClick={() => setLessonDialogOpen(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

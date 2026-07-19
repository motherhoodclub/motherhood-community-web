"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Pencil, Trash2, ListVideo, Loader2, Sparkles, Save } from "lucide-react"
import { MIN_TIER_OPTIONS } from "@/lib/entitlements"
import { TierBadge } from "@/components/tier-gate"
import type { Course } from "@/lib/courses"

type UserOption = { id: string; username: string | null; email: string | null }

type CourseRow = Course & { lesson_count: number }

const emptyCourse = {
  id: null as string | null,
  title: "",
  description: "",
  cover_image_url: "",
  min_tier: 3,
  requires_credit: true,
  published: false,
  display_order: 0,
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [current, setCurrent] = useState<typeof emptyCourse>(emptyCourse)
  const [isEditing, setIsEditing] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  // Bonus course credits (per user)
  const [users, setUsers] = useState<UserOption[]>([])
  const [creditUserId, setCreditUserId] = useState("")
  const [bonusCredits, setBonusCredits] = useState(0)
  const [enrolledCount, setEnrolledCount] = useState<number | null>(null)
  const [isSavingCredits, setIsSavingCredits] = useState(false)

  const fetchCourses = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/courses")
      const data = await res.json()
      if (res.ok) setCourses(data.courses ?? [])
      else throw new Error(data.error)
    } catch {
      toast({ title: "خطأ", description: "فشل في جلب الدورات", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(() => {})
  }, [])

  const selectCreditUser = async (userId: string) => {
    setCreditUserId(userId)
    setEnrolledCount(null)
    if (!userId) return
    try {
      const res = await fetch(`/api/admin/users/course-credits?user_id=${userId}`)
      const data = await res.json()
      if (res.ok) {
        setBonusCredits(data.bonus_course_credits ?? 0)
        setEnrolledCount(data.enrolled_count ?? 0)
      }
    } catch {
      /* ignore */
    }
  }

  const saveCredits = async () => {
    if (!creditUserId) return
    setIsSavingCredits(true)
    try {
      const res = await fetch("/api/admin/users/course-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: creditUserId, bonus_course_credits: bonusCredits }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: "تم بنجاح", description: "تم تحديث رصيد الدورات الإضافي" })
    } catch (e) {
      toast({ title: "خطأ", description: e instanceof Error ? e.message : "فشل الحفظ", variant: "destructive" })
    } finally {
      setIsSavingCredits(false)
    }
  }

  const openCreate = () => {
    setCurrent(emptyCourse)
    setIsEditing(false)
    setIsDialogOpen(true)
  }

  const openEdit = (course: CourseRow) => {
    setCurrent({
      id: course.id,
      title: course.title,
      description: course.description ?? "",
      cover_image_url: course.cover_image_url ?? "",
      min_tier: course.min_tier,
      requires_credit: course.requires_credit,
      published: course.published,
      display_order: course.display_order,
    })
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCurrent((prev) => ({ ...prev, cover_image_url: data.url }))
    } catch {
      toast({ title: "خطأ", description: "فشل رفع صورة الغلاف", variant: "destructive" })
    } finally {
      setIsUploading(false)
      e.target.value = ""
    }
  }

  const handleSave = async () => {
    if (!current.title.trim()) {
      toast({ title: "خطأ", description: "العنوان مطلوب", variant: "destructive" })
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch("/api/admin/courses", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(current),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: "تم بنجاح", description: isEditing ? "تم تحديث الدورة" : "تمت إضافة الدورة" })
      setIsDialogOpen(false)
      fetchCourses()
    } catch (e) {
      toast({ title: "خطأ", description: e instanceof Error ? e.message : "فشل الحفظ", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الدورة وكل دروسها؟")) return
    try {
      const res = await fetch(`/api/admin/courses?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast({ title: "تم بنجاح", description: "تم حذف الدورة" })
      fetchCourses()
    } catch {
      toast({ title: "خطأ", description: "فشل حذف الدورة", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">إدارة الدورات</h1>
        <Button onClick={openCreate}>إضافة دورة جديدة</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">العنوان</TableHead>
              <TableHead className="text-right">الدروس</TableHead>
              <TableHead className="text-right">الوصول</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  جاري التحميل...
                </TableCell>
              </TableRow>
            ) : courses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  لا توجد دورات بعد. أضف دورة جديدة.
                </TableCell>
              </TableRow>
            ) : (
              courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="text-right font-medium">{course.title}</TableCell>
                  <TableCell className="text-right">{course.lesson_count}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <TierBadge minTier={course.min_tier} />
                      {course.requires_credit && (
                        <Badge variant="outline" className="text-xs">
                          برصيد
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {course.published ? (
                      <Badge className="bg-green-500 text-white">منشورة</Badge>
                    ) : (
                      <Badge variant="secondary">مسودة</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild title="إدارة المحتوى">
                        <Link href={`/admin/courses/${course.id}`}>
                          <ListVideo className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(course)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(course.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Grant bonus course credits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-amber-500" />
            رصيد الدورات الإضافي
          </CardTitle>
          <CardDescription>
            امنح مشتركاً رصيد دورات إضافياً فوق رصيد باقته (الباقة السنوية = دورتان). يُستخدم عند "اختيار" الدورات.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 md:items-end">
            <div className="flex-1 space-y-2">
              <Label>المشترك</Label>
              <select
                value={creditUserId}
                onChange={(e) => selectCreditUser(e.target.value)}
                className="w-full h-10 rounded-md border bg-background px-3 text-right text-sm"
              >
                <option value="">اختر مشتركاً...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username || u.email || u.id}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-40 space-y-2">
              <Label>رصيد إضافي</Label>
              <Input
                type="number"
                min={0}
                value={bonusCredits}
                onChange={(e) => setBonusCredits(Number(e.target.value))}
                className="text-right"
                disabled={!creditUserId}
              />
            </div>
            <Button onClick={saveCredits} disabled={!creditUserId || isSavingCredits}>
              {isSavingCredits ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
              حفظ
            </Button>
          </div>
          {creditUserId && enrolledCount !== null && (
            <p className="text-xs text-muted-foreground mt-3">عدد الدورات التي فتحها هذا المشترك: {enrolledCount}</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>{isEditing ? "تعديل الدورة" : "إضافة دورة جديدة"}</DialogTitle>
            <DialogDescription>أدخل تفاصيل الدورة. تُدار الأقسام والدروس من صفحة إدارة المحتوى.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[65vh] overflow-y-auto px-1">
            <div className="space-y-2">
              <Label>العنوان</Label>
              <Input
                value={current.title}
                onChange={(e) => setCurrent((p) => ({ ...p, title: e.target.value }))}
                className="text-right"
                placeholder="عنوان الدورة"
              />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea
                value={current.description}
                onChange={(e) => setCurrent((p) => ({ ...p, description: e.target.value }))}
                className="text-right"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>صورة الغلاف</Label>
              <div className="flex items-center gap-3">
                {current.cover_image_url && (
                  <img src={current.cover_image_url} alt="غلاف" className="h-16 w-24 object-cover rounded border" />
                )}
                <Input type="file" accept="image/*" onChange={handleCoverUpload} disabled={isUploading} />
                {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>مستوى الوصول (الباقة)</Label>
                <select
                  value={current.min_tier}
                  onChange={(e) => setCurrent((p) => ({ ...p, min_tier: Number(e.target.value) }))}
                  className="w-full h-10 rounded-md border bg-background px-3 text-right text-sm"
                >
                  {MIN_TIER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>ترتيب العرض</Label>
                <Input
                  type="number"
                  value={current.display_order}
                  onChange={(e) => setCurrent((p) => ({ ...p, display_order: Number(e.target.value) }))}
                  className="text-right"
                />
              </div>
            </div>
            <div className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <Label>يتطلب رصيد دورة</Label>
                <p className="text-xs text-muted-foreground">إذا فُعّل، يخصم رصيد واحد من المشترك لفتح الدورة (اختيار المشترك).</p>
              </div>
              <Switch
                checked={current.requires_credit}
                onCheckedChange={(v) => setCurrent((p) => ({ ...p, requires_credit: v }))}
              />
            </div>
            <div className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <Label>منشورة</Label>
                <p className="text-xs text-muted-foreground">تظهر للمشتركين فقط عند التفعيل.</p>
              </div>
              <Switch
                checked={current.published}
                onCheckedChange={(v) => setCurrent((p) => ({ ...p, published: v }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              {isEditing ? "حفظ التغييرات" : "إضافة الدورة"}
            </Button>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

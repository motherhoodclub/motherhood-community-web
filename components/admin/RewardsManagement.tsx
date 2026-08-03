"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Gift, Plus, Pencil, Trash2, Check, X, Copy, RefreshCw } from "lucide-react"

type Reward = {
  id: string
  title: string
  description: string | null
  type: string
  cost_points: number
  discount_label: string | null
  stock: number | null
  valid_days: number | null
  active: boolean
  created_at: string
}

type Redemption = {
  id: string
  reward_id: string
  user_id: string
  user_name?: string
  cost_points: number
  code: string | null
  status: string
  created_at: string
  fulfilled_at: string | null
  expires_at: string | null
}

const TYPE_LABELS: Record<string, string> = {
  coupon: "كوبون خصم",
  present: "هدية",
  offer_code: "كود اشتراك",
  content: "محتوى حصري",
}

const STATUS_LABELS: Record<string, string> = {
  pending: "بانتظار التنفيذ",
  fulfilled: "تم التنفيذ",
  expired: "منتهي",
  cancelled: "ملغي",
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  fulfilled: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  expired: "bg-gray-400/15 text-gray-500 border-gray-400/30",
  cancelled: "bg-red-500/15 text-red-600 border-red-500/30",
}

const emptyForm = {
  id: "",
  title: "",
  description: "",
  type: "coupon",
  cost_points: 250,
  discount_label: "",
  stock: "" as string | number,
  valid_days: "" as string | number,
  active: true,
}

export function RewardsManagement({
  initialRewards,
  initialRedemptions,
}: {
  initialRewards: Reward[]
  initialRedemptions: Redemption[]
}) {
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const [rewards, setRewards] = useState<Reward[]>(initialRewards)
  const [redemptions, setRedemptions] = useState<Redemption[]>(initialRedemptions)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")

  const openNew = () => {
    setForm({ ...emptyForm })
    setDialogOpen(true)
  }

  const openEdit = (r: Reward) => {
    setForm({
      id: r.id,
      title: r.title,
      description: r.description || "",
      type: r.type,
      cost_points: r.cost_points,
      discount_label: r.discount_label || "",
      stock: r.stock ?? "",
      valid_days: r.valid_days ?? "",
      active: r.active,
    })
    setDialogOpen(true)
  }

  const saveReward = async () => {
    if (!form.title.trim()) {
      toast({ title: "خطأ", description: "أدخلي عنوان المكافأة", variant: "destructive" })
      return
    }
    setSaving(true)
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      type: form.type,
      cost_points: Number(form.cost_points) || 0,
      discount_label: form.discount_label.trim() || null,
      stock: form.stock === "" ? null : Number(form.stock),
      valid_days: form.valid_days === "" ? null : Number(form.valid_days),
      active: form.active,
    }
    try {
      if (form.id) {
        const { data, error } = await supabase
          .from("rewards")
          .update(payload)
          .eq("id", form.id)
          .select()
          .single()
        if (error) throw error
        setRewards((prev) => prev.map((r) => (r.id === form.id ? (data as Reward) : r)))
      } else {
        const { data, error } = await supabase.from("rewards").insert(payload).select().single()
        if (error) throw error
        setRewards((prev) => [data as Reward, ...prev])
      }
      setDialogOpen(false)
      toast({ title: "تم الحفظ" })
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const deleteReward = async (id: string) => {
    if (!confirm("حذف هذه المكافأة نهائياً؟")) return
    const { error } = await supabase.from("rewards").delete().eq("id", id)
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" })
      return
    }
    setRewards((prev) => prev.filter((r) => r.id !== id))
  }

  const toggleActive = async (r: Reward) => {
    const { error } = await supabase.from("rewards").update({ active: !r.active }).eq("id", r.id)
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" })
      return
    }
    setRewards((prev) => prev.map((x) => (x.id === r.id ? { ...x, active: !x.active } : x)))
  }

  const setRedemptionStatus = async (id: string, status: string) => {
    const { error } = await supabase.rpc("admin_set_redemption_status", { p_id: id, p_status: status })
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" })
      return
    }
    setRedemptions((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status, fulfilled_at: status === "fulfilled" ? new Date().toISOString() : r.fulfilled_at }
          : r
      )
    )
    toast({ title: "تم التحديث" })
  }

  const pendingCount = redemptions.filter((r) => r.status === "pending").length
  const filteredRedemptions =
    statusFilter === "all" ? redemptions : redemptions.filter((r) => r.status === statusFilter)

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("ar-SA-u-ca-gregory") : "—"

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="h-6 w-6" /> المكافآت والعروض
          </h3>
          <p className="text-muted-foreground">أنشئي العروض التي يستبدلها الأعضاء بنقاطهم، وتابعي طلبات التنفيذ.</p>
        </div>
      </div>

      <Tabs defaultValue="catalog">
        <TabsList>
          <TabsTrigger value="catalog">الكتالوج ({rewards.length})</TabsTrigger>
          <TabsTrigger value="redemptions">
            طلبات الاستبدال
            {pendingCount > 0 && (
              <Badge className="mr-2 bg-amber-500 text-white">{pendingCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ---------------- Catalog ---------------- */}
        <TabsContent value="catalog" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openNew} className="gap-2">
              <Plus className="h-4 w-4" /> مكافأة جديدة
            </Button>
          </div>

          {rewards.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                لا توجد مكافآت بعد. أضيفي أول عرض.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rewards.map((r) => (
                <Card key={r.id} className={r.active ? "" : "opacity-60"}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{r.title}</CardTitle>
                      <Badge variant="secondary">{TYPE_LABELS[r.type] || r.type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {r.description && <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge className="bg-primary/10 text-primary border-none">{r.cost_points} نقطة</Badge>
                      {r.discount_label && <Badge variant="outline">{r.discount_label}</Badge>}
                      <Badge variant="outline">
                        المخزون: {r.stock === null ? "غير محدود" : r.stock}
                      </Badge>
                      {r.valid_days && <Badge variant="outline">صلاحية {r.valid_days} يوم</Badge>}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Switch checked={r.active} onCheckedChange={() => toggleActive(r)} />
                        <span className="text-xs text-muted-foreground">{r.active ? "مفعّل" : "متوقف"}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(r)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteReward(r.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ---------------- Redemptions ---------------- */}
        <TabsContent value="redemptions" className="space-y-4">
          <div className="flex justify-end">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الطلبات</SelectItem>
                <SelectItem value="pending">بانتظار التنفيذ</SelectItem>
                <SelectItem value="fulfilled">تم التنفيذ</SelectItem>
                <SelectItem value="expired">منتهي</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">العضو</TableHead>
                    <TableHead className="text-right">الكود</TableHead>
                    <TableHead className="text-right">النقاط</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">إجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRedemptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        لا توجد طلبات
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRedemptions.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.user_name}</TableCell>
                        <TableCell>
                          {r.code ? (
                            <button
                              className="font-mono text-xs bg-muted px-2 py-1 rounded inline-flex items-center gap-1"
                              onClick={() => {
                                navigator.clipboard?.writeText(r.code!)
                                toast({ title: "تم نسخ الكود" })
                              }}
                            >
                              {r.code} <Copy className="h-3 w-3" />
                            </button>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>{r.cost_points}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{fmt(r.created_at)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={STATUS_COLORS[r.status]}>
                            {STATUS_LABELS[r.status] || r.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {r.status === "pending" ? (
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" className="gap-1"
                                onClick={() => setRedemptionStatus(r.id, "fulfilled")}>
                                <Check className="h-3 w-3" /> تنفيذ
                              </Button>
                              <Button size="sm" variant="ghost"
                                onClick={() => setRedemptionStatus(r.id, "cancelled")}>
                                <X className="h-3 w-3 text-red-500" />
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="ghost" className="gap-1"
                              onClick={() => setRedemptionStatus(r.id, "pending")}>
                              <RefreshCw className="h-3 w-3" /> إرجاع
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ---------------- Create/Edit dialog ---------------- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "تعديل المكافأة" : "مكافأة جديدة"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>العنوان</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="خصم ١٠٪ على استشارة" />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>النوع</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coupon">كوبون خصم</SelectItem>
                    <SelectItem value="present">هدية</SelectItem>
                    <SelectItem value="offer_code">كود اشتراك</SelectItem>
                    <SelectItem value="content">محتوى حصري</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>التكلفة (نقاط)</Label>
                <Input type="number" value={form.cost_points} onChange={(e) => setForm({ ...form, cost_points: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>وصف الخصم (اختياري)</Label>
              <Input value={form.discount_label} onChange={(e) => setForm({ ...form, discount_label: e.target.value })} placeholder="خصم ١٠٪" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>المخزون (فارغ = غير محدود)</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>صلاحية الكود (أيام)</Label>
                <Input type="number" value={form.valid_days} onChange={(e) => setForm({ ...form, valid_days: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <Label>مفعّل</Label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveReward} disabled={saving} className="w-full">
              {saving ? "جارٍ الحفظ…" : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

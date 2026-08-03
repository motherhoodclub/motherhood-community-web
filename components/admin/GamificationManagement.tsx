"use client"

import { useState, useMemo } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Trophy, Search, Plus, Minus, Award, Star, Pencil } from "lucide-react"

// Mirrors constants/points.ts + points_to_level() in the DB.
const LEVELS = [
  { min: 4000, title: "سفيرة النادي", emoji: "👑" },
  { min: 1500, title: "أم ملهمة", emoji: "🌟" },
  { min: 500, title: "أم متفاعلة", emoji: "⭐" },
  { min: 100, title: "أم نشيطة", emoji: "🌸" },
  { min: 0, title: "عضوة جديدة", emoji: "🌱" },
]
const levelFor = (p: number) => LEVELS.find((l) => p >= l.min) || LEVELS[LEVELS.length - 1]

type User = {
  id: string
  username: string | null
  avatar_url: string | null
  points: number
  is_admin: boolean
  badge_ids: string[]
}
type BadgeDef = {
  id: string
  name: string
  description: string | null
  icon: string | null
  sort_order: number
}

export function GamificationManagement({
  initialUsers,
  initialBadges,
}: {
  initialUsers: User[]
  initialBadges: BadgeDef[]
}) {
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const [users, setUsers] = useState<User[]>(initialUsers)
  const [badges, setBadges] = useState<BadgeDef[]>(initialBadges)
  const [search, setSearch] = useState("")

  // Points adjust dialog
  const [pointsUser, setPointsUser] = useState<User | null>(null)
  const [delta, setDelta] = useState("")
  const [reason, setReason] = useState("")

  // Badges dialog
  const [badgeUser, setBadgeUser] = useState<User | null>(null)

  // Badge-definition dialog
  const [badgeForm, setBadgeForm] = useState<BadgeDef | null>(null)

  const filtered = useMemo(
    () => users.filter((u) => (u.username || "").toLowerCase().includes(search.toLowerCase())),
    [users, search]
  )

  // ---- points ----
  const applyPoints = async (sign: 1 | -1) => {
    if (!pointsUser) return
    const amount = Number(delta) * sign
    if (!amount) return
    const { data, error } = await supabase.rpc("admin_adjust_points", {
      p_user: pointsUser.id,
      p_delta: amount,
      p_reason: reason || "admin",
    })
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" })
      return
    }
    const newPoints = Number(data)
    setUsers((prev) => prev.map((u) => (u.id === pointsUser.id ? { ...u, points: newPoints } : u)))
    toast({ title: "تم تعديل النقاط", description: `الرصيد الجديد: ${newPoints}` })
    setPointsUser(null)
    setDelta("")
    setReason("")
  }

  // ---- badges per user ----
  const toggleBadge = async (badgeId: string) => {
    if (!badgeUser) return
    const has = badgeUser.badge_ids.includes(badgeId)
    const rpc = has ? "admin_revoke_badge" : "admin_grant_badge"
    const { error } = await supabase.rpc(rpc, { p_user: badgeUser.id, p_badge: badgeId })
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" })
      return
    }
    const newIds = has
      ? badgeUser.badge_ids.filter((b) => b !== badgeId)
      : [...badgeUser.badge_ids, badgeId]
    const updated = { ...badgeUser, badge_ids: newIds }
    setBadgeUser(updated)
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
  }

  // ---- badge catalog ----
  const saveBadgeDef = async () => {
    if (!badgeForm || !badgeForm.id.trim() || !badgeForm.name.trim()) {
      toast({ title: "خطأ", description: "المعرّف والاسم مطلوبان", variant: "destructive" })
      return
    }
    const { error } = await supabase.rpc("admin_upsert_badge", {
      p_id: badgeForm.id.trim(),
      p_name: badgeForm.name.trim(),
      p_description: badgeForm.description || null,
      p_icon: badgeForm.icon || null,
      p_sort_order: badgeForm.sort_order || 0,
    })
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" })
      return
    }
    setBadges((prev) => {
      const exists = prev.some((b) => b.id === badgeForm.id)
      const next = exists ? prev.map((b) => (b.id === badgeForm.id ? badgeForm : b)) : [...prev, badgeForm]
      return next.sort((a, b) => a.sort_order - b.sort_order)
    })
    setBadgeForm(null)
    toast({ title: "تم حفظ الشارة" })
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="h-6 w-6" /> النقاط والشارات
        </h3>
        <p className="text-muted-foreground">تابعي نقاط الأعضاء ومستوياتهم، وامنحي أو اخصمي النقاط والشارات.</p>
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">الأعضاء ({users.length})</TabsTrigger>
          <TabsTrigger value="badges">كتالوج الشارات ({badges.length})</TabsTrigger>
        </TabsList>

        {/* ---------------- Members ---------------- */}
        <TabsContent value="members" className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pr-9"
              placeholder="ابحثي بالاسم…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">العضو</TableHead>
                    <TableHead className="text-right">المستوى</TableHead>
                    <TableHead className="text-right">النقاط</TableHead>
                    <TableHead className="text-right">الشارات</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 200).map((u) => {
                    const lvl = levelFor(u.points)
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          {u.username || "مستخدم"}
                          {u.is_admin && <Badge className="mr-2" variant="secondary">مشرفة</Badge>}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1">
                            <span>{lvl.emoji}</span>
                            <span className="text-sm">{lvl.title}</span>
                          </span>
                        </TableCell>
                        <TableCell className="font-bold text-primary">{u.points}</TableCell>
                        <TableCell>{u.badge_ids.length}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="gap-1" onClick={() => setPointsUser(u)}>
                              <Star className="h-3 w-3" /> النقاط
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1" onClick={() => setBadgeUser(u)}>
                              <Award className="h-3 w-3" /> الشارات
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Badge catalog ---------------- */}
        <TabsContent value="badges" className="space-y-4">
          <div className="flex justify-end">
            <Button
              className="gap-2"
              onClick={() => setBadgeForm({ id: "", name: "", description: "", icon: "", sort_order: 0 })}
            >
              <Plus className="h-4 w-4" /> شارة جديدة
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {badges.map((b) => (
              <Card key={b.id}>
                <CardContent className="p-4 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{b.name}</p>
                    {b.description && <p className="text-xs text-muted-foreground mt-1">{b.description}</p>}
                    <p className="text-[10px] text-muted-foreground mt-2 font-mono">
                      {b.id} · {b.icon || "—"}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => setBadgeForm(b)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ---- Adjust points dialog ---- */}
      <Dialog open={!!pointsUser} onOpenChange={(o) => !o && setPointsUser(null)}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle>تعديل نقاط {pointsUser?.username || "العضو"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">الرصيد الحالي: <b>{pointsUser?.points}</b> نقطة</p>
            <div className="space-y-2">
              <Label>عدد النقاط</Label>
              <Input type="number" value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="50" />
            </div>
            <div className="space-y-2">
              <Label>السبب (اختياري)</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="مكافأة/تصحيح" />
            </div>
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1 gap-1" onClick={() => applyPoints(-1)}>
              <Minus className="h-4 w-4" /> خصم
            </Button>
            <Button className="flex-1 gap-1" onClick={() => applyPoints(1)}>
              <Plus className="h-4 w-4" /> إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Per-user badges dialog ---- */}
      <Dialog open={!!badgeUser} onOpenChange={(o) => !o && setBadgeUser(null)}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>شارات {badgeUser?.username || "العضو"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {badges.map((b) => {
              const has = badgeUser?.badge_ids.includes(b.id)
              return (
                <div key={b.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium">{b.name}</p>
                    {b.description && <p className="text-xs text-muted-foreground">{b.description}</p>}
                  </div>
                  <Button size="sm" variant={has ? "outline" : "default"} onClick={() => toggleBadge(b.id)}>
                    {has ? "إزالة" : "منح"}
                  </Button>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* ---- Badge-definition dialog ---- */}
      <Dialog open={!!badgeForm} onOpenChange={(o) => !o && setBadgeForm(null)}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>{badges.some((b) => b.id === badgeForm?.id) ? "تعديل شارة" : "شارة جديدة"}</DialogTitle>
          </DialogHeader>
          {badgeForm && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>المعرّف (id بالإنجليزية)</Label>
                <Input
                  value={badgeForm.id}
                  onChange={(e) => setBadgeForm({ ...badgeForm, id: e.target.value })}
                  disabled={badges.some((b) => b.id === badgeForm.id)}
                  placeholder="super_helper"
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم</Label>
                <Input value={badgeForm.name} onChange={(e) => setBadgeForm({ ...badgeForm, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea
                  value={badgeForm.description || ""}
                  onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>الأيقونة (MaterialIcons)</Label>
                  <Input
                    value={badgeForm.icon || ""}
                    onChange={(e) => setBadgeForm({ ...badgeForm, icon: e.target.value })}
                    placeholder="star"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الترتيب</Label>
                  <Input
                    type="number"
                    value={badgeForm.sort_order}
                    onChange={(e) => setBadgeForm({ ...badgeForm, sort_order: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={saveBadgeDef} className="w-full">حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

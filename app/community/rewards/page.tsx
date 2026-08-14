"use client"

import { useEffect, useMemo, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Gift, Star, Ticket, Lock, Copy, ExternalLink, Info } from "lucide-react"

type RewardMeta = { instructions?: string; link?: string; course_id?: string; workshop_id?: string }
type Reward = {
  id: string
  title: string
  description: string | null
  type: string
  cost_points: number
  discount_label: string | null
  stock: number | null
  metadata: RewardMeta | null
}
type Redemption = {
  id: string
  cost_points: number
  code: string | null
  status: string
  created_at: string
  expires_at: string | null
  rewards: { title: string; type: string; metadata: RewardMeta | null } | null
}

const TYPE_LABELS: Record<string, string> = {
  coupon: "كوبون خصم",
  present: "هدية",
  offer_code: "كود اشتراك",
  content: "محتوى حصري",
  course: "دورة",
  workshop: "ورشة عمل",
}
const STATUS_LABELS: Record<string, string> = {
  pending: "بانتظار التنفيذ",
  fulfilled: "تم التنفيذ",
  expired: "منتهي",
  cancelled: "ملغي",
}
const REASONS: Record<string, string> = {
  not_enough_points: "نقاطك غير كافية لهذا العرض",
  out_of_stock: "انتهت الكمية المتاحة",
  unavailable: "هذا العرض غير متاح حالياً",
  not_authenticated: "يرجى تسجيل الدخول",
}

export default function RewardsPage() {
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const [points, setPoints] = useState(0)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState<string | null>(null)
  const [tab, setTab] = useState("offers")
  const [success, setSuccess] = useState<{ code?: string | null; instructions?: string; link?: string } | null>(null)

  const load = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    const [{ data: profile }, { data: rw }, { data: red }] = await Promise.all([
      supabase.from("user_profiles").select("points").eq("id", user.id).single(),
      supabase
        .from("rewards")
        .select("id, title, description, type, cost_points, discount_label, stock, metadata")
        .eq("active", true)
        .order("cost_points", { ascending: true }),
      supabase
        .from("reward_redemptions")
        .select("id, cost_points, code, status, created_at, expires_at, rewards(title, type, metadata)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ])
    setPoints(profile?.points ?? 0)
    setRewards((rw || []).filter((r: any) => r.stock === null || r.stock > 0))
    setRedemptions(
      (red || []).map((r: any) => ({ ...r, rewards: Array.isArray(r.rewards) ? r.rewards[0] : r.rewards }))
    )
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sorted = useMemo(
    () =>
      [...rewards].sort((a, b) => {
        const aAff = points >= a.cost_points ? 0 : 1
        const bAff = points >= b.cost_points ? 0 : 1
        if (aAff !== bAff) return aAff - bAff
        return a.cost_points - b.cost_points
      }),
    [rewards, points]
  )

  const redeem = async (r: Reward) => {
    if (points < r.cost_points) return
    if (!confirm(`سيتم خصم ${r.cost_points} نقطة مقابل: ${r.title}؟`)) return
    setRedeeming(r.id)
    const { data, error } = await supabase.rpc("redeem_reward", { p_reward_id: r.id })
    setRedeeming(null)
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" })
      return
    }
    const res: any = data || {}
    if (!res.ok) {
      toast({ title: "تعذّر الاستبدال", description: REASONS[res.reason] || "حاولي مرة أخرى", variant: "destructive" })
      return
    }
    setSuccess({ code: res.code, instructions: r.metadata?.instructions, link: r.metadata?.link })
    await load()
    setTab("mine")
  }

  const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("ar-SA-u-ca-gregory") : "")
  const copy = (code: string) => {
    navigator.clipboard?.writeText(code)
    toast({ title: "تم نسخ الكود" })
  }

  return (
    <div className="container max-w-4xl py-6" dir="rtl">
      {/* Balance */}
      <Card className="mb-6 bg-primary text-primary-foreground">
        <CardContent className="flex items-center justify-between p-5">
          <div className="flex items-center gap-2">
            <Star className="h-6 w-6" />
            <span className="text-lg font-bold">رصيد نقاطك</span>
          </div>
          <span className="text-3xl font-extrabold">{points}</span>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 mb-4">
        <Gift className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">المكافآت والعروض</h1>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="offers">العروض المتاحة</TabsTrigger>
          <TabsTrigger value="mine">مكافآتي {redemptions.length ? `(${redemptions.length})` : ""}</TabsTrigger>
        </TabsList>

        {/* Offers */}
        <TabsContent value="offers">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                لا توجد عروض حالياً. اجمعي المزيد من النقاط وعودي قريباً!
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {sorted.map((r) => {
                const affordable = points >= r.cost_points
                const remaining = Math.max(0, r.cost_points - points)
                return (
                  <Card key={r.id} className={affordable ? "" : "opacity-90"}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <Ticket className="h-4 w-4 text-primary" />
                            <h3 className="font-bold">{r.title}</h3>
                          </div>
                          {r.discount_label && (
                            <p className="text-sm text-primary font-medium mt-1">{r.discount_label}</p>
                          )}
                        </div>
                        <Badge variant="secondary">{TYPE_LABELS[r.type] || r.type}</Badge>
                      </div>

                      {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}

                      <div className="flex items-center justify-between pt-1">
                        <Badge className="bg-primary/10 text-primary border-none">{r.cost_points} نقطة</Badge>
                        {r.stock !== null && r.stock <= 5 && (
                          <span className="text-xs text-amber-600">باقٍ {r.stock} فقط</span>
                        )}
                      </div>

                      {affordable ? (
                        <Button className="w-full gap-2" disabled={redeeming === r.id} onClick={() => redeem(r)}>
                          <Gift className="h-4 w-4" />
                          {redeeming === r.id ? "جارٍ الاستبدال…" : "استبدال الآن"}
                        </Button>
                      ) : (
                        <div className="space-y-1">
                          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-2 rounded-full bg-primary/70"
                              style={{ width: `${Math.min(100, (points / r.cost_points) * 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 justify-center">
                            <Lock className="h-3 w-3" /> تحتاجين {remaining} نقطة إضافية
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Mine */}
        <TabsContent value="mine">
          {redemptions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                لا توجد مكافآت بعد. استبدلي نقاطك من تبويب العروض المتاحة.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {redemptions.map((r) => (
                <Card key={r.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{r.rewards?.title || "مكافأة"}</h3>
                      <Badge variant="outline">{STATUS_LABELS[r.status] || r.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {r.cost_points} نقطة · {fmt(r.created_at)}
                      {r.expires_at ? ` · صالح حتى ${fmt(r.expires_at)}` : ""}
                    </p>

                    {r.code && (
                      <button
                        onClick={() => copy(r.code!)}
                        className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 py-3 font-mono font-bold tracking-widest text-primary"
                      >
                        {r.code} <Copy className="h-4 w-4" />
                      </button>
                    )}

                    {r.rewards?.metadata?.instructions && (
                      <p className="text-sm text-muted-foreground flex gap-2">
                        <Info className="h-4 w-4 mt-0.5 shrink-0" />
                        {r.rewards.metadata.instructions}
                      </p>
                    )}
                    {r.rewards?.metadata?.link && (
                      <Button asChild variant="outline" size="sm" className="gap-2">
                        <a href={r.rewards.metadata.link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" /> فتح الرابط
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Success dialog */}
      <Dialog open={!!success} onOpenChange={(o) => !o && setSuccess(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تم الاستبدال بنجاح 🎉</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {success?.code && (
              <button
                onClick={() => copy(success.code!)}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 py-3 font-mono font-bold tracking-widest text-primary"
              >
                {success.code} <Copy className="h-4 w-4" />
              </button>
            )}
            {success?.instructions && (
              <p className="text-sm text-muted-foreground flex gap-2">
                <Info className="h-4 w-4 mt-0.5 shrink-0" /> {success.instructions}
              </p>
            )}
            {success?.link && (
              <Button asChild variant="outline" className="gap-2 w-full">
                <a href={success.link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" /> فتح الرابط
                </a>
              </Button>
            )}
            <p className="text-xs text-muted-foreground">تجدين مكافأتك دائماً في تبويب «مكافآتي».</p>
          </div>
          <DialogFooter>
            <Button className="w-full" onClick={() => setSuccess(null)}>تم</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

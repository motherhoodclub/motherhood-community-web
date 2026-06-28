"use client"

import { useEffect, useState, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { BarChart3, Lock, MoreVertical, CheckCircle2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Shared polls feature — see create_polls_system.sql. Single-choice, changeable
// votes; results are always visible (live tallies). Mirrors the mobile PollCard.

interface PollOption {
  id: string
  text: string
  position: number
  votes: number
}

interface PollData {
  id: string
  question: string
  is_closed: boolean
  options: PollOption[]
  totalVotes: number
  myOptionId: string | null
}

export function PollCard({ pollId, compact }: { pollId: string; compact?: boolean }) {
  const supabase = createClientComponentClient()
  const [poll, setPoll] = useState<PollData | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setUserId(user?.id ?? null)

    const [{ data: pollRow }, { data: options }, { data: counts }, myVote, profile] =
      await Promise.all([
        supabase.from("polls").select("id, question, is_closed").eq("id", pollId).single(),
        supabase.from("poll_options").select("id, text, position").eq("poll_id", pollId).order("position"),
        supabase.from("poll_option_counts").select("option_id, votes").eq("poll_id", pollId),
        user
          ? supabase.from("poll_votes").select("option_id").eq("poll_id", pollId).eq("user_id", user.id).maybeSingle()
          : Promise.resolve({ data: null } as any),
        user
          ? supabase.from("user_profiles").select("is_admin").eq("id", user.id).single()
          : Promise.resolve({ data: null } as any),
      ])

    if (!pollRow) return
    setIsAdmin(profile?.data?.is_admin === true)

    const countMap = new Map<string, number>((counts || []).map((c: any) => [c.option_id, c.votes]))
    const opts: PollOption[] = (options || []).map((o: any) => ({
      id: o.id,
      text: o.text,
      position: o.position,
      votes: countMap.get(o.id) ?? 0,
    }))

    setPoll({
      id: pollRow.id,
      question: pollRow.question,
      is_closed: pollRow.is_closed,
      options: opts,
      totalVotes: opts.reduce((s, o) => s + o.votes, 0),
      myOptionId: (myVote as any)?.data?.option_id ?? null,
    })
  }, [pollId, supabase])

  useEffect(() => {
    load()
    const channel = supabase
      .channel(`poll-${pollId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "poll_votes", filter: `poll_id=eq.${pollId}` }, () => load())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "polls", filter: `id=eq.${pollId}` }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [pollId, load, supabase])

  const vote = async (optionId: string) => {
    if (!poll || poll.is_closed || busy || !userId) return
    setBusy(true)
    // optimistic
    setPoll((prev) => {
      if (!prev) return prev
      const had = prev.myOptionId
      const options = prev.options.map((o) => {
        let votes = o.votes
        if (o.id === optionId && had !== optionId) votes += 1
        if (o.id === had && had !== optionId) votes = Math.max(0, votes - 1)
        return { ...o, votes }
      })
      return { ...prev, options, myOptionId: optionId, totalVotes: options.reduce((s, o) => s + o.votes, 0) }
    })
    const { error } = await supabase.rpc("vote_poll", { p_poll_id: pollId, p_option_id: optionId })
    if (error) await load()
    setBusy(false)
  }

  const setClosed = async (closed: boolean) => {
    await supabase.from("polls").update({ is_closed: closed }).eq("id", pollId)
    load()
  }

  const remove = async () => {
    if (!confirm("سيتم حذف الاستطلاع وكل الأصوات نهائياً. متابعة؟")) return
    await supabase.from("polls").delete().eq("id", pollId)
    setPoll(null)
  }

  if (!poll) {
    return <div className="rounded-xl border p-3 text-sm text-muted-foreground">جارٍ تحميل الاستطلاع…</div>
  }

  const total = poll.totalVotes

  return (
    <div className={cn("rounded-xl border bg-card p-4 space-y-3", compact && "p-3 w-72")} dir="rtl">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <BarChart3 className="h-4 w-4 mt-1 text-primary shrink-0" />
          <h4 className="font-bold text-sm leading-6">{poll.question}</h4>
        </div>
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger className="text-muted-foreground hover:text-foreground">
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setClosed(!poll.is_closed)}>
                {poll.is_closed ? "إعادة فتح التصويت" : "إغلاق التصويت"}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={remove}>
                حذف الاستطلاع
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {poll.is_closed && (
        <div className="flex items-center gap-1 text-xs text-red-500 font-medium">
          <Lock className="h-3 w-3" />
          انتهى التصويت
        </div>
      )}

      <div className="space-y-2">
        {poll.options.map((opt) => {
          const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0
          const mine = poll.myOptionId === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              disabled={poll.is_closed}
              onClick={() => vote(opt.id)}
              className={cn(
                "relative w-full overflow-hidden rounded-lg border text-right transition-colors",
                mine ? "border-primary" : "border-transparent",
                poll.is_closed ? "cursor-default" : "hover:border-primary/50",
              )}
            >
              <div
                className={cn("absolute inset-y-0 right-0", mine ? "bg-primary/20" : "bg-primary/10")}
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex items-center justify-between gap-2 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  {mine ? (
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={cn("text-sm truncate", mine && "font-bold text-primary")}>{opt.text}</span>
                </div>
                <span className={cn("text-xs font-bold tabular-nums", mine && "text-primary")}>{pct}%</span>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{total} صوت</span>
        {!poll.is_closed && <span>{poll.myOptionId ? "يمكنك تغيير اختيارك" : "اضغط للتصويت"}</span>}
      </div>
    </div>
  )
}

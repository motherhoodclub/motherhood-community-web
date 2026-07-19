import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { accessRank } from "./entitlements"

/**
 * Server-side resolution of the calling user's subscription access rank.
 * Use in API route handlers to enforce tier gating on protected content
 * (the client-side context can be bypassed, this cannot).
 */
export async function getRequestAccess() {
  const supabase = createRouteHandlerClient({ cookies })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, isAdmin: false, planType: null as string | null, rank: 0, bonusCredits: 0 }
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("is_admin, bonus_course_credits")
    .eq("id", user.id)
    .single()
  const isAdmin = profile?.is_admin === true || profile?.is_admin === "true"
  const bonusCredits = Number(profile?.bonus_course_credits) || 0

  const { data: subs } = await supabase
    .from("user_subscriptions")
    .select("plan_type,status,current_period_end")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const now = new Date()
  const active = subs?.find(
    (s) =>
      (s.status === "active" || s.status === "trialing") &&
      s.current_period_end &&
      new Date(s.current_period_end) > now,
  )
  const planType = active?.plan_type ?? null

  return { user, isAdmin, planType, rank: accessRank({ planType, isAdmin }), bonusCredits }
}

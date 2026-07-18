/**
 * Subscription tiers & feature entitlements.
 *
 * The three billing plans double as feature tiers (each longer plan is a
 * strict superset of the shorter one):
 *
 *   monthly      -> basic    (tier 1)  — 33$
 *   semi-annual  -> plus     (tier 2)  — 165$  (⭐ الأكثر شعبية)
 *   yearly       -> premium  (tier 3)  — 250$  (👑 أفضل قيمة)
 *
 * Content items (workshops, files, ...) carry a numeric `min_tier` that admins
 * control from the dashboard. A user can open an item when their tier rank is
 * >= the item's `min_tier`. `min_tier = 0` means "any active subscriber".
 */

export type PlanType = "monthly" | "semi-annual" | "yearly"
export type Tier = "basic" | "plus" | "premium"

/** Numeric rank used for comparisons. Higher = more access. */
export const TIER_RANK: Record<Tier, number> = {
  basic: 1,
  plus: 2,
  premium: 3,
}

export const PLAN_TO_TIER: Record<PlanType, Tier> = {
  monthly: "basic",
  "semi-annual": "plus",
  yearly: "premium",
}

export const TIER_LABEL_AR: Record<Tier, string> = {
  basic: "الباقة الشهرية",
  plus: "باقة 6 أشهر",
  premium: "الباقة السنوية",
}

/** Feature flags that gate specific content areas. */
export type Feature =
  | "community_content" // core recorded videos, weekly video, live meeting, files, challenges
  | "live_workshops_free" // free entry to live workshops
  | "past_workshop_recordings" // access to recordings of previous workshops
  | "premium_file_library" // مكتبة الملفات المميزة
  | "priority_answers" // أولوية بالإجابة على الأسئلة
  | "recorded_courses" // دورتان مسجلتان
  | "exclusive_sessions" // جلسة جماعية حصرية شهرية
  | "bonus_library" // مكتبة البونصات والملفات الحصرية
  | "early_access" // الوصول المبكر للبرامج والورش الجديدة

/** The minimum tier rank required for each built-in feature. */
export const FEATURE_MIN_RANK: Record<Feature, number> = {
  community_content: TIER_RANK.basic,
  live_workshops_free: TIER_RANK.plus,
  past_workshop_recordings: TIER_RANK.plus,
  premium_file_library: TIER_RANK.plus,
  priority_answers: TIER_RANK.plus,
  recorded_courses: TIER_RANK.premium,
  exclusive_sessions: TIER_RANK.premium,
  bonus_library: TIER_RANK.premium,
  early_access: TIER_RANK.premium,
}

/** Resolve a stored `plan_type` to a tier (defaults to basic). */
export function tierFromPlan(planType?: string | null): Tier {
  if (planType && planType in PLAN_TO_TIER) {
    return PLAN_TO_TIER[planType as PlanType]
  }
  return "basic"
}

/**
 * Numeric access rank for a user.
 * Admins get max access; a null/unknown plan for a non-admin is rank 0 (none).
 */
export function accessRank(opts: { planType?: string | null; isAdmin?: boolean }): number {
  if (opts.isAdmin) return TIER_RANK.premium
  if (!opts.planType || !(opts.planType in PLAN_TO_TIER)) return 0
  return TIER_RANK[tierFromPlan(opts.planType)]
}

/** Can this user open an item whose `min_tier` (numeric rank) is `minTier`? */
export function canAccessTier(
  minTier: number | null | undefined,
  opts: { planType?: string | null; isAdmin?: boolean },
): boolean {
  const required = minTier ?? 0
  return accessRank(opts) >= required
}

/** Does this user's plan unlock a specific built-in feature? */
export function hasFeature(feature: Feature, opts: { planType?: string | null; isAdmin?: boolean }): boolean {
  return accessRank(opts) >= FEATURE_MIN_RANK[feature]
}

/** Options for a "minimum tier" <select> in the admin dashboard. */
export const MIN_TIER_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "كل المشتركين" },
  { value: TIER_RANK.plus, label: "باقة 6 أشهر فأعلى" },
  { value: TIER_RANK.premium, label: "الباقة السنوية فقط" },
]

/** Short Arabic label for a numeric min_tier (for badges in listings). */
export function minTierLabel(minTier: number | null | undefined): string | null {
  const rank = minTier ?? 0
  if (rank <= 0) return null
  if (rank === TIER_RANK.plus) return "6 أشهر فأعلى"
  return "الباقة السنوية"
}

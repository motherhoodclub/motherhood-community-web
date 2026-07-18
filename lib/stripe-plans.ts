import type Stripe from "stripe"
import type { PlanType } from "./entitlements"

/**
 * Server-side mapping between our plan types and the Stripe price IDs
 * (configured via env vars). Used by both the checkout route and the webhook
 * so the two never disagree on which plan a price represents.
 */

/** Recurring (subscription) price IDs by plan. */
function recurringPriceId(plan: PlanType): string | undefined {
  switch (plan) {
    case "yearly":
      return process.env.STRIPE_YEARLY_PRICE_ID
    case "semi-annual":
      return process.env.STRIPE_SEMI_ANNUAL_PRICE_ID
    default:
      return process.env.STRIPE_MONTHLY_PRICE_ID
  }
}

/** One-time (payment mode) price IDs by plan. */
function oneTimePriceId(plan: PlanType): string | undefined {
  switch (plan) {
    case "yearly":
      return process.env.STRIPE_YEARLY_ONETIME_PRICE_ID
    case "semi-annual":
      return process.env.STRIPE_SEMI_ANNUAL_ONETIME_PRICE_ID
    default:
      return process.env.STRIPE_MONTHLY_ONETIME_PRICE_ID
  }
}

export function getPriceId(plan: PlanType, isRecurring: boolean): string | undefined {
  return isRecurring ? recurringPriceId(plan) : oneTimePriceId(plan)
}

/** Reverse lookup: which plan does a given Stripe price ID correspond to? */
export function planFromPriceId(priceId?: string | null): PlanType | null {
  if (!priceId) return null
  const pairs: [PlanType, (string | undefined)[]][] = [
    ["yearly", [process.env.STRIPE_YEARLY_PRICE_ID, process.env.STRIPE_YEARLY_ONETIME_PRICE_ID]],
    ["semi-annual", [process.env.STRIPE_SEMI_ANNUAL_PRICE_ID, process.env.STRIPE_SEMI_ANNUAL_ONETIME_PRICE_ID]],
    ["monthly", [process.env.STRIPE_MONTHLY_PRICE_ID, process.env.STRIPE_MONTHLY_ONETIME_PRICE_ID]],
  ]
  for (const [plan, ids] of pairs) {
    if (ids.filter(Boolean).includes(priceId)) return plan
  }
  return null
}

/**
 * Resolve the plan type for a Stripe subscription. Prefers an exact price-ID
 * match; falls back to the billing interval (year -> yearly, 6-month ->
 * semi-annual, otherwise monthly) so a mismatched/unknown price never silently
 * downgrades a 6-month member to "monthly".
 */
export function planFromStripeSubscription(subscription: Stripe.Subscription): PlanType {
  const item = subscription.items.data[0]
  const byPrice = planFromPriceId(item?.price?.id)
  if (byPrice) return byPrice

  const plan = item?.plan
  if (plan?.interval === "year") return "yearly"
  if (plan?.interval === "month" && plan?.interval_count === 6) return "semi-annual"
  return "monthly"
}

"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { accessRank as computeAccessRank, canAccessTier, tierFromPlan, type Tier } from "@/lib/entitlements"

type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | "inactive"
  | null

interface SubscriptionContextType {
  isLoading: boolean
  subscription: any | null
  isSubscribed: boolean
  isAdmin: boolean
  /** Feature tier of the active plan (admins are treated as premium). */
  tier: Tier | null
  /** Numeric access rank (0 = none, 1 = basic, 2 = plus, 3 = premium). */
  accessRank: number
  /** True when the user may open an item requiring `minTier` (a rank). */
  canAccess: (minTier: number | null | undefined) => boolean
  checkSubscription: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [subscription, setSubscription] = useState<any | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()

  const checkSubscription = async () => {
    try {
      setIsLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setSubscription(null)
        setIsAdmin(false)
        return
      }

      console.log("Checking subscription for user:", user.id)

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single()

      if (profileError) {
        console.error("Error fetching user profile:", profileError)
      } else {
        setIsAdmin(profile?.is_admin === true || profile?.is_admin === "true")
        console.log("User admin status:", profile?.is_admin)
      }

      // Get subscription data - don't use .single() since there might be multiple records
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (subscriptionError) {
        console.error("Error fetching subscription:", subscriptionError)
        setSubscription(null)
      } else if (subscriptionData && subscriptionData.length > 0) {
        console.log("Found subscription records:", subscriptionData.length)

        // First, look for active subscriptions with valid dates
        const now = new Date()
        const activeSubscription = subscriptionData.find((sub) => {
          const isActive = sub.status === "active" || sub.status === "trialing"
          const hasValidPeriod = sub.current_period_end && new Date(sub.current_period_end) > now

          console.log(
            `Checking subscription ${sub.id}: status=${sub.status}, end=${sub.current_period_end}, isActive=${isActive}, hasValidPeriod=${hasValidPeriod}`,
          )

          return isActive && hasValidPeriod
        })

        if (activeSubscription) {
          console.log("Found active subscription:", activeSubscription.id)
          setSubscription(activeSubscription)

          // Clean up duplicate subscriptions if there are more than one
          if (subscriptionData.length > 1) {
            try {
              await fetch("/api/cleanup-subscriptions", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  activeSubscriptionId: activeSubscription.id,
                }),
              })
            } catch (error) {
              console.error("Error cleaning up subscriptions:", error)
            }
          }
        } else {
          // No active subscription found, use the most recent one
          console.log("No active subscription found, using most recent:", subscriptionData[0].id)
          setSubscription(subscriptionData[0])
        }
      } else {
        console.log("No subscription data found")
        setSubscription(null)
      }
    } catch (error) {
      console.error("Error checking subscription:", error)
      setSubscription(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkSubscription()
  }, [])

  // Modified to handle both recurring subscriptions and one-time payments
  const isSubscribed =
    isAdmin ||
    (subscription &&
      (subscription.status === "active" || subscription.status === "trialing") &&
      subscription.current_period_end &&
      new Date(subscription.current_period_end) > new Date())

  // A plan only counts toward tier/access when the subscription is actually
  // active — otherwise a non-admin with an expired plan has no access rank.
  const activePlanType = isSubscribed && !isAdmin ? subscription?.plan_type : null
  const tier: Tier | null = isAdmin ? "premium" : isSubscribed ? tierFromPlan(activePlanType) : null
  const accessRank = computeAccessRank({ planType: activePlanType, isAdmin })
  const canAccess = (minTier: number | null | undefined) => canAccessTier(minTier, { planType: activePlanType, isAdmin })

  return (
    <SubscriptionContext.Provider
      value={{
        isLoading,
        subscription,
        isSubscribed,
        isAdmin,
        tier,
        accessRank,
        canAccess,
        checkSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider")
  }
  return context
}

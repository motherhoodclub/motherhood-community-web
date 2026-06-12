import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

// Initialize Supabase client with service role for admin access
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("session_id")

    if (!sessionId) {
      return NextResponse.json({ message: "Session ID is required" }, { status: 400 })
    }

    console.log("Checking session status for:", sessionId)

    // Get the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    console.log("Session retrieved:", session.id, "status:", session.status, "mode:", session.mode)

    // Get the user from Supabase
    const cookieSupabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await cookieSupabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    console.log("Processing for user:", user.id)

    // Ensure the checkout session actually belongs to the requesting user.
    // The session is created with metadata.userId in /api/create-checkout-session.
    // Without this check, a user could pass any completed session_id and grant
    // themselves a subscription off someone else's payment.
    if (session.metadata?.userId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    // If the session is completed, update the user's subscription
    if (session.status === "complete") {
      if (session.mode === "subscription" && session.subscription) {
        // Get the subscription
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        console.log("Subscription retrieved:", subscription.id, "status:", subscription.status)

        // Check if there's an existing subscription record with this stripe_subscription_id
        const { data: existingSubscriptions } = await supabase
          .from("user_subscriptions")
          .select("id")
          .eq("stripe_subscription_id", subscription.id)

        if (existingSubscriptions && existingSubscriptions.length > 0) {
          console.log("Updating existing subscription:", existingSubscriptions[0].id)

          // Update the existing subscription
          await supabase
            .from("user_subscriptions")
            .update({
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingSubscriptions[0].id)
        } else {
          console.log("Creating new subscription record for subscription:", subscription.id)

          // Create a new subscription record
          const { data, error } = await supabase
            .from("user_subscriptions")
            .insert({
              user_id: user.id,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscription.id,
              status: subscription.status,
              plan_type: session.metadata?.planType || "monthly",
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
            })
            .select()

          if (error) {
            console.error("Error creating subscription record:", error)
          } else {
            console.log("Created subscription record:", data[0].id)
          }
        }
      } else if (session.mode === "payment") {
        // For one-time payments
        console.log("Processing one-time payment")

        const startDate = new Date()
        const endDate = new Date()

        // Set the end date based on the plan type
        if (session.metadata?.planType === "yearly") {
          endDate.setFullYear(endDate.getFullYear() + 1)
        } else {
          endDate.setMonth(endDate.getMonth() + 1)
        }

        console.log("One-time payment period:", startDate.toISOString(), "to", endDate.toISOString())

        // Create a subscription record for the one-time payment
        const { data, error } = await supabase
          .from("user_subscriptions")
          .insert({
            user_id: user.id,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: null, // No subscription for one-time payments
            status: "active", // Mark as active
            plan_type: session.metadata?.planType || "monthly",
            current_period_start: startDate.toISOString(),
            current_period_end: endDate.toISOString(),
            cancel_at_period_end: true, // One-time payments don't renew
          })
          .select()

        if (error) {
          console.error("Error creating one-time payment record:", error)
        } else {
          console.log("Created one-time payment record:", data[0].id)
        }
      }
    }

    return NextResponse.json({
      success: true,
      status: session.status,
      mode: session.mode,
    })
  } catch (error) {
    console.error("Error checking session status:", error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

// Initialize Supabase client with service role for admin access
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Use the new route segment config syntax instead of the deprecated export const config
export const dynamic = "force-dynamic"
export const runtime = "nodejs"
// Add this line to ensure the route is not protected by middleware
export const skipMiddleware = true

export async function POST(request: Request) {
  console.log("Webhook received:", request.headers.get("Stripe-Signature"))

  // Get the raw body for Stripe signature verification
  const payload = await request.text()
  const signature = request.headers.get("Stripe-Signature") as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (error) {
    console.error(`Webhook signature verification failed: ${error.message}`)
    return NextResponse.json({ message: `Webhook Error: ${error.message}` }, { status: 400 })
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutSessionCompleted(session)
        break
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error(`Error handling webhook: ${error.message}`)
    return NextResponse.json({ message: `Webhook Error: ${error.message}` }, { status: 500 })
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log("Processing checkout.session.completed", session.id)

  // Get the customer
  const customer = await stripe.customers.retrieve(session.customer as string)
  console.log("Retrieved customer:", customer.id)

  // Get the user ID from the customer metadata or session metadata
  const userId = customer.metadata?.userId || session.metadata?.userId

  if (!userId) {
    console.error("No user ID found in customer or session metadata")
    throw new Error("No user ID found in customer or session metadata")
  }

  console.log("User ID from metadata:", userId)

  // Check if this is a subscription or one-time payment
  if (session.mode === "subscription" && session.subscription) {
    // Handle subscription checkout
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
    console.log("Retrieved subscription:", subscription.id, "status:", subscription.status)

    // First, check if there's an existing subscription with this stripe_subscription_id
    const { data: existingSubscriptions } = await supabase
      .from("user_subscriptions")
      .select("id")
      .eq("stripe_subscription_id", subscription.id)

    if (existingSubscriptions && existingSubscriptions.length > 0) {
      console.log("Subscription already exists, updating:", existingSubscriptions[0].id)

      // Update the existing subscription
      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSubscriptions[0].id)

      if (error) {
        console.error("Error updating existing subscription:", error)
        throw error
      }
    } else {
      // Create a new subscription record
      const { data, error } = await supabase
        .from("user_subscriptions")
        .insert({
          user_id: userId,
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
        console.error("Error creating subscription in database:", error)
        throw error
      } else {
        console.log("Subscription created successfully for user:", userId, "with ID:", data[0].id)

        // Send subscription notification emails
        try {
          const endDate = new Date(subscription.current_period_end * 1000).toLocaleDateString("ar-SA-u-ca-gregory")

          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/subscription`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId,
              planType: session.metadata?.planType || "monthly",
              endDate,
            }),
          })

          console.log("Subscription notification emails sent successfully")
        } catch (notificationError) {
          console.error("Error sending subscription notification emails:", notificationError)
          // Don't throw error here to avoid disrupting the webhook flow
        }
      }
    }
  } else if (session.mode === "payment") {
    // Handle one-time payment checkout
    console.log("Processing one-time payment for session:", session.id)

    // Get the line items to determine what was purchased
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id)

    // Create a record of the one-time payment
    const { error } = await supabase.from("user_payments").insert({
      user_id: userId,
      stripe_customer_id: session.customer as string,
      stripe_payment_id: session.payment_intent as string,
      amount: session.amount_total,
      currency: session.currency,
      status: "completed",
      payment_type: session.metadata?.paymentType || "one-time",
      product_id: lineItems.data[0]?.price?.product as string,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error creating payment record:", error)
      throw error
    } else {
      console.log("Payment record created successfully for user:", userId)
    }

    // If this is a one-time purchase that should grant subscription access
    if (session.metadata?.grantSubscription === "true") {
      // Calculate end date based on plan type (e.g., 30 days for monthly, 365 for yearly)
      const planType = session.metadata?.planType || "monthly"
      const daysToAdd = planType === "yearly" ? 365 : 30
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + daysToAdd)

      // Create a subscription record for the one-time payment
      const { error: subError } = await supabase
        .from("user_subscriptions")
        .insert({
          user_id: userId,
          stripe_customer_id: session.customer as string,
          status: "active",
          plan_type: planType,
          payment_type: "one-time",
          current_period_start: new Date().toISOString(),
          current_period_end: endDate.toISOString(),
          cancel_at_period_end: true, // One-time payments don't renew
        })
        .select()

      if (subError) {
        console.error("Error creating subscription record for one-time payment:", subError)
        throw subError
      } else {
        console.log("Subscription record created for one-time payment for user:", userId)
      }
    }
  } else {
    console.log("Unhandled checkout session mode:", session.mode)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Get the customer
  const customer = await stripe.customers.retrieve(subscription.customer as string)

  // Get the user ID from the customer metadata
  const userId = customer.metadata.userId

  if (!userId) {
    throw new Error("No user ID found in customer metadata")
  }

  // Get the plan type from the subscription items
  const planType = subscription.items.data[0].plan.interval === "year" ? "yearly" : "monthly"

  // Check if there's an existing subscription with this stripe_subscription_id
  const { data: existingSubscriptions } = await supabase
    .from("user_subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subscription.id)

  if (existingSubscriptions && existingSubscriptions.length > 0) {
    // Update the existing subscription
    await supabase
      .from("user_subscriptions")
      .update({
        status: subscription.status,
        plan_type: planType,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingSubscriptions[0].id)
  } else {
    // Create a new subscription record
    await supabase.from("user_subscriptions").insert({
      user_id: userId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      plan_type: planType,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Get the customer
  const customer = await stripe.customers.retrieve(subscription.customer as string)

  // Get the user ID from the customer metadata
  const userId = customer.metadata.userId

  if (!userId) {
    throw new Error("No user ID found in customer metadata")
  }

  // Update the subscription status to canceled
  await supabase
    .from("user_subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
}

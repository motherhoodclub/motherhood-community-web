import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import Stripe from "stripe"
import { getPriceId } from "@/lib/stripe-plans"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

export async function POST(request: Request) {
  try {
    const { planType, isRecurring = true } = await request.json()

    // Get the user from Supabase
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get the user's email
    const { data: userData } = await supabase.auth.getUser()
    const email = userData.user?.email

    if (!email) {
      return NextResponse.json({ message: "User email not found" }, { status: 400 })
    }

    console.log(`Creating checkout session for ${email}, plan: ${planType}, recurring: ${isRecurring}`)

    // Determine the price ID based on the plan type and whether it's recurring
    const priceId = getPriceId(planType, isRecurring)

    if (!priceId) {
      return NextResponse.json({ message: "Invalid price ID" }, { status: 400 })
    }

    // Check if the user already has a Stripe customer ID
    const { data: userSubscription } = await supabase
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .not("stripe_customer_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    let customerId: string | null = userSubscription?.stripe_customer_id || null

    // If the user doesn't have a customer ID, create one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: {
          userId: user.id,
        },
      })
      customerId = customer.id
    }

    // Create the checkout session
    const session = isRecurring
      ? await stripe.checkout.sessions.create({
          customer: customerId,
          payment_method_types: ["card"],
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          mode: "subscription",
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/community/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/community/subscription?canceled=true`,
          metadata: {
            userId: user.id,
            planType,
          },
          allow_promotion_codes: true,
        })
      : await stripe.checkout.sessions.create({
          customer: customerId,
          payment_method_types: ["card"],
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/community/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/community/subscription?canceled=true`,
          metadata: {
            userId: user.id,
            planType,
            isRecurring: "false",
          },
          allow_promotion_codes: true,
        })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

export async function POST(request: Request) {
  try {
    const { amount, currency } = await request.json()

    // Get the user from Supabase
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Validate client-supplied values. Amount/currency come straight from the
    // client, so guard against price manipulation (e.g. paying 1 cent) and
    // unexpected currencies. Stripe amounts are integers in the smallest unit.
    const ALLOWED_CURRENCIES = ["usd", "sar", "aed", "egp", "eur", "gbp"]
    const MIN_AMOUNT = 100 // smallest unit (e.g. 1.00)
    const MAX_AMOUNT = 1_000_000 // smallest unit (e.g. 10,000.00)

    if (typeof amount !== "number" || !Number.isInteger(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      return NextResponse.json({ message: "Invalid amount" }, { status: 400 })
    }

    if (typeof currency !== "string" || !ALLOWED_CURRENCIES.includes(currency.toLowerCase())) {
      return NextResponse.json({ message: "Invalid currency" }, { status: 400 })
    }

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency.toLowerCase(),
      metadata: {
        userId: user.id,
      },
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (error) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

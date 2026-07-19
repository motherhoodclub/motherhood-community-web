import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { getRequestAccess } from "@/lib/entitlements-server"
import { canAccessTier } from "@/lib/entitlements"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// GET /api/workshops — list workshops with the Zoom/recording URL stripped for
// any workshop the caller's tier can't access (real server-side gating; the
// client never receives the URL for locked workshops).
export async function GET() {
  try {
    const access = await getRequestAccess()

    const { data: workshops, error } = await supabaseAdmin
      .from("workshops")
      .select("*")
      .order("date", { ascending: true })

    if (error) {
      console.error("Error fetching workshops:", error)
      return NextResponse.json({ error: "Failed to fetch workshops" }, { status: 500 })
    }

    const result = (workshops ?? []).map((w) => {
      const hasAccess = canAccessTier(w.min_tier, { planType: access.planType, isAdmin: access.isAdmin })
      return { ...w, zoom_url: hasAccess ? w.zoom_url : null, hasAccess }
    })

    return NextResponse.json({ workshops: result })
  } catch (error) {
    console.error("Error in workshops API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { getRequestAccess } from "@/lib/entitlements-server"
import { canAccessTier } from "@/lib/entitlements"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// GET /api/workshops/[id] — workshop detail. The Zoom/recording URL is only
// returned when the caller's subscription tier can access it.
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const access = await getRequestAccess()

    const { data: workshop, error } = await supabaseAdmin
      .from("workshops")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error || !workshop) {
      return NextResponse.json({ error: "Workshop not found" }, { status: 404 })
    }

    const hasAccess = canAccessTier(workshop.min_tier, { planType: access.planType, isAdmin: access.isAdmin })

    return NextResponse.json({ ...workshop, zoom_url: hasAccess ? workshop.zoom_url : null, hasAccess })
  } catch (error) {
    console.error("Error in workshop detail API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

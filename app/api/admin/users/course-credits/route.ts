import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// GET /api/admin/users/course-credits?user_id=... — current bonus + usage.
export async function GET(request: Request) {
  const auth = await requireAdmin()
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const userId = new URL(request.url).searchParams.get("user_id")
  if (!userId) return NextResponse.json({ error: "user_id required" }, { status: 400 })

  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("bonus_course_credits")
    .eq("id", userId)
    .single()

  const { count } = await supabaseAdmin
    .from("course_enrollments")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)

  return NextResponse.json({
    bonus_course_credits: profile?.bonus_course_credits ?? 0,
    enrolled_count: count ?? 0,
  })
}

// POST /api/admin/users/course-credits { user_id, bonus_course_credits }
export async function POST(request: Request) {
  const auth = await requireAdmin()
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { user_id, bonus_course_credits } = await request.json()
  if (!user_id) return NextResponse.json({ error: "user_id required" }, { status: 400 })

  const value = Math.max(0, Math.floor(Number(bonus_course_credits) || 0))

  const { error } = await supabaseAdmin
    .from("user_profiles")
    .update({ bonus_course_credits: value })
    .eq("id", user_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, bonus_course_credits: value })
}

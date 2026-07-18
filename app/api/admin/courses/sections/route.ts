import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// POST create / PUT update / DELETE a course section.
export async function POST(request: Request) {
  const auth = await requireAdmin()
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { course_id, title, display_order } = await request.json()
  if (!course_id || !title?.trim()) return NextResponse.json({ error: "course_id and title required" }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from("course_sections")
    .insert({ course_id, title, display_order: Number(display_order) || 0 })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  const auth = await requireAdmin()
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id, ...fields } = await request.json()
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  if (fields.display_order !== undefined) fields.display_order = Number(fields.display_order) || 0

  const { data, error } = await supabaseAdmin.from("course_sections").update(fields).eq("id", id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin()
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const id = new URL(request.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const { error } = await supabaseAdmin.from("course_sections").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

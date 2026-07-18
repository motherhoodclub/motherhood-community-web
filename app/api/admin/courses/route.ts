import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// GET /api/admin/courses — list all courses (incl. drafts) with lesson counts.
export async function GET() {
  const auth = await requireAdmin()
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { data: courses, error } = await supabaseAdmin
    .from("courses")
    .select("*")
    .order("display_order", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: lessons } = await supabaseAdmin.from("course_lessons").select("course_id")
  const counts = new Map<string, number>()
  for (const l of lessons ?? []) counts.set(l.course_id, (counts.get(l.course_id) ?? 0) + 1)

  return NextResponse.json({
    courses: (courses ?? []).map((c) => ({ ...c, lesson_count: counts.get(c.id) ?? 0 })),
  })
}

// POST /api/admin/courses — create a course.
export async function POST(request: Request) {
  const auth = await requireAdmin()
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json()
  const { title, description, cover_image_url, min_tier, requires_credit, published, display_order } = body

  if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from("courses")
    .insert({
      title,
      description: description ?? null,
      cover_image_url: cover_image_url ?? null,
      min_tier: Number(min_tier) || 3,
      requires_credit: requires_credit ?? true,
      published: published ?? false,
      display_order: Number(display_order) || 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PUT /api/admin/courses — update a course.
export async function PUT(request: Request) {
  const auth = await requireAdmin()
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json()
  const { id, ...fields } = body
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

  if (fields.min_tier !== undefined) fields.min_tier = Number(fields.min_tier) || 0
  if (fields.display_order !== undefined) fields.display_order = Number(fields.display_order) || 0

  const { data, error } = await supabaseAdmin.from("courses").update(fields).eq("id", id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/admin/courses?id=... — delete a course (cascades to sections/lessons).
export async function DELETE(request: Request) {
  const auth = await requireAdmin()
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const id = new URL(request.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

  const { error } = await supabaseAdmin.from("courses").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

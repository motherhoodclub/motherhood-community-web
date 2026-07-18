import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// GET /api/admin/courses/[id] — full course with sections + lessons for editing.
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin()
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { data: course, error } = await supabaseAdmin.from("courses").select("*").eq("id", params.id).single()
  if (error || !course) return NextResponse.json({ error: "Course not found" }, { status: 404 })

  const [{ data: sections }, { data: lessons }] = await Promise.all([
    supabaseAdmin.from("course_sections").select("*").eq("course_id", params.id).order("display_order"),
    supabaseAdmin.from("course_lessons").select("*").eq("course_id", params.id).order("display_order"),
  ])

  const sectionList = (sections ?? []).map((s) => ({
    ...s,
    lessons: (lessons ?? []).filter((l) => l.section_id === s.id),
  }))

  return NextResponse.json({ ...course, sections: sectionList })
}

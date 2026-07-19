import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { getRequestAccess } from "@/lib/entitlements-server"
import { canAccessCourse } from "@/lib/courses"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// POST /api/courses/[id]/progress { lesson_id, completed } — mark a lesson
// complete/incomplete. Only users who can actually watch the course may track
// progress on it.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const access = await getRequestAccess()
    if (!access.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { lesson_id, completed } = await request.json()
    if (!lesson_id) return NextResponse.json({ error: "lesson_id required" }, { status: 400 })

    const { data: course } = await supabaseAdmin
      .from("courses")
      .select("id,min_tier,requires_credit")
      .eq("id", params.id)
      .single()
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 })

    // Verify access (enrollment/tier) before allowing progress writes.
    const { data: enrollments } = await supabaseAdmin
      .from("course_enrollments")
      .select("course_id")
      .eq("user_id", access.user.id)
    const enrolledIds = new Set((enrollments ?? []).map((e) => e.course_id))
    if (!canAccessCourse(course, { rank: access.rank, isAdmin: access.isAdmin, enrolledIds })) {
      return NextResponse.json({ error: "No access to this course" }, { status: 403 })
    }

    // Ensure the lesson belongs to this course.
    const { data: lesson } = await supabaseAdmin
      .from("course_lessons")
      .select("id")
      .eq("id", lesson_id)
      .eq("course_id", params.id)
      .single()
    if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 })

    if (completed) {
      const { error } = await supabaseAdmin
        .from("course_progress")
        .upsert(
          { user_id: access.user.id, course_id: params.id, lesson_id },
          { onConflict: "user_id,lesson_id", ignoreDuplicates: true },
        )
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      const { error } = await supabaseAdmin
        .from("course_progress")
        .delete()
        .eq("user_id", access.user.id)
        .eq("lesson_id", lesson_id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in course progress API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

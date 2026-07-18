import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { getRequestAccess } from "@/lib/entitlements-server"
import { canAccessCourse, creditsRemaining } from "@/lib/courses"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// GET /api/courses — list published courses with the caller's access flags.
export async function GET() {
  try {
    const access = await getRequestAccess()

    let query = supabaseAdmin.from("courses").select("*").order("display_order", { ascending: true })
    // Non-admins only see published courses.
    if (!access.isAdmin) query = query.eq("published", true)

    const { data: courses, error } = await query
    if (error) {
      console.error("Error fetching courses:", error)
      return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 })
    }

    // Enrollments for this user (to mark unlocked courses).
    let enrolledIds = new Set<string>()
    if (access.user) {
      const { data: enrollments } = await supabaseAdmin
        .from("course_enrollments")
        .select("course_id")
        .eq("user_id", access.user.id)
      enrolledIds = new Set((enrollments ?? []).map((e) => e.course_id))
    }

    const creditsLeft = creditsRemaining(access.rank, enrolledIds.size, access.isAdmin)

    const result = (courses ?? []).map((course) => ({
      ...course,
      enrolled: enrolledIds.has(course.id),
      hasAccess: canAccessCourse(course, { rank: access.rank, isAdmin: access.isAdmin, enrolledIds }),
    }))

    return NextResponse.json({ courses: result, creditsRemaining: creditsLeft })
  } catch (error) {
    console.error("Error in courses API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

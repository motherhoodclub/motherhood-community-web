import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { getRequestAccess } from "@/lib/entitlements-server"
import { canRedeemCourse, creditsRemaining } from "@/lib/courses"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// POST /api/courses/[id]/enroll — spend one course credit to unlock a course.
export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const access = await getRequestAccess()
    if (!access.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: course, error } = await supabaseAdmin
      .from("courses")
      .select("id,min_tier,requires_credit,published")
      .eq("id", params.id)
      .single()
    if (error || !course || !course.published) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Current enrollments -> remaining credits.
    const { data: enrollments } = await supabaseAdmin
      .from("course_enrollments")
      .select("course_id")
      .eq("user_id", access.user.id)
    const enrolledIds = new Set((enrollments ?? []).map((e) => e.course_id))

    if (enrolledIds.has(course.id)) {
      return NextResponse.json({ success: true, alreadyEnrolled: true })
    }

    const creditsLeft = creditsRemaining(access.rank, enrolledIds.size, access.isAdmin, access.bonusCredits)
    if (!canRedeemCourse(course, { rank: access.rank, isAdmin: access.isAdmin, enrolledIds, creditsLeft })) {
      return NextResponse.json({ error: "لا يمكن فتح هذه الدورة برصيدك الحالي" }, { status: 403 })
    }

    const { error: insertError } = await supabaseAdmin
      .from("course_enrollments")
      .insert({ user_id: access.user.id, course_id: course.id })
    if (insertError) {
      // Unique violation => a concurrent request already enrolled; treat as success.
      if ((insertError as any).code === "23505") {
        return NextResponse.json({ success: true, alreadyEnrolled: true })
      }
      console.error("Error enrolling in course:", insertError)
      return NextResponse.json({ error: "Failed to unlock course" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      creditsRemaining: creditsRemaining(access.rank, enrolledIds.size + 1, access.isAdmin, access.bonusCredits),
    })
  } catch (error) {
    console.error("Error in course enroll API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

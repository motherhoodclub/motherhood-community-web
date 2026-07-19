import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { getRequestAccess } from "@/lib/entitlements-server"
import { canAccessCourse, creditsRemaining } from "@/lib/courses"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// GET /api/courses/[id] — course detail. Lesson video URLs are only included
// when the caller is allowed to watch; otherwise they are stripped and the
// lesson is marked locked (real server-side enforcement).
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const access = await getRequestAccess()

    const { data: course, error } = await supabaseAdmin.from("courses").select("*").eq("id", params.id).single()
    if (error || !course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }
    if (!course.published && !access.isAdmin) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Enrollment state + remaining credits.
    let enrolledIds = new Set<string>()
    if (access.user) {
      const { data: enrollments } = await supabaseAdmin
        .from("course_enrollments")
        .select("course_id")
        .eq("user_id", access.user.id)
      enrolledIds = new Set((enrollments ?? []).map((e) => e.course_id))
    }
    const hasAccess = canAccessCourse(course, { rank: access.rank, isAdmin: access.isAdmin, enrolledIds })

    const [{ data: sections }, { data: lessons }, { data: progress }] = await Promise.all([
      supabaseAdmin.from("course_sections").select("*").eq("course_id", params.id).order("display_order"),
      supabaseAdmin.from("course_lessons").select("*").eq("course_id", params.id).order("display_order"),
      access.user
        ? supabaseAdmin
            .from("course_progress")
            .select("lesson_id")
            .eq("user_id", access.user.id)
            .eq("course_id", params.id)
        : Promise.resolve({ data: [] as { lesson_id: string }[] }),
    ])
    const completedLessonIds = (progress ?? []).map((p) => p.lesson_id)

    // Group lessons under their section, gating video URLs.
    const gatedLesson = (l: any) => ({
      ...l,
      video_url: hasAccess ? l.video_url : null,
      attachment_url: hasAccess ? l.attachment_url : null,
      locked: !hasAccess,
    })

    const sectionList = (sections ?? []).map((s) => ({
      ...s,
      lessons: (lessons ?? []).filter((l) => l.section_id === s.id).map(gatedLesson),
    }))
    // Lessons not attached to any section (fallback bucket).
    const orphanLessons = (lessons ?? []).filter((l) => !l.section_id).map(gatedLesson)
    if (orphanLessons.length > 0) {
      sectionList.push({ id: "__none__", course_id: params.id, title: "", display_order: 9999, lessons: orphanLessons })
    }

    return NextResponse.json({
      ...course,
      sections: sectionList,
      hasAccess,
      enrolled: enrolledIds.has(course.id),
      creditsRemaining: creditsRemaining(access.rank, enrolledIds.size, access.isAdmin, access.bonusCredits),
      completedLessonIds,
    })
  } catch (error) {
    console.error("Error in course detail API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

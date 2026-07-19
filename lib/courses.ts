import { TIER_RANK } from "./entitlements"

/**
 * Courses domain types + access logic.
 *
 * Access rules (see the courses migration):
 *  - Eligible when the user's access rank >= course.min_tier.
 *  - If requires_credit, the user must have unlocked the course (an enrollment
 *    row) which costs one course credit. Annual members get COURSE_CREDITS.
 *  - Admins bypass everything.
 */

export interface Course {
  id: string
  title: string
  description: string | null
  cover_image_url: string | null
  min_tier: number
  requires_credit: boolean
  published: boolean
  display_order: number
  created_at?: string
  updated_at?: string
}

export interface CourseSection {
  id: string
  course_id: string
  title: string
  display_order: number
}

export interface CourseLesson {
  id: string
  course_id: string
  section_id: string | null
  title: string
  description: string | null
  /** Only populated by the API when the user is allowed to watch. */
  video_url: string | null
  duration: string | null
  attachment_url: string | null
  display_order: number
  /** Set by the API to true when the lesson is gated for this user. */
  locked?: boolean
}

export interface SectionWithLessons extends CourseSection {
  lessons: CourseLesson[]
}

export interface CourseDetail extends Course {
  sections: SectionWithLessons[]
  /** Whether the requesting user can watch this course's lessons. */
  hasAccess: boolean
  /** Whether the user is enrolled (has spent a credit on this course). */
  enrolled: boolean
  /** Course credits the user has left to spend. */
  creditsRemaining: number
  /** Lesson ids the user has marked complete (progress tracking). */
  completedLessonIds: string[]
}

/** Number of "choose your course" credits granted per subscription tier. */
export const COURSE_CREDITS_BY_RANK: Record<number, number> = {
  [TIER_RANK.premium]: 2, // annual members choose 2 recorded courses
}

/**
 * Course credits granted by a user's plan plus any admin-granted bonus
 * (admins are effectively unlimited).
 */
export function grantedCourseCredits(rank: number, isAdmin?: boolean, bonus = 0): number {
  if (isAdmin) return Number.POSITIVE_INFINITY
  return (COURSE_CREDITS_BY_RANK[rank] ?? 0) + Math.max(0, bonus)
}

export function creditsRemaining(rank: number, enrollmentCount: number, isAdmin?: boolean, bonus = 0): number {
  if (isAdmin) return Number.POSITIVE_INFINITY
  return Math.max(0, grantedCourseCredits(rank, false, bonus) - enrollmentCount)
}

/** Can the user watch this course right now? */
export function canAccessCourse(
  course: Pick<Course, "id" | "min_tier" | "requires_credit">,
  opts: { rank: number; isAdmin?: boolean; enrolledIds?: Set<string> },
): boolean {
  if (opts.isAdmin) return true
  if (opts.rank < course.min_tier) return false
  if (!course.requires_credit) return true
  return opts.enrolledIds?.has(course.id) ?? false
}

/** Is the user eligible to spend a credit to unlock this (locked) course? */
export function canRedeemCourse(
  course: Pick<Course, "id" | "min_tier" | "requires_credit">,
  opts: { rank: number; isAdmin?: boolean; enrolledIds?: Set<string>; creditsLeft: number },
): boolean {
  if (opts.isAdmin) return false // admins already have access, nothing to redeem
  if (!course.requires_credit) return false
  if (opts.rank < course.min_tier) return false
  if (opts.enrolledIds?.has(course.id)) return false
  return opts.creditsLeft > 0
}

/**
 * Convert a YouTube / Vimeo watch URL into an embeddable player URL.
 * Falls back to the original URL if it is already an embed or unrecognised.
 */
export function videoEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const trimmed = url.trim()

  // YouTube: youtu.be/ID, watch?v=ID, /embed/ID, /shorts/ID
  const yt =
    trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/)?.[1]
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt}`

  // Vimeo: vimeo.com/ID or player.vimeo.com/video/ID
  const vimeo = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1]
  if (vimeo) return `https://player.vimeo.com/video/${vimeo}`

  return trimmed
}

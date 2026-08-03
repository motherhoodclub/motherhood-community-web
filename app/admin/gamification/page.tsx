import { createClient } from "@supabase/supabase-js"
import { GamificationManagement } from "@/components/admin/GamificationManagement"

export const dynamic = "force-dynamic"

export default async function GamificationPage() {
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: users }, { data: badges }, { data: userBadges }] = await Promise.all([
    serviceClient
      .from("user_profiles")
      .select("id, username, avatar_url, points, is_admin")
      .order("points", { ascending: false })
      .limit(500),
    serviceClient.from("badges").select("*").order("sort_order", { ascending: true }),
    serviceClient.from("user_badges").select("user_id, badge_id, earned_at"),
  ])

  // Group earned badges per user.
  const earnedByUser: Record<string, string[]> = {}
  ;(userBadges || []).forEach((ub: any) => {
    ;(earnedByUser[ub.user_id] ||= []).push(ub.badge_id)
  })

  const usersWithBadges = (users || []).map((u: any) => ({
    ...u,
    points: u.points ?? 0,
    badge_ids: earnedByUser[u.id] || [],
  }))

  return (
    <GamificationManagement
      initialUsers={usersWithBadges}
      initialBadges={badges || []}
    />
  )
}

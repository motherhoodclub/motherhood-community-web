import { createClient } from "@supabase/supabase-js"
import { RewardsManagement } from "@/components/admin/RewardsManagement"

export const dynamic = "force-dynamic"

export default async function RewardsPage() {
  // Service-role client for admin reads (bypasses RLS), same pattern as the
  // subscriptions dashboard.
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [
    { data: rewards },
    { data: redemptions },
    { data: profiles },
    { data: courses },
    { data: workshops },
  ] = await Promise.all([
    serviceClient.from("rewards").select("*").order("created_at", { ascending: false }),
    serviceClient
      .from("reward_redemptions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500),
    serviceClient.from("user_profiles").select("id, username, avatar_url"),
    serviceClient.from("courses").select("id, title").order("title", { ascending: true }),
    serviceClient.from("workshops").select("id, title, date").order("date", { ascending: false }),
  ])

  const profileMap: Record<string, { username: string | null; avatar_url: string | null }> = {}
  ;(profiles || []).forEach((p: any) => {
    profileMap[p.id] = { username: p.username, avatar_url: p.avatar_url }
  })

  const redemptionsWithUser = (redemptions || []).map((r: any) => ({
    ...r,
    user_name: profileMap[r.user_id]?.username || "مستخدم",
  }))

  return (
    <RewardsManagement
      initialRewards={rewards || []}
      initialRedemptions={redemptionsWithUser}
      courses={courses || []}
      workshops={workshops || []}
    />
  )
}

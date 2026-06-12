import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Shared server-side admin gate for API routes.
// Returns { error, status } when the caller is not an authenticated admin,
// otherwise returns the authenticated { user, supabase }.
export async function requireAdmin() {
  const supabase = createRouteHandlerClient({ cookies })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized", status: 401 as const }
  }

  const { data: profile } = await supabase.from("user_profiles").select("is_admin").eq("id", user.id).single()

  if (!profile?.is_admin) {
    return { error: "Forbidden", status: 403 as const }
  }

  return { user, supabase }
}

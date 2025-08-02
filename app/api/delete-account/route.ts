import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function DELETE() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = user.id

    // Create admin client with service role key
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Delete user data from all tables in the correct order using admin client
    try {
      // Delete from tables that reference user_profiles
      await supabaseAdmin.from("comments").delete().eq("user_id", userId)
      await supabaseAdmin.from("topics").delete().eq("user_id", userId)
      await supabaseAdmin.from("questions").delete().eq("user_id", userId)
      await supabaseAdmin.from("question_replies").delete().eq("user_id", userId)
      await supabaseAdmin.from("workshop_registrations").delete().eq("user_id", userId)
      await supabaseAdmin.from("user_subscriptions").delete().eq("user_id", userId)
      await supabaseAdmin.from("user_payments").delete().eq("user_id", userId)
      await supabaseAdmin.from("user_settings").delete().eq("user_id", userId)
      await supabaseAdmin.from("notification_settings").delete().eq("user_id", userId)
      await supabaseAdmin.from("chat_messages").delete().eq("user_id", userId)
      await supabaseAdmin.from("downloadable_files").delete().eq("created_by", userId)

      // Delete user profile
      await supabaseAdmin.from("user_profiles").delete().eq("id", userId)
    } catch (dataError) {
      console.error("Error deleting user data:", dataError)
      // Continue with auth deletion even if some data deletion fails
    }

    // Finally, delete the auth user using admin client with soft delete
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId, true)

    if (deleteError) {
      console.error("Error deleting user from auth:", deleteError)
      return NextResponse.json({ error: "Failed to delete user account" }, { status: 500 })
    }

    return NextResponse.json({ message: "Account deleted successfully" })
  } catch (error) {
    console.error("Error deleting account:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  // Regular client for checking admin status
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase.from("user_profiles").select("is_admin").eq("id", user.id).single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Create a direct Supabase client with service role key for admin operations
    // This is necessary to access auth.users data
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    // Get all user profiles using admin client to bypass RLS
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError.message)
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    console.log(`Retrieved ${profiles.length} user profiles`)

    // Get all auth users using the admin client with service role
    // Fetch ALL pages to get ALL users
    let allAuthUsers: any[] = []
    const perPage = 1000
    let page = 1
    let hasMore = true

    try {
      while (hasMore) {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage,
        })

        if (authError) {
          console.error("Error fetching auth users:", authError.message)
          // If we can't get auth data, return just the profiles
          return NextResponse.json({
            users: profiles,
            debug: {
              profilesCount: profiles.length,
              authError: authError.message,
              serviceRoleAvailable: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            },
          })
        }

        const users = authData.users || []
        allAuthUsers = [...allAuthUsers, ...users]

        // If we got less than perPage, we've reached the end
        if (users.length < perPage) {
          hasMore = false
        } else {
          page++
        }
      }
    } catch (err: any) {
      console.error("Error fetching auth users:", err.message)
      return NextResponse.json({
        users: profiles,
        debug: {
          profilesCount: profiles.length,
          authError: err.message,
          serviceRoleAvailable: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        },
      })
    }

    const authUsers = { users: allAuthUsers }
    console.log(`Retrieved ${authUsers.users.length} auth users`)

    // Log first few auth users for debugging (without sensitive info)
    if (authUsers.users.length > 0) {
      console.log(
        "First few auth users:",
        authUsers.users.slice(0, 3).map((u) => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
        })),
      )
    }

    // Combine the data from both sources
    // First, create a map of profiles by ID
    const profilesMap = new Map(profiles.map((p) => [p.id, p]))

    // Start with profiles and add auth data
    const combinedUsers = profiles.map((profile) => {
      const authUser = authUsers.users.find((u) => u.id === profile.id)

      return {
        ...profile,
        // Use auth email first, then profile email as fallback
        email: authUser?.email || profile.email || null,
        phone: authUser?.phone || profile.phone || null,
        last_sign_in_at: authUser?.last_sign_in_at || null,
      }
    })

    // Add auth users that don't have a profile (orphaned auth users)
    const orphanedAuthUsers = authUsers.users
      .filter((authUser) => !profilesMap.has(authUser.id))
      .map((authUser) => ({
        id: authUser.id,
        username: null,
        full_name: authUser.user_metadata?.full_name || null,
        email: authUser.email,
        phone: authUser.phone || null,
        is_admin: false,
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        // Mark as orphaned for visibility
        _orphaned: true,
      }))

    // Combine both lists
    const allUsers = [...combinedUsers, ...orphanedAuthUsers]

    // Log debug info
    console.log(`Combined: ${combinedUsers.length} with profiles, ${orphanedAuthUsers.length} orphaned auth users`)

    return NextResponse.json({
      users: allUsers,
      debug: {
        profilesCount: profiles.length,
        authUsersCount: authUsers.users.length,
        combinedCount: allUsers.length,
        orphanedCount: orphanedAuthUsers.length,
        serviceRoleAvailable: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    })
  } catch (error) {
    console.error("Unexpected error in users API:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

import { createClient } from "@supabase/supabase-js"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

// Create a Supabase client with the service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
)

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated and is an admin
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (profileError || !profile?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get request body
    const requestData = await request.json()
    const {
      id,
      title,
      content,
      category,
      age_group,
      sorting,
      is_hot,
      is_sticky,
      featured_image_url,
      media_urls,
      tags,
    } = requestData

    if (!id) {
      return NextResponse.json({ error: "Topic ID is required" }, { status: 400 })
    }

    console.log("API: Received update request for topic:", id)
    console.log("API: Update data:", {
      title,
      content,
      category,
      sorting,
      is_hot,
      is_sticky,
      featured_image_url,
      media_urls: media_urls?.length || 0,
      tags: tags?.length || 0,
    })

    // Execute a direct update to the topic
    // Using the service role key for admin privileges
    const { data, error } = await supabaseAdmin
      .from("topics")
      .update({
        title,
        content,
        category,
        age_group,
        sorting: sorting || "",
        is_hot: is_hot || false,
        is_sticky: is_sticky || false,
        featured_image_url: featured_image_url,
        media_urls: media_urls || [],
        tags: tags || [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      console.error("API: Update error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Verify the update was successful
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from("topics")
      .select("title, content, featured_image_url, media_urls, updated_at")
      .eq("id", id)
      .single()

    if (verifyError) {
      console.error("API: Verification error:", verifyError)
      return NextResponse.json({ error: verifyError.message }, { status: 500 })
    }

    console.log("API: Verification data:", verifyData)

    return NextResponse.json({
      success: true,
      method: "update",
      verification: verifyData,
    })
  } catch (error) {
    console.error("API: Server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

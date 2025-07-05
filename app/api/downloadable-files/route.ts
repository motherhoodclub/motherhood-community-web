import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    const { data: files, error } = await supabase
      .from("downloadable_files")
      .select(`
        *,
        user_profiles!downloadable_files_user_id_fkey (
          username,
          avatar_url
        )
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching downloadable files:", error)
      return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 })
    }

    const { count } = await supabase.from("downloadable_files").select("*", { count: "exact", head: true })

    return NextResponse.json({
      files: files || [],
      totalCount: count || 0,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error("Error in downloadable files API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: userProfile } = await supabase.from("user_profiles").select("is_admin").eq("id", user.id).single()

    const isAdmin =
      userProfile?.is_admin === true ||
      userProfile?.is_admin === "true" ||
      userProfile?.is_admin === 1 ||
      userProfile?.is_admin === "1"

    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, featured_image_url, file_url, file_drive_link, file_type, file_size } = body

    const { data, error } = await supabase
      .from("downloadable_files")
      .insert({
        title,
        description,
        featured_image_url,
        file_url,
        file_drive_link,
        file_type,
        file_size,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating downloadable file:", error)
      return NextResponse.json({ error: "Failed to create file" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in downloadable files POST API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

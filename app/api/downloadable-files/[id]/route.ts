import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data: file, error } = await supabaseAdmin
      .from("downloadable_files")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Error fetching downloadable file:", error)
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    return NextResponse.json(file)
  } catch (error) {
    console.error("Error in downloadable file GET API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    if (!userProfile?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, featured_image_url, file_url, file_drive_link, file_type, file_size, min_tier } = body

    const { data, error } = await supabase
      .from("downloadable_files")
      .update({
        title,
        description,
        featured_image_url,
        file_url,
        file_drive_link,
        file_type,
        file_size,
        min_tier: Number(min_tier) || 0,
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating downloadable file:", error)
      return NextResponse.json({ error: "Failed to update file" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in downloadable file PUT API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    if (!userProfile?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { error } = await supabase.from("downloadable_files").delete().eq("id", params.id)

    if (error) {
      console.error("Error deleting downloadable file:", error)
      return NextResponse.json({ error: "Failed to delete file" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in downloadable file DELETE API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

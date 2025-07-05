import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id } = params

    const { data: file, error } = await supabase
      .from("downloadable_files")
      .select(`
        *,
        user_profiles!downloadable_files_user_id_fkey (
          username,
          avatar_url
        )
      `)
      .eq("id", id)
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

    const isAdmin =
      userProfile?.is_admin === true ||
      userProfile?.is_admin === "true" ||
      userProfile?.is_admin === 1 ||
      userProfile?.is_admin === "1"

    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { id } = params
    const body = await request.json()

    const { data, error } = await supabase.from("downloadable_files").update(body).eq("id", id).select().single()

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

    const isAdmin =
      userProfile?.is_admin === true ||
      userProfile?.is_admin === "true" ||
      userProfile?.is_admin === 1 ||
      userProfile?.is_admin === "1"

    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { id } = params

    const { error } = await supabase.from("downloadable_files").delete().eq("id", id)

    if (error) {
      console.error("Error deleting downloadable file:", error)
      return NextResponse.json({ error: "Failed to delete file" }, { status: 500 })
    }

    return NextResponse.json({ message: "File deleted successfully" })
  } catch (error) {
    console.error("Error in downloadable file DELETE API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies })

  // Check if user is authenticated and is admin
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check admin status
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (profileError || !profile?.is_admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  try {
    // First, get the topic to access media URLs
    const { data: topic, error: fetchError } = await supabase
      .from("topics")
      .select("featured_image_url, media_urls")
      .eq("id", params.id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    // Delete related comments first (if not handled by CASCADE)
    await supabase.from("comments").delete().eq("topic_id", params.id)

    // Delete the topic
    const { error: deleteError } = await supabase.from("topics").delete().eq("id", params.id)

    if (deleteError) {
      throw deleteError
    }

    // Clean up media files from storage
    const filesToDelete = []

    if (topic.featured_image_url) {
      filesToDelete.push(topic.featured_image_url)
    }

    if (topic.media_urls && topic.media_urls.length > 0) {
      filesToDelete.push(...topic.media_urls)
    }

    // Delete files from storage (don't fail the request if this fails)
    if (filesToDelete.length > 0) {
      try {
        await supabase.storage.from("uploads").remove(filesToDelete)
      } catch (storageError) {
        console.error("Failed to delete media files:", storageError)
        // Continue - don't fail the request for storage cleanup issues
      }
    }

    // Log the deletion (optional - you could add an audit log table)
    console.log(`Topic ${params.id} deleted by admin ${user.id}`)

    return NextResponse.json({ success: true, message: "Topic deleted successfully" })
  } catch (error) {
    console.error("Error deleting topic:", error)
    return NextResponse.json({ error: "Failed to delete topic" }, { status: 500 })
  }
}

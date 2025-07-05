import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

// Create service role client
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Increment download count
    const { error } = await supabaseAdmin.rpc("increment_download_count", {
      file_id: params.id,
    })

    if (error) {
      console.error("Error incrementing download count:", error)
      return NextResponse.json({ error: "Failed to track download" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in download tracking API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

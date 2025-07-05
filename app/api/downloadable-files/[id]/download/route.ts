import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id } = params

    // Increment download count
    const { error } = await supabase.rpc("increment_download_count", { file_id: id })

    if (error) {
      console.error("Error incrementing download count:", error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in download count API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

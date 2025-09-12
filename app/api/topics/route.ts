import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const search = searchParams.get("search")
  const page = Number.parseInt(searchParams.get("page") || "1")
  const limit = 10
  const offset = (page - 1) * limit

  const supabase = createRouteHandlerClient({ cookies })

  let query = supabase
    .from("topics")
    .select(
      `
      *,
      user_profiles!inner(username, avatar_url),
      comments(count)
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (category && category !== "الكل") {
    query = query.eq("category", category)
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
  }

  const { data: topics, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ topics, count, page, totalPages: Math.ceil((count || 0) / limit) })
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { title, content, category } = await request.json()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase.from("topics").insert({ title, content, category, user_id: user.id }).select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data[0])

  // Send notification for new topic
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/new-topic`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topicId: data[0].id,
        title: data[0].title,
        authorId: user.id,
      }),
    })
  } catch (notificationError) {
    console.error("Error sending new topic notification:", notificationError)
    // Continue with the response even if notification fails
  }
}

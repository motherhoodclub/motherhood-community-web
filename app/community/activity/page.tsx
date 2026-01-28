"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"
import ProtectedRoute from "@/components/protected-route"
import Link from "next/link"

export default function ActivityPage() {
  const [activity, setActivity] = useState({
    topics: [],
    comments: [],
    likes: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchActivity()
  }, [])

  const fetchActivity = async () => {
    setIsLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }

    try {
      const [topicsRes, commentsRes, likesRes] = await Promise.all([
        supabase
          .from("topics")
          .select("id, title, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("comments")
          .select("id, content, created_at, topics(id, title)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("topic_likes")
          .select("created_at, topics(id, title)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ])

      setActivity({
        topics: topicsRes.data || [],
        comments: commentsRes.data || [],
        likes: likesRes.data || [],
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch activity",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div>جاري التحميل...</div>
  }

  return (
    <ProtectedRoute>
      <div className="container py-8 animate-fadeIn">
        <h1 className="text-3xl font-bold mb-8 text-right">سجل النشاط</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-right">المواضيع التي أنشأتها</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.topics.length > 0 ? (
              <ul className="space-y-2">
                {activity.topics.map((topic) => (
                  <li key={topic.id} className="text-right">
                    <Link href={`/community/topic/${topic.id}`} className="text-blue-500 hover:underline">
                      {topic.title}
                    </Link>
                    <span className="text-gray-500 text-sm mr-2">
                      {new Date(topic.created_at).toLocaleString("ar-SA-u-ca-gregory")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-right">لم تنشئ أي مواضيع بعد.</p>
            )}
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-right">تعليقاتك</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.comments.length > 0 ? (
              <ul className="space-y-2">
                {activity.comments.map((comment) => (
                  <li key={comment.id} className="text-right">
                    <Link href={`/community/topic/${comment.topics.id}`} className="text-blue-500 hover:underline">
                      {comment.content.substring(0, 50)}...
                    </Link>
                    <span className="text-gray-500 text-sm mr-2">
                      على موضوع: {comment.topics.title} • {new Date(comment.created_at).toLocaleString("ar-SA-u-ca-gregory")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-right">لم تقم بالتعليق على أي موضوع بعد.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-right">إعجاباتك</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.likes.length > 0 ? (
              <ul className="space-y-2">
                {activity.likes.map((like, index) => (
                  <li key={index} className="text-right">
                    <Link href={`/community/topic/${like.topics.id}`} className="text-blue-500 hover:underline">
                      {like.topics.title}
                    </Link>
                    <span className="text-gray-500 text-sm mr-2">
                      {new Date(like.created_at).toLocaleString("ar-SA-u-ca-gregory")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-right">لم تقم بالإعجاب بأي موضوع بعد.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}

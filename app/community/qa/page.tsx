"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import ProtectedRoute from "@/components/protected-route"

export default function QAPage() {
  const [qaTopics, setQATopics] = useState([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchQATopics()
  }, [])

  const fetchQATopics = async () => {
    const { data, error } = await supabase
      .from("qa_topics")
      .select("*, user_profiles(username), qa_answers(count)")
      .order("created_at", { ascending: false })
    if (error) {
      console.error("Error fetching QA topics:", error)
    } else {
      setQATopics(data)
    }
  }

  return (
    <ProtectedRoute>
      <div className="container py-8 animate-fadeIn">
        <h1 className="text-3xl font-bold mb-8 text-right">الأسئلة والأجوبة</h1>
        <div className="flex justify-between items-center mb-6">
          <Button asChild>
            <Link href="/community/qa/new">طرح سؤال جديد</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {qaTopics.map((topic) => (
            <Card key={topic.id}>
              <CardHeader>
                <CardTitle>{topic.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">{topic.content.substring(0, 100)}...</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    بواسطة {topic.user_profiles.username} • {new Date(topic.created_at).toLocaleDateString("ar-SA-u-ca-gregory")}
                  </span>
                  <span className="text-sm text-gray-500">{topic.qa_answers.count} إجابة</span>
                </div>
                <Button asChild className="mt-4">
                  <Link href={`/community/qa/${topic.id}`}>عرض السؤال</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  )
}

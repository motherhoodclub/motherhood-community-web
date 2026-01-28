"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export function RecentTopics() {
  const [recentTopics, setRecentTopics] = useState([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchRecentTopics() {
      const { data, error } = await supabase
        .from("topics")
        .select(`
          id,
          title,
          created_at,
          category,
          user_profiles (
            full_name,
            avatar_url
          )
        `)
        .order("created_at", { ascending: false })
        .limit(5)

      if (error) {
        console.error("Error fetching recent topics:", error)
        return
      }

      setRecentTopics(data)
    }

    fetchRecentTopics()
  }, [supabase])

  return (
    <div className="space-y-8">
      {recentTopics.map((topic) => (
        <div key={topic.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={topic.user_profiles.avatar_url} alt="Avatar" />
            <AvatarFallback>{topic.user_profiles.full_name[0]}</AvatarFallback>
          </Avatar>
          <div className="mr-4 space-y-1">
            <p className="text-sm font-medium leading-none">{topic.title}</p>
            <p className="text-sm text-muted-foreground">
              {topic.user_profiles.full_name} • {topic.category}
            </p>
          </div>
          <div className="mr-auto text-sm text-muted-foreground">
            {new Date(topic.created_at).toLocaleDateString("ar-SA-u-ca-gregory")}
          </div>
        </div>
      ))}
    </div>
  )
}

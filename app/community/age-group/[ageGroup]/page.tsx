"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import TopicCard from "@/components/topic-card"
import Pagination from "@/components/pagination"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default function AgeGroupPage() {
  const params = useParams()
  const ageGroup = decodeURIComponent(params.ageGroup as string)
  const [topics, setTopics] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchTopics()
  }, [currentPage, ageGroup])

  async function fetchTopics() {
    setIsLoading(true)
    try {
      const query = supabase
        .from("topics")
        .select("*", { count: "exact" })
        .eq("age_group", ageGroup)
        .order("created_at", { ascending: false })
        .range((currentPage - 1) * 10, currentPage * 10 - 1)

      const { data, error, count } = await query

      if (error) {
        console.error("Error fetching topics:", error)
      } else {
        setTopics(data || [])
        setTotalPages(Math.ceil((count || 0) / 10))
      }
    } catch (error) {
      console.error("Error in fetchTopics:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">مواضيع الفئة العمرية: {ageGroup}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">تصفح المواضيع المخصصة لهذه الفئة العمرية</p>
        </div>
        <Button asChild>
          <Link href="/community/new-topic">
            <Plus className="h-4 w-4 ml-2" />
            موضوع جديد
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : topics.length > 0 ? (
        <>
          <div className="space-y-6">
            {topics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">لا توجد مواضيع في هذه الفئة العمرية حتى الآن</p>
          <Button asChild className="mt-4">
            <Link href="/community/new-topic">
              <Plus className="h-4 w-4 ml-2" />
              كن أول من يضيف موضوعاً
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}

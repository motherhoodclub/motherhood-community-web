import { Suspense } from "react"
import { notFound } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import TopicList from "@/components/topic-list"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

interface CategoryPageProps {
  params: {
    category: string
  }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const decodedCategory = decodeURIComponent(params.category)
  return {
    title: `مواضيع ${decodedCategory} - مجتمع الأمومة`,
    description: `استكشف المواضيع المتعلقة بـ ${decodedCategory} في مجتمع الأمومة`,
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const supabase = createServerComponentClient({ cookies })
  const decodedCategory = "كل ما يخص اطفال التوحد"

  const { data: categoryTopics, error } = await supabase
    .from("topics")
    .select("*")
    .eq("category", decodedCategory)
    .limit(1)

  if (error) {
    console.error("Error fetching category topics:", error)
    notFound()
  }

  // We continue rendering even if no topics are found

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6 text-right">مواضيع {decodedCategory}</h1>
      <Suspense fallback={<div>جاري التحميل...</div>}>
        <TopicList category={decodedCategory} />
        {categoryTopics.length === 0 && (
          <div className="text-center py-10 bg-gray-50 rounded-lg mt-6">
            <h3 className="text-xl font-medium text-gray-600 mb-2">لا توجد مواضيع في هذا التصنيف حالياً</h3>
            <p className="text-gray-500 mb-4">كن أول من يضيف موضوعاً في تصنيف {decodedCategory}</p>
            {/* Button removed from empty state */}
          </div>
        )}
      </Suspense>
    </div>
  )
}

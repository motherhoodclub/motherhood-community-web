"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"

const sortingOptions = ["الكل", "دروس", "أسئلة", "مشاريع", "نقاشات"]

export function TopicControl() {
  const [topics, setTopics] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categories, setCategories] = useState(["الكل"])
  const [selectedCategory, setSelectedCategory] = useState("الكل")
  const [selectedSorting, setSelectedSorting] = useState("الكل")
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("topic_categories")
        .select("name")
        .order("created_at", { ascending: true })
      if (data) {
        setCategories(["الكل", ...data.map((c) => c.name)])
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchTopics()
  }, [selectedCategory, selectedSorting])

  const fetchTopics = async () => {
    let query = supabase
      .from("topics")
      .select("*, user_profiles(username)")
      .ilike("title", `%${searchTerm}%`)
      .order("created_at", { ascending: false })

    if (selectedCategory !== "الكل") {
      query = query.eq("category", selectedCategory)
    }

    if (selectedSorting !== "الكل") {
      query = query.eq("sorting", selectedSorting)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching topics:", error)
      toast({
        title: "خطأ",
        description: "فشل في جلب المواضيع",
        variant: "destructive",
      })
    } else {
      setTopics(data)
    }
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    fetchTopics()
  }

  const togglePinnedStatus = async (topicId, currentStatus) => {
    const { error } = await supabase.from("topics").update({ is_pinned: !currentStatus }).eq("id", topicId)

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة التثبيت",
        variant: "destructive",
      })
    } else {
      fetchTopics()
      toast({
        title: "تم بنجاح",
        description: "تم تحديث حالة التثبيت",
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Category Filter */}
      <div>
        <p className="text-sm font-medium text-gray-600 mb-2">الفئة:</p>
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="flex flex-wrap h-auto gap-1">
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="text-xs px-3 py-1.5">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Sorting Filter */}
      <div>
        <p className="text-sm font-medium text-gray-600 mb-2">التصنيف:</p>
        <Tabs value={selectedSorting} onValueChange={setSelectedSorting}>
          <TabsList className="flex flex-wrap h-auto gap-1">
            {sortingOptions.map((opt) => (
              <TabsTrigger key={opt} value={opt} className="text-xs px-3 py-1.5">
                {opt}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Search */}
      <Input
        type="text"
        placeholder="البحث عن المواضيع"
        value={searchTerm}
        onChange={handleSearch}
        className="max-w-sm"
      />

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>العنوان</TableHead>
            <TableHead>الكاتب</TableHead>
            <TableHead>الفئة</TableHead>
            <TableHead>الفئة الفرعية</TableHead>
            <TableHead>التصنيف</TableHead>
            <TableHead>تاريخ النشر</TableHead>
            <TableHead>مثبت</TableHead>
            <TableHead>الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topics.map((topic) => (
            <TableRow key={topic.id}>
              <TableCell>{topic.title}</TableCell>
              <TableCell>{topic.user_profiles?.username || "غير معروف"}</TableCell>
              <TableCell>
                {topic.category ? (
                  <Badge variant="outline" className="text-xs">{topic.category}</Badge>
                ) : (
                  <span className="text-gray-400 text-xs">—</span>
                )}
              </TableCell>
              <TableCell>
                {topic.subcategory ? (
                  <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/30">{topic.subcategory}</Badge>
                ) : (
                  <span className="text-gray-400 text-xs">—</span>
                )}
              </TableCell>
              <TableCell>
                {topic.sorting ? (
                  <Badge variant="secondary" className="text-xs">{topic.sorting}</Badge>
                ) : (
                  <span className="text-gray-400 text-xs">—</span>
                )}
              </TableCell>
              <TableCell>{new Date(topic.created_at).toLocaleDateString("ar-SA-u-ca-gregory")}</TableCell>
              <TableCell>
                <Switch
                  checked={topic.is_pinned}
                  onCheckedChange={() => togglePinnedStatus(topic.id, topic.is_pinned)}
                />
              </TableCell>
              <TableCell>
                <Button variant="outline" size="sm">
                  تعديل
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

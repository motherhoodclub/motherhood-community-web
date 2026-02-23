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
import { Trash2, Eye } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const categories = ["الكل", "الحمل والولادة", "تربية الأطفال", "الصحة والتغذية", "كل ما يخص اطفال التوحد", "أخرى"]
const sortingOptions = ["الكل", "دروس", "أسئلة", "مشاريع", "نقاشات"]

export default function AdminTopicsPage() {
  const [topics, setTopics] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("الكل")
  const [selectedSorting, setSelectedSorting] = useState("الكل")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [topicToDelete, setTopicToDelete] = useState<any>(null)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    fetchTopics()
  }, [selectedCategory, selectedSorting, debouncedSearch])

  const fetchTopics = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from("topics")
        .select("*, user_profiles(username)")
        .order("created_at", { ascending: false })

      if (selectedCategory !== "الكل") {
        query = query.eq("category", selectedCategory)
      }

      if (selectedSorting !== "الكل") {
        query = query.eq("sorting", selectedSorting)
      }

      if (debouncedSearch.trim()) {
        query = query.ilike("title", `%${debouncedSearch}%`)
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
        setTopics(data || [])
      }
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const togglePinnedStatus = async (topicId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("topics")
      .update({ is_pinned: !currentStatus })
      .eq("id", topicId)

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

  const handleDelete = async () => {
    if (!topicToDelete) return

    const { error } = await supabase
      .from("topics")
      .delete()
      .eq("id", topicToDelete.id)

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل في حذف الموضوع",
        variant: "destructive",
      })
    } else {
      fetchTopics()
      toast({
        title: "تم بنجاح",
        description: "تم حذف الموضوع",
      })
    }
    setDeleteDialogOpen(false)
    setTopicToDelete(null)
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">إدارة المواضيع</h1>
        <Badge variant="secondary" className="text-sm">
          {topics.length} موضوع
        </Badge>
      </div>

      {/* Category Filter Tabs */}
      <div className="space-y-3">
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
      </div>

      {/* Search */}
      <Input
        type="text"
        placeholder="البحث عن المواضيع..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />

      {/* Topics Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">العنوان</TableHead>
              <TableHead className="text-right">الكاتب</TableHead>
              <TableHead className="text-right">الفئة</TableHead>
              <TableHead className="text-right">التصنيف</TableHead>
              <TableHead className="text-right">تاريخ النشر</TableHead>
              <TableHead className="text-right">مثبت</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  جاري التحميل...
                </TableCell>
              </TableRow>
            ) : topics.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  لا توجد مواضيع
                  {selectedCategory !== "الكل" && ` في فئة "${selectedCategory}"`}
                  {selectedSorting !== "الكل" && ` بتصنيف "${selectedSorting}"`}
                </TableCell>
              </TableRow>
            ) : (
              topics.map((topic) => (
                <TableRow key={topic.id}>
                  <TableCell className="text-right font-medium max-w-[200px] truncate">
                    {topic.title}
                  </TableCell>
                  <TableCell className="text-right">
                    {topic.user_profiles?.username || "غير معروف"}
                  </TableCell>
                  <TableCell className="text-right">
                    {topic.category ? (
                      <Badge variant="outline" className="text-xs">
                        {topic.category}
                      </Badge>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {topic.sorting ? (
                      <Badge variant="secondary" className="text-xs">
                        {topic.sorting}
                      </Badge>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {new Date(topic.created_at).toLocaleDateString("ar-SA-u-ca-gregory")}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={topic.is_pinned || false}
                      onCheckedChange={() => togglePinnedStatus(topic.id, topic.is_pinned)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a
                          href={`/community/topic/${topic.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setTopicToDelete(topic)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">هل أنت متأكد من حذف هذا الموضوع؟</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              سيتم حذف الموضوع &quot;{topicToDelete?.title}&quot; نهائياً. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

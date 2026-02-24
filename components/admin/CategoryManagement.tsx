"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"
import { Trash2, Plus } from "lucide-react"
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

export function CategoryManagement() {
  const [categories, setCategories] = useState<any[]>([])
  const [newCategoryName, setNewCategoryName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null)
  const [topicCount, setTopicCount] = useState(0)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("topic_categories")
      .select("*")
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching categories:", error)
      toast({
        title: "خطأ",
        description: "فشل في جلب الفئات",
        variant: "destructive",
      })
    } else {
      setCategories(data || [])
    }
    setIsLoading(false)
  }

  const addCategory = async () => {
    if (!newCategoryName.trim()) return

    const { error } = await supabase
      .from("topic_categories")
      .insert({ name: newCategoryName.trim() })

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "خطأ",
          description: "هذه الفئة موجودة بالفعل",
          variant: "destructive",
        })
      } else {
        toast({
          title: "خطأ",
          description: "فشل في إضافة الفئة",
          variant: "destructive",
        })
      }
    } else {
      setNewCategoryName("")
      fetchCategories()
      toast({
        title: "تم بنجاح",
        description: "تمت إضافة الفئة",
      })
    }
  }

  const confirmDelete = async (category: any) => {
    // Check how many topics use this category
    const { count } = await supabase
      .from("topics")
      .select("id", { count: "exact", head: true })
      .eq("category", category.name)

    setTopicCount(count || 0)
    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }

  const deleteCategory = async () => {
    if (!categoryToDelete) return

    const { error } = await supabase
      .from("topic_categories")
      .delete()
      .eq("id", categoryToDelete.id)

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل في حذف الفئة",
        variant: "destructive",
      })
    } else {
      fetchCategories()
      toast({
        title: "تم بنجاح",
        description: "تم حذف الفئة",
      })
    }
    setDeleteDialogOpen(false)
    setCategoryToDelete(null)
  }

  return (
    <div className="space-y-6">
      {/* Add new category */}
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="اسم الفئة الجديدة..."
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCategory()}
          className="max-w-sm"
        />
        <Button onClick={addCategory} disabled={!newCategoryName.trim()}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة فئة
        </Button>
      </div>

      {/* Categories table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>اسم الفئة</TableHead>
            <TableHead>تاريخ الإنشاء</TableHead>
            <TableHead>الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-8">
                جاري التحميل...
              </TableCell>
            </TableRow>
          ) : categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-8">
                لا توجد فئات. أضف فئة جديدة.
              </TableCell>
            </TableRow>
          ) : (
            categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>
                  {new Date(category.created_at).toLocaleDateString("ar-SA-u-ca-gregory")}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => confirmDelete(category)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">
              حذف فئة &quot;{categoryToDelete?.name}&quot;؟
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              {topicCount > 0
                ? `يوجد ${topicCount} موضوع مرتبط بهذه الفئة. لن يتم حذف المواضيع لكنها ستفقد تصنيفها.`
                : "لا توجد مواضيع مرتبطة بهذه الفئة."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteCategory}
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

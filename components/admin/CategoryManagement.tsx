"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"
import { Trash2, Plus, ChevronDown, ChevronLeft } from "lucide-react"
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
  const [deleteType, setDeleteType] = useState<"category" | "subcategory">("category")
  const [subcategoryToDelete, setSubcategoryToDelete] = useState<any>(null)

  // Subcategory state
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [subcategories, setSubcategories] = useState<Record<string, any[]>>({})
  const [newSubcategoryName, setNewSubcategoryName] = useState("")

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

  const fetchSubcategories = async (categoryName: string) => {
    const { data, error } = await supabase
      .from("topic_subcategories")
      .select("*")
      .eq("category_name", categoryName)
      .order("created_at", { ascending: true })

    if (!error && data) {
      setSubcategories((prev) => ({ ...prev, [categoryName]: data }))
    }
  }

  const toggleExpand = (categoryName: string) => {
    if (expandedCategory === categoryName) {
      setExpandedCategory(null)
      setNewSubcategoryName("")
    } else {
      setExpandedCategory(categoryName)
      setNewSubcategoryName("")
      fetchSubcategories(categoryName)
    }
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

  const addSubcategory = async (categoryName: string) => {
    if (!newSubcategoryName.trim()) return

    const { error } = await supabase
      .from("topic_subcategories")
      .insert({ name: newSubcategoryName.trim(), category_name: categoryName })

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "خطأ",
          description: "هذه الفئة الفرعية موجودة بالفعل",
          variant: "destructive",
        })
      } else {
        toast({
          title: "خطأ",
          description: "فشل في إضافة الفئة الفرعية",
          variant: "destructive",
        })
      }
    } else {
      setNewSubcategoryName("")
      fetchSubcategories(categoryName)
      toast({
        title: "تم بنجاح",
        description: "تمت إضافة الفئة الفرعية",
      })
    }
  }

  const confirmDeleteCategory = async (category: any) => {
    const { count } = await supabase
      .from("topics")
      .select("id", { count: "exact", head: true })
      .eq("category", category.name)

    setTopicCount(count || 0)
    setCategoryToDelete(category)
    setDeleteType("category")
    setDeleteDialogOpen(true)
  }

  const confirmDeleteSubcategory = async (subcategory: any) => {
    const { count } = await supabase
      .from("topics")
      .select("id", { count: "exact", head: true })
      .eq("subcategory", subcategory.name)

    setTopicCount(count || 0)
    setSubcategoryToDelete(subcategory)
    setDeleteType("subcategory")
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (deleteType === "category" && categoryToDelete) {
      const { error } = await supabase
        .from("topic_categories")
        .delete()
        .eq("id", categoryToDelete.id)

      if (error) {
        toast({ title: "خطأ", description: "فشل في حذف الفئة", variant: "destructive" })
      } else {
        // Also delete subcategories of this category
        await supabase
          .from("topic_subcategories")
          .delete()
          .eq("category_name", categoryToDelete.name)

        fetchCategories()
        if (expandedCategory === categoryToDelete.name) {
          setExpandedCategory(null)
        }
        toast({ title: "تم بنجاح", description: "تم حذف الفئة" })
      }
    } else if (deleteType === "subcategory" && subcategoryToDelete) {
      const { error } = await supabase
        .from("topic_subcategories")
        .delete()
        .eq("id", subcategoryToDelete.id)

      if (error) {
        toast({ title: "خطأ", description: "فشل في حذف الفئة الفرعية", variant: "destructive" })
      } else {
        if (expandedCategory) fetchSubcategories(expandedCategory)
        toast({ title: "تم بنجاح", description: "تم حذف الفئة الفرعية" })
      }
    }
    setDeleteDialogOpen(false)
    setCategoryToDelete(null)
    setSubcategoryToDelete(null)
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
            <TableHead></TableHead>
            <TableHead>اسم الفئة</TableHead>
            <TableHead>تاريخ الإنشاء</TableHead>
            <TableHead>الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8">
                جاري التحميل...
              </TableCell>
            </TableRow>
          ) : categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8">
                لا توجد فئات. أضف فئة جديدة.
              </TableCell>
            </TableRow>
          ) : (
            categories.map((category) => (
              <>
                <TableRow key={category.id} className="cursor-pointer hover:bg-muted/50" onClick={() => toggleExpand(category.name)}>
                  <TableCell className="w-8">
                    {expandedCategory === category.name ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {category.name}
                    {subcategories[category.name]?.length > 0 && (
                      <Badge variant="secondary" className="mr-2 text-xs">
                        {subcategories[category.name].length} فرعية
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(category.created_at).toLocaleDateString("ar-SA-u-ca-gregory")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        confirmDeleteCategory(category)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>

                {/* Expanded subcategories section */}
                {expandedCategory === category.name && (
                  <TableRow key={`${category.id}-sub`}>
                    <TableCell colSpan={4} className="bg-muted/20 p-4">
                      <div className="space-y-3 pr-6">
                        <p className="text-sm font-medium text-muted-foreground">الفئات الفرعية لـ &quot;{category.name}&quot;</p>

                        {/* Add subcategory input */}
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="اسم الفئة الفرعية الجديدة..."
                            value={newSubcategoryName}
                            onChange={(e) => setNewSubcategoryName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addSubcategory(category.name)}
                            className="max-w-xs h-8 text-sm"
                          />
                          <Button
                            size="sm"
                            onClick={() => addSubcategory(category.name)}
                            disabled={!newSubcategoryName.trim()}
                          >
                            <Plus className="h-3 w-3 ml-1" />
                            إضافة
                          </Button>
                        </div>

                        {/* Subcategories list */}
                        {(!subcategories[category.name] || subcategories[category.name].length === 0) ? (
                          <p className="text-xs text-muted-foreground">لا توجد فئات فرعية بعد.</p>
                        ) : (
                          <div className="space-y-1">
                            {subcategories[category.name].map((sub) => (
                              <div
                                key={sub.id}
                                className="flex items-center justify-between py-1.5 px-3 rounded-md hover:bg-muted/50"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">↳</span>
                                  <span className="text-sm">{sub.name}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => confirmDeleteSubcategory(sub)}
                                >
                                  <Trash2 className="h-3 w-3 text-red-500" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))
          )}
        </TableBody>
      </Table>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">
              {deleteType === "category"
                ? `حذف فئة "${categoryToDelete?.name}"؟`
                : `حذف فئة فرعية "${subcategoryToDelete?.name}"؟`}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              {topicCount > 0
                ? `يوجد ${topicCount} موضوع مرتبط. لن يتم حذف المواضيع لكنها ستفقد تصنيفها.`
                : "لا توجد مواضيع مرتبطة."}
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

"use client"

import { useState, useEffect, useCallback } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"
import { Trash2, Plus, ChevronDown, ChevronLeft, Pencil, Search, X, ImagePlus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog"
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

export function CollectionManagement() {
  const [collections, setCollections] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Create/Edit dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentCollection, setCurrentCollection] = useState({
    id: null as string | null,
    name: "",
    description: "",
    cover_image_url: "",
    display_order: 0,
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [collectionToDelete, setCollectionToDelete] = useState<any>(null)

  // Expanded collection (topic management)
  const [expandedCollection, setExpandedCollection] = useState<string | null>(null)
  const [collectionTopics, setCollectionTopics] = useState<any[]>([])
  const [topicSearchQuery, setTopicSearchQuery] = useState("")
  const [topicSearchResults, setTopicSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchCollections()
  }, [])

  const fetchCollections = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("collections")
      .select("*, collection_topics(count)")
      .order("display_order", { ascending: true })

    if (error) {
      console.error("Error fetching collections:", error)
      toast({ title: "خطأ", description: "فشل في جلب المجموعات", variant: "destructive" })
    } else {
      setCollections(data || [])
    }
    setIsLoading(false)
  }

  const resetForm = () => {
    setCurrentCollection({ id: null, name: "", description: "", cover_image_url: "", display_order: 0 })
    setIsEditing(false)
    setImageFile(null)
    setImagePreview(null)
  }

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)
    const response = await fetch("/api/admin/upload", { method: "POST", body: formData })
    if (!response.ok) throw new Error("Failed to upload image")
    const data = await response.json()
    return data.url
  }

  const handleImageChange = (e: any) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const openCreateDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const openEditDialog = (collection: any) => {
    setCurrentCollection({
      id: collection.id,
      name: collection.name,
      description: collection.description || "",
      cover_image_url: collection.cover_image_url || "",
      display_order: collection.display_order || 0,
    })
    setImageFile(null)
    setImagePreview(collection.cover_image_url || null)
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!currentCollection.name.trim()) return
    setIsSaving(true)

    try {
      let coverUrl = currentCollection.cover_image_url || null
      if (imageFile) {
        coverUrl = await uploadImage(imageFile)
      }

      const payload = {
        name: currentCollection.name.trim(),
        description: currentCollection.description.trim() || null,
        cover_image_url: coverUrl,
        display_order: currentCollection.display_order,
      }

      if (isEditing && currentCollection.id) {
        const { error } = await supabase
          .from("collections")
          .update(payload)
          .eq("id", currentCollection.id)

        if (error) {
          toast({
            title: "خطأ",
            description: error.code === "23505" ? "هذا الاسم موجود بالفعل" : "فشل في تعديل المجموعة",
            variant: "destructive",
          })
        } else {
          toast({ title: "تم بنجاح", description: "تم تعديل المجموعة" })
          setIsDialogOpen(false)
          resetForm()
          fetchCollections()
        }
      } else {
        const { error } = await supabase
          .from("collections")
          .insert(payload)

        if (error) {
          toast({
            title: "خطأ",
            description: error.code === "23505" ? "هذا الاسم موجود بالفعل" : "فشل في إضافة المجموعة",
            variant: "destructive",
          })
        } else {
          toast({ title: "تم بنجاح", description: "تمت إضافة المجموعة" })
          setIsDialogOpen(false)
          resetForm()
          fetchCollections()
        }
      }
    } catch {
      toast({ title: "خطأ", description: "فشل في رفع الصورة", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const confirmDelete = (collection: any) => {
    setCollectionToDelete(collection)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!collectionToDelete) return

    const { error } = await supabase
      .from("collections")
      .delete()
      .eq("id", collectionToDelete.id)

    if (error) {
      toast({ title: "خطأ", description: "فشل في حذف المجموعة", variant: "destructive" })
    } else {
      if (expandedCollection === collectionToDelete.id) {
        setExpandedCollection(null)
      }
      fetchCollections()
      toast({ title: "تم بنجاح", description: "تم حذف المجموعة" })
    }
    setDeleteDialogOpen(false)
    setCollectionToDelete(null)
  }

  // --- Topic management within a collection ---

  const toggleExpand = (collectionId: string) => {
    if (expandedCollection === collectionId) {
      setExpandedCollection(null)
      setTopicSearchQuery("")
      setTopicSearchResults([])
      setCollectionTopics([])
    } else {
      setExpandedCollection(collectionId)
      setTopicSearchQuery("")
      setTopicSearchResults([])
      fetchCollectionTopics(collectionId)
    }
  }

  const fetchCollectionTopics = async (collectionId: string) => {
    const { data, error } = await supabase
      .from("collection_topics")
      .select("id, topic_id, added_at, topics(id, title, category, featured_image_url)")
      .eq("collection_id", collectionId)
      .order("added_at", { ascending: false })

    if (!error && data) {
      setCollectionTopics(data)
    }
  }

  // Debounced topic search
  useEffect(() => {
    if (!topicSearchQuery.trim() || !expandedCollection) {
      setTopicSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      const { data, error } = await supabase
        .from("topics")
        .select("id, title, category, featured_image_url")
        .ilike("title", `%${topicSearchQuery.trim()}%`)
        .limit(10)

      if (!error && data) {
        // Filter out topics already in the collection
        const existingIds = new Set(collectionTopics.map((ct) => ct.topic_id))
        setTopicSearchResults(data.filter((t) => !existingIds.has(t.id)))
      }
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [topicSearchQuery, expandedCollection, collectionTopics])

  const addTopicToCollection = async (topicId: string) => {
    if (!expandedCollection) return

    const { error } = await supabase
      .from("collection_topics")
      .insert({ collection_id: expandedCollection, topic_id: topicId })

    if (error) {
      toast({ title: "خطأ", description: "فشل في إضافة الموضوع", variant: "destructive" })
    } else {
      toast({ title: "تم بنجاح", description: "تمت إضافة الموضوع للمجموعة" })
      fetchCollectionTopics(expandedCollection)
      fetchCollections() // refresh counts
      // Remove from search results
      setTopicSearchResults((prev) => prev.filter((t) => t.id !== topicId))
    }
  }

  const removeTopicFromCollection = async (junctionId: string) => {
    if (!expandedCollection) return

    const { error } = await supabase
      .from("collection_topics")
      .delete()
      .eq("id", junctionId)

    if (error) {
      toast({ title: "خطأ", description: "فشل في إزالة الموضوع", variant: "destructive" })
    } else {
      toast({ title: "تم بنجاح", description: "تمت إزالة الموضوع من المجموعة" })
      fetchCollectionTopics(expandedCollection)
      fetchCollections() // refresh counts
    }
  }

  const getTopicCount = (collection: any) => {
    return collection.collection_topics?.[0]?.count || 0
  }

  return (
    <div className="space-y-6">
      {/* Add new collection button */}
      <Button onClick={openCreateDialog}>
        <Plus className="h-4 w-4 ml-2" />
        إضافة مجموعة
      </Button>

      {/* Collections table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead>اسم المجموعة</TableHead>
            <TableHead>الوصف</TableHead>
            <TableHead>عدد المواضيع</TableHead>
            <TableHead>الترتيب</TableHead>
            <TableHead>تاريخ الإنشاء</TableHead>
            <TableHead>الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                جاري التحميل...
              </TableCell>
            </TableRow>
          ) : collections.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                لا توجد مجموعات. أضف مجموعة جديدة.
              </TableCell>
            </TableRow>
          ) : (
            collections.map((collection) => (
              <>
                <TableRow
                  key={collection.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleExpand(collection.id)}
                >
                  <TableCell className="w-8">
                    {expandedCollection === collection.id ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{collection.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                    {collection.description || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{getTopicCount(collection)}</Badge>
                  </TableCell>
                  <TableCell>{collection.display_order}</TableCell>
                  <TableCell>
                    {new Date(collection.created_at).toLocaleDateString("ar-SA-u-ca-gregory")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditDialog(collection)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          confirmDelete(collection)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                {/* Expanded: manage topics in this collection */}
                {expandedCollection === collection.id && (
                  <TableRow key={`${collection.id}-topics`}>
                    <TableCell colSpan={7} className="bg-muted/20 p-4">
                      <div className="space-y-4 pr-6">
                        <p className="text-sm font-medium text-muted-foreground">
                          مواضيع المجموعة &quot;{collection.name}&quot;
                        </p>

                        {/* Topic search */}
                        <div className="relative max-w-md">
                          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="ابحث عن موضوع لإضافته..."
                            value={topicSearchQuery}
                            onChange={(e) => setTopicSearchQuery(e.target.value)}
                            className="pr-9 h-9 text-sm"
                          />
                          {topicSearchQuery && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                              onClick={() => {
                                setTopicSearchQuery("")
                                setTopicSearchResults([])
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>

                        {/* Search results */}
                        {topicSearchResults.length > 0 && (
                          <div className="border rounded-md divide-y max-h-[200px] overflow-y-auto">
                            {topicSearchResults.map((topic) => (
                              <div
                                key={topic.id}
                                className="flex items-center justify-between py-2 px-3 hover:bg-muted/50"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-sm truncate">{topic.title}</span>
                                  {topic.category && (
                                    <Badge variant="outline" className="text-xs shrink-0">
                                      {topic.category}
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="shrink-0 h-7 text-xs"
                                  onClick={() => addTopicToCollection(topic.id)}
                                >
                                  <Plus className="h-3 w-3 ml-1" />
                                  إضافة
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {isSearching && (
                          <p className="text-xs text-muted-foreground">جاري البحث...</p>
                        )}

                        {topicSearchQuery && !isSearching && topicSearchResults.length === 0 && (
                          <p className="text-xs text-muted-foreground">لا توجد نتائج</p>
                        )}

                        {/* Current topics in collection */}
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            المواضيع الحالية ({collectionTopics.length})
                          </p>
                          {collectionTopics.length === 0 ? (
                            <p className="text-xs text-muted-foreground">لا توجد مواضيع في هذه المجموعة بعد.</p>
                          ) : (
                            collectionTopics.map((ct) => (
                              <div
                                key={ct.id}
                                className="flex items-center justify-between py-1.5 px-3 rounded-md hover:bg-muted/50"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-sm">↳</span>
                                  <span className="text-sm truncate">{ct.topics?.title || "موضوع محذوف"}</span>
                                  {ct.topics?.category && (
                                    <Badge variant="outline" className="text-xs shrink-0">
                                      {ct.topics.category}
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 shrink-0"
                                  onClick={() => removeTopicFromCollection(ct.id)}
                                >
                                  <Trash2 className="h-3 w-3 text-red-500" />
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))
          )}
        </TableBody>
      </Table>

      {/* Create/Edit dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent dir="rtl" className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-right">
              {isEditing ? "تعديل المجموعة" : "إضافة مجموعة جديدة"}
            </DialogTitle>
            <DialogDescription className="text-right">
              {isEditing ? "عدّل بيانات المجموعة" : "أضف مجموعة جديدة لتجميع المواضيع"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>اسم المجموعة *</Label>
              <Input
                value={currentCollection.name}
                onChange={(e) =>
                  setCurrentCollection((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="مثال: أساسيات التربية"
              />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea
                value={currentCollection.description}
                onChange={(e) =>
                  setCurrentCollection((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="وصف مختصر للمجموعة..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>صورة الغلاف</Label>
              <div className="flex items-center gap-3">
                {imagePreview ? (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                    <img src={imagePreview} alt="غلاف" className="w-full h-full object-cover" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-0 left-0 h-6 w-6 p-0 bg-black/50 hover:bg-black/70 text-white rounded-none rounded-br-lg"
                      onClick={() => {
                        setImageFile(null)
                        setImagePreview(null)
                        setCurrentCollection((prev: any) => ({ ...prev, cover_image_url: "" }))
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-20 h-20 rounded-lg border-2 border-dashed cursor-pointer hover:border-primary/50 transition-colors">
                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>ترتيب العرض</Label>
              <Input
                type="number"
                value={currentCollection.display_order}
                onChange={(e) =>
                  setCurrentCollection((prev) => ({
                    ...prev,
                    display_order: parseInt(e.target.value) || 0,
                  }))
                }
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button onClick={handleSave} disabled={!currentCollection.name.trim() || isSaving}>
              {isSaving ? "جاري الحفظ..." : isEditing ? "حفظ التعديلات" : "إضافة"}
            </Button>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">
              حذف مجموعة &quot;{collectionToDelete?.name}&quot;؟
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              سيتم حذف المجموعة وإزالة جميع المواضيع منها. لن يتم حذف المواضيع نفسها.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

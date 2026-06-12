"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import ProtectedRoute from "@/components/protected-route"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import RichTextEditor from "@/components/rich-text-editor"
import { isHtmlContentEmpty } from "@/lib/utils"

const sortingOptions = ["دروس", "أسئلة", "مشاريع", "نقاشات"]
const ageGroups = ["عمر من صفر لسنتين", "سنتين ل 6 سنوات", "6-14 سنة"]

export default function NewTopicPage() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [subcategory, setSubcategory] = useState("")
  const [subcategories, setSubcategories] = useState<string[]>([])
  const [sorting, setSorting] = useState("")
  const [ageGroup, setAgeGroup] = useState("")
  const [categories, setCategories] = useState<string[]>([])
  const [featuredImage, setFeaturedImage] = useState<File | null>(null)
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState("")
  const [loomEmbedCode, setLoomEmbedCode] = useState("")
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("topic_categories")
        .select("name")
        .order("created_at", { ascending: true })
      if (data) {
        setCategories(data.map((c) => c.name))
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!category) {
        setSubcategories([])
        setSubcategory("")
        return
      }
      const { data } = await supabase
        .from("topic_subcategories")
        .select("name")
        .eq("category_name", category)
        .order("created_at", { ascending: true })
      if (data) {
        setSubcategories(data.map((s) => s.name))
      } else {
        setSubcategories([])
      }
      setSubcategory("")
    }
    fetchSubcategories()
  }, [category])

  // Update the handleSubmit function to include the sorting field
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isHtmlContentEmpty(content)) {
      alert("الرجاء كتابة محتوى الموضوع")
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      let featuredImageUrl = null
      const mediaUrls = []

      if (featuredImage) {
        const { data, error } = await supabase.storage
          .from("uploads")
          .upload(`featured-images/${Date.now()}-${featuredImage.name}`, featuredImage)

        if (error) {
          console.error("Error uploading featured image:", error)
        } else {
          featuredImageUrl = data.path
        }
      }

      for (const file of mediaFiles) {
        const { data, error } = await supabase.storage
          .from("uploads")
          .upload(`topic-media/${Date.now()}-${file.name}`, file)

        if (error) {
          console.error("Error uploading media file:", error)
        } else {
          mediaUrls.push(data.path)
        }
      }

      const { data, error } = await supabase
        .from("topics")
        .insert({
          title,
          content,
          category,
          subcategory: subcategory || null,
          sorting,
          age_group: ageGroup,
          user_id: user.id,
          featured_image_url: featuredImageUrl,
          media_urls: mediaUrls,
          tags,
          loom_embed_code: loomEmbedCode, // Add this line
        })
        .select()

      if (error) {
        console.error("Error creating topic:", error)
      } else {
        router.push(`/community/topic/${data[0].id}`)
      }
    }
  }

  const handleFeaturedImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFeaturedImage(e.target.files[0])
    }
  }

  const handleMediaFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setMediaFiles((prev) => [...prev, ...newFiles])
      setMediaPreviews((prev) => [...prev, ...newFiles.map((file) => URL.createObjectURL(file))])
      // Reset so selecting the same file again still fires onChange
      e.target.value = ""
    }
  }

  const handleRemoveMediaFile = (index: number) => {
    URL.revokeObjectURL(mediaPreviews[index])
    setMediaFiles((prev) => prev.filter((_, i) => i !== index))
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddTag = () => {
    if (currentTag && !tags.includes(currentTag)) {
      setTags([...tags, currentTag])
      setCurrentTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  return (
    <ProtectedRoute>
      <div className="container py-8 animate-fadeIn">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-right">نشر موضوع جديد</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title" className="block text-sm font-medium text-gray-700 text-right">
                  عنوان الموضوع
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="mt-1 text-right"
                />
              </div>
              <div>
                <Label htmlFor="content" className="block text-sm font-medium text-gray-700 text-right">
                  محتوى الموضوع
                </Label>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="اكتبي محتوى الموضوع هنا... يمكنك تنسيق النص وإضافة صور وفيديوهات وروابط"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="category" className="block text-sm font-medium text-gray-700 text-right">
                  الفئة
                </Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="اختاري الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {subcategories.length > 0 && (
                <div>
                  <Label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 text-right">
                    الفئة الفرعية
                  </Label>
                  <Select value={subcategory} onValueChange={setSubcategory}>
                    <SelectTrigger id="subcategory">
                      <SelectValue placeholder="اختاري الفئة الفرعية (اختياري)" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {/* Add the new sorting field */}
              <div>
                <Label htmlFor="sorting" className="block text-sm font-medium text-gray-700 text-right">
                  التصنيف
                </Label>
                <Select value={sorting} onValueChange={setSorting} required>
                  <SelectTrigger id="sorting">
                    <SelectValue placeholder="اختاري التصنيف" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortingOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="age-group" className="block text-sm font-medium text-gray-700 text-right">
                  الفئة العمرية
                </Label>
                <Select value={ageGroup} onValueChange={setAgeGroup}>
                  <SelectTrigger id="age-group">
                    <SelectValue placeholder="اختاري الفئة العمرية (اختياري)" />
                  </SelectTrigger>
                  <SelectContent>
                    {ageGroups.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tags" className="block text-sm font-medium text-gray-700 text-right">
                  الوسوم
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="tags"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    className="text-right"
                    placeholder="أدخلي وسمًا"
                  />
                  <Button type="button" onClick={handleAddTag}>
                    إضافة
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 justify-end">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag} &#x2715;
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="featured-image" className="block text-sm font-medium text-gray-700 text-right">
                  الصورة الرئيسية
                </Label>
                <Input
                  id="featured-image"
                  type="file"
                  onChange={handleFeaturedImageChange}
                  accept="image/*"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="media" className="block text-sm font-medium text-gray-700 text-right">
                  إضافة صور أو فيديوهات (حتى 500 ميجابايت لكل ملف)
                </Label>
                <Input
                  id="media"
                  type="file"
                  onChange={handleMediaFilesChange}
                  accept="image/*,video/*"
                  multiple
                  className="mt-1"
                />
                {mediaFiles.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {mediaFiles.map((file, index) => (
                      <div key={index} className="relative">
                        {file.type.startsWith("video/") ? (
                          <video
                            src={mediaPreviews[index]}
                            className="h-24 w-full object-cover rounded-md border"
                          />
                        ) : (
                          <img
                            src={mediaPreviews[index]}
                            alt={`معاينة ${index + 1}`}
                            className="h-24 w-full object-cover rounded-md border"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveMediaFile(index)}
                          className="absolute top-1 left-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                          aria-label="إزالة الملف"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="loom-embed" className="block text-sm font-medium text-gray-700 text-right">
                  رمز تضمين فيديو Loom (اختياري)
                </Label>
                <Textarea
                  id="loom-embed"
                  value={loomEmbedCode}
                  onChange={(e) => setLoomEmbedCode(e.target.value)}
                  className="mt-1 text-right"
                  placeholder="الصق رمز تضمين فيديو Loom هنا"
                  rows={3}
                />
                <p className="text-sm text-muted-foreground text-right mt-1">
                  يمكنك نسخ رمز التضمين من Loom بالضغط على زر "Share" ثم "Embed"
                </p>
              </div>
              <Button type="submit" className="w-full">
                نشر الموضوع
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}

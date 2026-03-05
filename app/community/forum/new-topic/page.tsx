"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function NewTopic() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [categories, setCategories] = useState<string[]>([])
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

  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [subcategory, setSubcategory] = useState("")
  const [subcategories, setSubcategories] = useState<string[]>([])
  const [tags, setTags] = useState("")

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
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !content || !category) {
      setError("يرجى ملء جميع الحقول المطلوبة")
      return
    }
    // Here you would typically send the data to your backend
    console.log({ title, content, category, tags, isAnonymous, attachments })
    // After successful submission, redirect to the forum page
    router.push("/community/forum")
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files))
    }
  }

  return (
    <div className="container py-8 animate-fadeIn" dir="rtl">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">إنشاء موضوع جديد</CardTitle>
          <CardDescription>شاركي أفكارك وتجاربك مع مجتمع الأمومة</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>خطأ</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="title">عنوان الموضوع</Label>
              <Input
                id="title"
                placeholder="أدخلي عنوان الموضوع هنا"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-right"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">محتوى الموضوع</Label>
              <Textarea
                id="content"
                placeholder="اكتبي محتوى الموضوع هنا"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px] text-right"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">الفئة</Label>
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
              <div className="space-y-2">
                <Label htmlFor="subcategory">الفئة الفرعية</Label>
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
            <div className="space-y-2">
              <Label htmlFor="tags">الوسوم</Label>
              <Input
                id="tags"
                placeholder="أدخلي الوسوم مفصولة بفواصل"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="text-right"
              />
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
              />
              <Label htmlFor="anonymous">نشر بشكل مجهول</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="attachments">المرفقات</Label>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Input id="attachments" type="file" onChange={handleFileChange} multiple className="hidden" />
                <Label
                  htmlFor="attachments"
                  className="cursor-pointer bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-md inline-flex items-center"
                >
                  <Upload className="ml-2 h-4 w-4" />
                  إضافة مرفقات
                </Label>
                <span className="text-sm text-muted-foreground">
                  {attachments.length > 0 ? `${attachments.length} ملفات مرفقة` : "لا توجد مرفقات"}
                </span>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between flex-row-reverse">
          <Button type="submit" onClick={handleSubmit}>
            نشر الموضوع
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            إلغاء
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

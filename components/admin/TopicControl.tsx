"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"

export function TopicControl() {
  const [topics, setTopics] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchTopics()
  }, [])

  const fetchTopics = async () => {
    const { data, error } = await supabase
      .from("topics")
      .select("*, user_profiles(username)")
      .ilike("title", `%${searchTerm}%`)
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
      <Input
        type="text"
        placeholder="البحث عن المواضيع"
        value={searchTerm}
        onChange={handleSearch}
        className="max-w-sm"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>العنوان</TableHead>
            <TableHead>الكاتب</TableHead>
            <TableHead>تاريخ النشر</TableHead>
            <TableHead>مثبت</TableHead>
            <TableHead>الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topics.map((topic) => (
            <TableRow key={topic.id}>
              <TableCell>{topic.title}</TableCell>
              <TableCell>{topic.user_profiles.username}</TableCell>
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

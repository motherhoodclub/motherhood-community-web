"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export function WorkshopManagement() {
  const [workshops, setWorkshops] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [newWorkshop, setNewWorkshop] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    speaker: "",
    max_attendees: "",
  })
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchWorkshops()
  }, [])

  const fetchWorkshops = async () => {
    const { data, error } = await supabase.from("workshops").select("*").ilike("title", `%${searchTerm}%`)
    if (error) {
      console.error("Error fetching workshops:", error)
      toast({
        title: "خطأ",
        description: "فشل في جلب ورش العمل",
        variant: "destructive",
      })
    } else {
      setWorkshops(data)
    }
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    fetchWorkshops()
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewWorkshop((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { data, error } = await supabase.from("workshops").insert([newWorkshop])
    if (error) {
      toast({
        title: "خطأ",
        description: "فشل في إضافة ورشة العمل",
        variant: "destructive",
      })
    } else {
      fetchWorkshops()
      toast({
        title: "تم بنجاح",
        description: "تمت إضافة ورشة العمل",
      })
      setNewWorkshop({
        title: "",
        description: "",
        date: "",
        time: "",
        speaker: "",
        max_attendees: "",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Input
          type="text"
          placeholder="البحث عن ورش العمل"
          value={searchTerm}
          onChange={handleSearch}
          className="max-w-sm"
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button>إضافة ورشة عمل جديدة</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة ورشة عمل جديدة</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">العنوان</Label>
                <Input id="title" name="title" value={newWorkshop.title} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="description">الوصف</Label>
                <Input
                  id="description"
                  name="description"
                  value={newWorkshop.description}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="date">التاريخ</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={newWorkshop.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="time">الوقت</Label>
                <Input
                  id="time"
                  name="time"
                  type="time"
                  value={newWorkshop.time}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="speaker">المتحدث</Label>
                <Input id="speaker" name="speaker" value={newWorkshop.speaker} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="max_attendees">الحد الأقصى للحضور</Label>
                <Input
                  id="max_attendees"
                  name="max_attendees"
                  type="number"
                  value={newWorkshop.max_attendees}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <Button type="submit">إضافة</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>العنوان</TableHead>
            <TableHead>التاريخ</TableHead>
            <TableHead>الوقت</TableHead>
            <TableHead>المتحدث</TableHead>
            <TableHead>الحد الأقصى للحضور</TableHead>
            <TableHead>الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workshops.map((workshop) => (
            <TableRow key={workshop.id}>
              <TableCell>{workshop.title}</TableCell>
              <TableCell>{new Date(workshop.date).toLocaleDateString("ar-SA-u-ca-gregory")}</TableCell>
              <TableCell>{workshop.time}</TableCell>
              <TableCell>{workshop.speaker}</TableCell>
              <TableCell>{workshop.max_attendees}</TableCell>
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

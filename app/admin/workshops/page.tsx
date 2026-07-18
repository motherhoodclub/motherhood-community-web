"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Pencil, Trash2, Clock } from "lucide-react"
import { formatWorkshopDate } from "@/lib/date-utils"
import { MIN_TIER_OPTIONS } from "@/lib/entitlements"
import { TierBadge } from "@/components/tier-gate"

export default function AdminWorkshopsPage() {
  const [workshops, setWorkshops] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentWorkshop, setCurrentWorkshop] = useState({
    id: null,
    title: "",
    description: "",
    date: "",
    time: "",
    zoom_url: "",
    image_url: "",
    min_tier: 0,
    timezone: "GMT-5", // Default timezone
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchWorkshops()
  }, [])

  const fetchWorkshops = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/workshops")
      if (!response.ok) {
        throw new Error("Failed to fetch workshops")
      }
      const data = await response.json()
      setWorkshops(data)
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في جلب بيانات ورش العمل",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setCurrentWorkshop((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      // Create a temporary URL for preview
      setCurrentWorkshop((prev) => ({ ...prev, image_url: URL.createObjectURL(file) }))
    }
  }

  const uploadImage = async (file) => {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload image")
      }

      const data = await response.json()
      return data.url
    } catch (error) {
      console.error("Error uploading image: ", error)
      throw error
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let imageUrl = currentWorkshop.image_url

      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
      }

      // Ensure date is in the correct format (YYYY-MM-DD)
      const formattedDate = currentWorkshop.date || new Date().toISOString().split("T")[0]

      const workshopData = {
        ...currentWorkshop,
        image_url: imageUrl,
        date: formattedDate,
        timezone: "GMT-5", // Always save with GMT-5 timezone
      }

      let response
      if (isEditing) {
        response = await fetch("/api/admin/workshops", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(workshopData),
        })
      } else {
        response = await fetch("/api/admin/workshops", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(workshopData),
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit workshop")
      }

      toast({
        title: "تم بنجاح",
        description: isEditing ? "تم تحديث ورشة العمل" : "تمت إضافة ورشة العمل",
      })
      fetchWorkshops()
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error submitting workshop: ", error)
      toast({
        title: "خطأ",
        description: `${isEditing ? "فشل في تحديث ورشة العمل" : "فشل في إضافة ورشة العمل"}: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (workshop) => {
    setCurrentWorkshop({
      ...workshop,
      timezone: workshop.timezone || "GMT-5", // Default to GMT-5 if not set
    })
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/admin/workshops?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete workshop")
      }

      toast({
        title: "تم بنجاح",
        description: "تم حذف ورشة العمل",
      })
      fetchWorkshops()
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حذف ورشة العمل",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setCurrentWorkshop({
      id: null,
      title: "",
      description: "",
      date: "",
      time: "",
      zoom_url: "",
      image_url: "",
      min_tier: 0,
      timezone: "GMT-5", // Reset to default timezone
    })
    setImageFile(null)
    setIsEditing(false)
  }

  // Helper function to display raw date from database
  const displayRawDate = (dateString) => {
    if (!dateString) return ""

    // Extract day directly from the YYYY-MM-DD format
    const parts = dateString.split("-")
    if (parts.length === 3) {
      return formatWorkshopDate(dateString)
    }
    return dateString
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">إدارة ورش العمل</h1>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>إضافة ورشة عمل جديدة</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl w-[90vw] p-0 overflow-hidden border-2 rounded-lg shadow-lg" dir="rtl">
            <DialogHeader className="px-6 pt-6 pb-2 border-b">
              <DialogTitle className="text-xl font-bold text-right">
                {isEditing ? "تعديل ورشة العمل" : "إضافة ورشة عمل جديدة"}
              </DialogTitle>
              <DialogDescription className="text-right">أدخل تفاصيل ورشة العمل هنا.</DialogDescription>
            </DialogHeader>

            <div className="overflow-y-auto max-h-[60vh]">
              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="block text-right font-medium">
                      العنوان
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      value={currentWorkshop.title}
                      onChange={handleInputChange}
                      className="w-full text-right"
                      placeholder="أدخل عنوان ورشة العمل"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="block text-right font-medium">
                      الوصف
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={currentWorkshop.description}
                      onChange={handleInputChange}
                      className="w-full text-right min-h-[120px]"
                      placeholder="أدخل وصف ورشة العمل"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="date" className="block text-right font-medium">
                        التاريخ
                      </Label>
                      <Input
                        id="date"
                        name="date"
                        type="date"
                        value={currentWorkshop.date}
                        onChange={handleInputChange}
                        className="w-full text-right"
                        required
                        defaultValue={new Date().toISOString().split("T")[0]}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="time" className="block text-right font-medium">
                        الوقت (توقيت غرينتش-٥)
                      </Label>
                      <div className="relative">
                        <Input
                          id="time"
                          name="time"
                          type="time"
                          value={currentWorkshop.time}
                          onChange={handleInputChange}
                          className="w-full text-right pr-10"
                          required
                          defaultValue="12:00"
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <Clock className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">جميع الأوقات بتوقيت غرينتش-٥ (GMT-5)</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zoom_url" className="block text-right font-medium">
                      رابط Zoom
                    </Label>
                    <Input
                      id="zoom_url"
                      name="zoom_url"
                      value={currentWorkshop.zoom_url}
                      onChange={handleInputChange}
                      className="w-full text-right"
                      placeholder="أدخل رابط Zoom"
                      dir="ltr"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min_tier" className="block text-right font-medium">
                      مستوى الوصول (الباقة)
                    </Label>
                    <select
                      id="min_tier"
                      name="min_tier"
                      value={currentWorkshop.min_tier ?? 0}
                      onChange={(e) =>
                        setCurrentWorkshop((prev) => ({ ...prev, min_tier: Number(e.target.value) }))
                      }
                      className="w-full h-10 rounded-md border bg-background px-3 text-right text-sm"
                    >
                      {MIN_TIER_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500">
                      حدد الباقة المطلوبة لحضور الورشة / مشاهدة تسجيلها.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image" className="block text-right font-medium">
                      الصورة
                    </Label>
                    <Input id="image" type="file" onChange={handleImageChange} accept="image/*" className="w-full" />
                    {currentWorkshop.image_url && (
                      <div className="mt-4 rounded-md overflow-hidden border border-gray-200">
                        <img
                          src={currentWorkshop.image_url || "/placeholder.svg"}
                          alt="صورة الورشة"
                          className="max-w-full h-auto max-h-[200px] object-contain mx-auto"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>

            <DialogFooter className="px-6 py-4 border-t bg-gray-50">
              <div className="flex flex-col sm:flex-row justify-start gap-3 w-full">
                <Button onClick={handleSubmit} disabled={isLoading} className="w-full sm:w-auto">
                  {isLoading ? "جاري التحميل..." : isEditing ? "تحديث ورشة العمل" : "إضافة ورشة العمل"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  إلغاء
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">العنوان</TableHead>
              <TableHead className="text-right">التاريخ</TableHead>
              <TableHead className="text-right">الوقت (GMT-5)</TableHead>
              <TableHead className="text-right">رابط Zoom</TableHead>
              <TableHead className="text-right">الصورة</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  جاري التحميل...
                </TableCell>
              </TableRow>
            ) : workshops.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  لا توجد ورش عمل حالياً. قم بإضافة ورشة عمل جديدة.
                </TableCell>
              </TableRow>
            ) : (
              workshops.map((workshop) => (
                <TableRow key={workshop.id}>
                  <TableCell className="text-right font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <span>{workshop.title}</span>
                      <TierBadge minTier={workshop.min_tier} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{displayRawDate(workshop.date)}</TableCell>
                  <TableCell className="text-right">{workshop.time} (GMT-5)</TableCell>
                  <TableCell className="text-right">
                    <a
                      href={workshop.zoom_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      رابط Zoom
                    </a>
                  </TableCell>
                  <TableCell className="text-right">
                    {workshop.image_url && (
                      <img
                        src={workshop.image_url || "/placeholder.svg"}
                        alt="صورة الورشة"
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(workshop)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(workshop.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

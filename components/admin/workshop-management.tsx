"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export function WorkshopManagement() {
  const [workshops, setWorkshops] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchWorkshops()
  }, [])

  const fetchWorkshops = async () => {
    const { data, error } = await supabase.from("workshops").select("*").ilike("title", `%${searchTerm}%`)
    if (error) {
      console.error("Error fetching workshops:", error)
    } else {
      setWorkshops(data)
    }
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    fetchWorkshops()
  }

  return (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder="البحث عن ورش العمل"
        value={searchTerm}
        onChange={handleSearch}
        className="max-w-sm"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>العنوان</TableHead>
            <TableHead>التاريخ</TableHead>
            <TableHead>المتحدث</TableHead>
            <TableHead>الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workshops.map((workshop) => (
            <TableRow key={workshop.id}>
              <TableCell>{workshop.title}</TableCell>
              <TableCell>{new Date(workshop.date).toLocaleDateString("ar-SA-u-ca-gregory")}</TableCell>
              <TableCell>{workshop.speaker}</TableCell>
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

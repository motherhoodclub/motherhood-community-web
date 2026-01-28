"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"

export function UserManagement() {
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("user_profiles").select("*").ilike("username", `%${searchTerm}%`)
    if (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "خطأ",
        description: "فشل في جلب بيانات المستخدمين",
        variant: "destructive",
      })
    } else {
      setUsers(data)
    }
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    fetchUsers()
  }

  const toggleAdminStatus = async (userId, currentStatus) => {
    const { error } = await supabase.from("user_profiles").update({ is_admin: !currentStatus }).eq("id", userId)

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة المشرف",
        variant: "destructive",
      })
    } else {
      fetchUsers()
      toast({
        title: "تم بنجاح",
        description: "تم تحديث حالة المشرف",
      })
    }
  }

  return (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder="البحث عن المستخدمين"
        value={searchTerm}
        onChange={handleSearch}
        className="max-w-sm"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>اسم المستخدم</TableHead>
            <TableHead>البريد الإلكتروني</TableHead>
            <TableHead>تاريخ الانضمام</TableHead>
            <TableHead>مشرف</TableHead>
            <TableHead>الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{new Date(user.created_at).toLocaleDateString("ar-SA-u-ca-gregory")}</TableCell>
              <TableCell>
                <Switch checked={user.is_admin} onCheckedChange={() => toggleAdminStatus(user.id, user.is_admin)} />
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

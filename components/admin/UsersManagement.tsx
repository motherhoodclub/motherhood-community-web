"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"

export function UsersManagement() {
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    const { data, error } = await supabase.from("user_profiles").select("*")
    if (error) {
      toast({ title: "Error", description: "Failed to fetch users", variant: "destructive" })
    } else {
      setUsers(data)
    }
    setIsLoading(false)
  }

  const toggleAdminStatus = async (userId, isAdmin) => {
    const { error } = await supabase.from("user_profiles").update({ is_admin: !isAdmin }).eq("id", userId)
    if (error) {
      toast({ title: "Error", description: "Failed to update user", variant: "destructive" })
    } else {
      fetchUsers()
    }
  }

  if (isLoading) return <div>جاري التحميل...</div>

  return (
    <div className="space-y-4">
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
              <TableCell>{user.is_admin ? "نعم" : "لا"}</TableCell>
              <TableCell>
                <Button onClick={() => toggleAdminStatus(user.id, user.is_admin)}>
                  {user.is_admin ? "إلغاء الإشراف" : "جعله مشرفًا"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

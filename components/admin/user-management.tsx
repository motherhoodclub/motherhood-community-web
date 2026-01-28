"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export function UserManagement() {
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("user_profiles").select("*").ilike("username", `%${searchTerm}%`)
    if (error) {
      console.error("Error fetching users:", error)
    } else {
      setUsers(data)
    }
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    fetchUsers()
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

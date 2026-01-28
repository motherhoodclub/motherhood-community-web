"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export function RecentUsers() {
  const [recentUsers, setRecentUsers] = useState([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchRecentUsers() {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, full_name, email, created_at, avatar_url")
        .order("created_at", { ascending: false })
        .limit(5)

      if (error) {
        console.error("Error fetching recent users:", error)
        return
      }

      setRecentUsers(data)
    }

    fetchRecentUsers()
  }, [supabase])

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">الصورة</TableHead>
          <TableHead>الاسم</TableHead>
          <TableHead>البريد الإلكتروني</TableHead>
          <TableHead className="text-left">تاريخ الانضمام</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recentUsers.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <Avatar>
                <AvatarImage src={user.avatar_url} alt="Avatar" />
                <AvatarFallback>{user.full_name[0]}</AvatarFallback>
              </Avatar>
            </TableCell>
            <TableCell className="font-medium">{user.full_name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell className="text-left">{new Date(user.created_at).toLocaleDateString("ar-SA-u-ca-gregory")}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserManagement } from "@/components/admin/UserManagement"
import { TopicControl } from "@/components/admin/TopicControl"
import { WorkshopManagement } from "@/components/admin/WorkshopManagement"
import { CategoryManagement } from "@/components/admin/CategoryManagement"

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState("users")

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">لوحة التحكم الإدارية</CardTitle>
        <CardDescription>إدارة المستخدمين والمواضيع وورش العمل</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">المستخدمون</TabsTrigger>
            <TabsTrigger value="topics">المواضيع</TabsTrigger>
            <TabsTrigger value="categories">الفئات</TabsTrigger>
            <TabsTrigger value="workshops">ورش العمل</TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
          <TabsContent value="topics">
            <TopicControl />
          </TabsContent>
          <TabsContent value="categories">
            <CategoryManagement />
          </TabsContent>
          <TabsContent value="workshops">
            <WorkshopManagement />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

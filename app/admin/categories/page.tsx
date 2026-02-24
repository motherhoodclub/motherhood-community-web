"use client"

import { CategoryManagement } from "@/components/admin/CategoryManagement"

export default function AdminTopicsPage() {
  return (
    <div className="space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold">إدارة الفئات</h1>
      <CategoryManagement />
    </div>
  )
}

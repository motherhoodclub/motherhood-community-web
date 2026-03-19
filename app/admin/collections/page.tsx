"use client"

import { CollectionManagement } from "@/components/admin/CollectionManagement"

export default function AdminCollectionsPage() {
  return (
    <div className="space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold">ادارة المجموعات</h1>
      <CollectionManagement />
    </div>
  )
}

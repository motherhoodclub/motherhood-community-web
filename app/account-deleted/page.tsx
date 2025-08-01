"use client"

import { useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Home, UserX } from "lucide-react"

export default function AccountDeletedPage() {
  useEffect(() => {
    // Clear any local storage or session data
    localStorage.clear()
    sessionStorage.clear()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="text-center">
          <CardHeader className="pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>
            <CardTitle className="text-2xl text-gray-900">تم حذف الحساب بنجاح</CardTitle>
            <CardDescription className="text-gray-600">تم حذف حسابك وجميع بياناتك من منصتنا نهائياً</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg text-right">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center justify-end">
                <UserX className="w-5 h-5 ml-2" />
                ما تم حذفه:
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• معلومات الحساب الشخصية</li>
                <li>• جميع المنشورات والتعليقات</li>
                <li>• الأسئلة والإجابات</li>
                <li>• تسجيلات ورش العمل</li>
                <li>• بيانات الاشتراكات والمدفوعات</li>
                <li>• إعدادات الإشعارات</li>
                <li>• رسائل الدردشة</li>
                <li>• الملفات المرفوعة</li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg text-right">
              <p className="text-sm text-yellow-800">
                <strong>ملاحظة:</strong> إذا كنت تريد العودة إلى منصتنا في المستقبل، ستحتاج إلى إنشاء حساب جديد من
                البداية.
              </p>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/">
                  <Home className="w-4 h-4 ml-2" />
                  العودة إلى الصفحة الرئيسية
                </Link>
              </Button>

              <Button variant="outline" asChild className="w-full bg-transparent">
                <Link href="/auth/register">إنشاء حساب جديد</Link>
              </Button>
            </div>

            <div className="text-xs text-gray-500 pt-4 border-t">
              شكراً لك لكونك جزءاً من مجتمع الدعم التربوي. نتمنى لك كل التوفيق في رحلتك.
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

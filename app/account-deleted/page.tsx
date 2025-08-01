"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Trash2, Shield, Clock, FileText, MessageSquare, CreditCard, Settings } from "lucide-react"

export default function AccountDeletionInfoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white p-4" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="mx-auto mb-4 w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">حذف الحساب نهائياً</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            تعرف على كيفية حذف حسابك وجميع بياناتك من منصة الدعم التربوي بشكل نهائي وآمن
          </p>
        </motion.div>

        {/* Warning Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center justify-end">
                <Trash2 className="w-6 h-6 ml-2" />
                تحذير مهم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-red-100 p-4 rounded-lg">
                <p className="text-red-800 font-semibold text-lg mb-2">
                  حذف الحساب عملية نهائية ولا يمكن التراجع عنها!
                </p>
                <p className="text-red-700">
                  بمجرد حذف حسابك، ستفقد جميع بياناتك ومحتواك بشكل نهائي ولن تتمكن من استرداده مرة أخرى.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* What Gets Deleted */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-end">
                <FileText className="w-6 h-6 ml-2" />
                ما الذي سيتم حذفه؟
              </CardTitle>
              <CardDescription>جميع البيانات التالية ستحذف نهائياً من حسابك:</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-end p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">معلومات الحساب الشخصية</span>
                    <Shield className="w-5 h-5 text-blue-600 ml-3" />
                  </div>
                  <div className="flex items-center justify-end p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">جميع المنشورات والمواضيع</span>
                    <MessageSquare className="w-5 h-5 text-green-600 ml-3" />
                  </div>
                  <div className="flex items-center justify-end p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">التعليقات والردود</span>
                    <MessageSquare className="w-5 h-5 text-purple-600 ml-3" />
                  </div>
                  <div className="flex items-center justify-end p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">الأسئلة والإجابات</span>
                    <FileText className="w-5 h-5 text-orange-600 ml-3" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-end p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">تسجيلات ورش العمل</span>
                    <Clock className="w-5 h-5 text-red-600 ml-3" />
                  </div>
                  <div className="flex items-center justify-end p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">بيانات الاشتراكات والمدفوعات</span>
                    <CreditCard className="w-5 h-5 text-yellow-600 ml-3" />
                  </div>
                  <div className="flex items-center justify-end p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">إعدادات الإشعارات</span>
                    <Settings className="w-5 h-5 text-indigo-600 ml-3" />
                  </div>
                  <div className="flex items-center justify-end p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">الملفات المرفوعة والمحفوظة</span>
                    <FileText className="w-5 h-5 text-teal-600 ml-3" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* How to Delete */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-end">
                <Trash2 className="w-6 h-6 ml-2" />
                كيفية حذف حسابك
              </CardTitle>
              <CardDescription>اتبع هذه الخطوات لحذف حسابك نهائياً:</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start justify-end p-4 bg-blue-50 rounded-lg">
                  <div className="text-right">
                    <h3 className="font-semibold text-blue-900 mb-1">الخطوة 1: انتقل إلى الإعدادات</h3>
                    <p className="text-blue-800 text-sm">اذهب إلى صفحة إعدادات حسابك من القائمة الجانبية</p>
                  </div>
                  <div className="bg-blue-200 rounded-full p-2 ml-4 flex-shrink-0">
                    <span className="text-blue-800 font-bold">1</span>
                  </div>
                </div>

                <div className="flex items-start justify-end p-4 bg-orange-50 rounded-lg">
                  <div className="text-right">
                    <h3 className="font-semibold text-orange-900 mb-1">الخطوة 2: ابحث عن زر حذف الحساب</h3>
                    <p className="text-orange-800 text-sm">ستجد زر "حذف الحساب نهائياً" في أسفل صفحة الإعدادات</p>
                  </div>
                  <div className="bg-orange-200 rounded-full p-2 ml-4 flex-shrink-0">
                    <span className="text-orange-800 font-bold">2</span>
                  </div>
                </div>

                <div className="flex items-start justify-end p-4 bg-red-50 rounded-lg">
                  <div className="text-right">
                    <h3 className="font-semibold text-red-900 mb-1">الخطوة 3: تأكيد الحذف</h3>
                    <p className="text-red-800 text-sm">اكتب كلمة "حذف" في المربع المطلوب واضغط على تأكيد الحذف</p>
                  </div>
                  <div className="bg-red-200 rounded-full p-2 ml-4 flex-shrink-0">
                    <span className="text-red-800 font-bold">3</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button asChild size="lg" className="bg-red-600 hover:bg-red-700">
            <Link href="/community/settings">
              <Trash2 className="w-5 h-5 ml-2" />
              انتقل إلى الإعدادات لحذف الحساب
            </Link>
          </Button>

          <Button variant="outline" asChild size="lg">
            <Link href="/community">العودة إلى المجتمع</Link>
          </Button>
        </motion.div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="text-center text-sm text-gray-500 border-t pt-8"
        >
          <p>
            إذا كنت تواجه مشاكل تقنية أو تحتاج مساعدة، يمكنك التواصل معنا قبل حذف حسابك.
            <br />
            نحن هنا لمساعدتك في حل أي مشكلة قد تواجهها.
          </p>
        </motion.div>
      </div>
    </div>
  )
}

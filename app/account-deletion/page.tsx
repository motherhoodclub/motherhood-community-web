"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Trash2, Shield, Clock, FileText, MessageSquare, CreditCard, Settings, UserX, CheckCircle } from "lucide-react"
import { HeaderHome } from "@/components/header-home"
import Image from "next/image"

export default function AccountDeletionInfoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white" dir="rtl">
      {/* Header */}
      <HeaderHome />

      <div className="max-w-5xl mx-auto space-y-8 p-4 pt-8" dir="rtl">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="mx-auto mb-6 w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
            <UserX className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">حذف الحساب نهائياً</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            تعرف على كيفية حذف حسابك وجميع بياناتك من مجتمع الأمومة بشكل نهائي وآمن على الموقع الإلكتروني وتطبيق الهاتف المحمول
          </p>
        </motion.div>

        {/* Warning Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card className="border-red-200 bg-red-50" dir="rtl">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 ml-2" />
                تحذير مهم جداً
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-red-100 p-6 rounded-lg">
                <p className="text-red-800 font-bold text-xl mb-3">
                  حذف الحساب عملية نهائية ولا يمكن التراجع عنها!
                </p>
                <p className="text-red-700 text-lg leading-relaxed">
                  بمجرد حذف حسابك من مجتمع الأمومة، ستفقد جميع بياناتك ومحتواك وذكرياتك بشكل نهائي ولن تتمكن من استردادها مرة أخرى على الموقع الإلكتروني أو تطبيق الهاتف المحمول.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Subscription Status Check */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card dir="rtl">
            <CardHeader>
              <CardTitle className="flex items-center justify-center">
                <CreditCard className="w-6 h-6 ml-2" />
                تحقق من حالة الاشتراك أولاً
              </CardTitle>
              <CardDescription>يجب التأكد من حالة اشتراكك قبل حذف الحساب</CardDescription>
            </CardHeader>
            <CardContent dir="rtl">
              <div className="grid md:grid-cols-2 gap-6" dir="rtl">
                {/* No Subscription Scenario */}
                <div className="bg-green-50 p-6 rounded-xl border border-green-200" dir="rtl">
                  <div className="flex items-center justify-end mb-4">
                    <h3 className="text-green-800 font-bold text-lg">إذا لم يكن لديك اشتراك نشط</h3>
                    <CheckCircle className="w-6 h-6 text-green-600 ml-2" />
                  </div>
                  
                  <div className="mb-4">
                    <Image
                      src="https://auth.motherhoodclub.net/storage/v1/object/public/uploads//555.png"
                      alt="صفحة الاشتراك بدون اشتراك نشط"
                      width={400}
                      height={250}
                      className="w-full rounded-lg shadow-md border"
                    />
                  </div>
                  
                  <p className="text-green-700 mb-4">
                    إذا لم يكن لديك اشتراك نشط، يمكنك حذف حسابك مباشرة من صفحة الاشتراكات.
                  </p>
                  
                  <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                    <Link href="https://community.motherhoodclub.net/community/subscription">
                      انتقل إلى صفحة الاشتراكات
                    </Link>
                  </Button>
                </div>

                {/* Active Subscription Scenario */}
                <div className="bg-orange-50 p-6 rounded-xl border border-orange-200" dir="rtl">
                  <div className="flex items-center justify-end mb-4">
                    <h3 className="text-orange-800 font-bold text-lg">إذا كان لديك اشتراك نشط</h3>
                    <AlertTriangle className="w-6 h-6 text-orange-600 ml-2" />
                  </div>
                  
                  <div className="mb-4">
                    <Image
                      src="https://auth.motherhoodclub.net/storage/v1/object/public/uploads//655.png"
                      alt="صفحة الإعدادات مع اشتراك نشط"
                      width={400}
                      height={250}
                      className="w-full rounded-lg shadow-md border"
                    />
                  </div>
                  
                  <p className="text-orange-700 mb-4">
                    يجب إلغاء اشتراكك أولاً قبل أن تتمكن من حذف حسابك نهائياً.
                  </p>
                  
                  <div className="space-y-2">
                    <Button asChild variant="outline" className="w-full border-orange-300 text-orange-700 hover:bg-orange-100">
                      <Link href="https://community.motherhoodclub.net/community/subscription">
                        إلغاء الاشتراك أولاً
                      </Link>
                    </Button>
                    <Button asChild className="w-full bg-orange-600 hover:bg-orange-700">
                      <Link href="https://community.motherhoodclub.net/community/settings">
                        انتقل إلى الإعدادات
                      </Link>
                    </Button>
                  </div>
                </div>
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
          <Card dir="rtl">
            <CardHeader>
              <CardTitle className="flex items-center justify-center">
                <FileText className="w-6 h-6 ml-2" />
                ما الذي سيتم حذفه من حسابك؟
              </CardTitle>
              <CardDescription>جميع البيانات التالية ستحذف نهائياً من حسابك في مجتمع الأمومة:</CardDescription>
            </CardHeader>
            <CardContent dir="rtl">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4" dir="rtl">
                <div className="flex items-center justify-end p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <span className="text-blue-800 font-medium">معلومات الحساب الشخصية</span>
                  <Shield className="w-5 h-5 text-blue-600 ml-3" />
                </div>
                <div className="flex items-center justify-end p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                  <span className="text-green-800 font-medium">جميع المنشورات والمواضيع</span>
                  <MessageSquare className="w-5 h-5 text-green-600 ml-3" />
                </div>
                <div className="flex items-center justify-end p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                  <span className="text-purple-800 font-medium">التعليقات والردود</span>
                  <MessageSquare className="w-5 h-5 text-purple-600 ml-3" />
                </div>
                <div className="flex items-center justify-end p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                  <span className="text-orange-800 font-medium">الأسئلة والاستشارات</span>
                  <FileText className="w-5 h-5 text-orange-600 ml-3" />
                </div>
                <div className="flex items-center justify-end p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200">
                  <span className="text-red-800 font-medium">ذكريات الأمومة المحفوظة</span>
                  <Clock className="w-5 h-5 text-red-600 ml-3" />
                </div>
                <div className="flex items-center justify-end p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                  <span className="text-yellow-800 font-medium">بيانات الاشتراكات</span>
                  <CreditCard className="w-5 h-5 text-yellow-600 ml-3" />
                </div>
                <div className="flex items-center justify-end p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
                  <span className="text-indigo-800 font-medium">إعدادات الإشعارات</span>
                  <Settings className="w-5 h-5 text-indigo-600 ml-3" />
                </div>
                <div className="flex items-center justify-end p-4 bg-gradient-to-r from-teal-50 to-teal-100 rounded-lg border border-teal-200">
                  <span className="text-teal-800 font-medium">الصور والملفات المرفوعة</span>
                  <FileText className="w-5 h-5 text-teal-600 ml-3" />
                </div>
                <div className="flex items-center justify-end p-4 bg-gradient-to-r from-pink-50 to-pink-100 rounded-lg border border-pink-200">
                  <span className="text-pink-800 font-medium">قائمة الأصدقاء والمتابعات</span>
                  <Shield className="w-5 h-5 text-pink-600 ml-3" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* How to Delete Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Card dir="rtl">
            <CardHeader>
              <CardTitle className="flex items-center justify-center">
                <Trash2 className="w-6 h-6 ml-2" />
                خطوات حذف حسابك من مجتمع الأمومة
              </CardTitle>
              <CardDescription>اتبع هذه الخطوات لحذف حسابك نهائياً من الموقع الإلكتروني أو تطبيق الهاتف:</CardDescription>
            </CardHeader>
            <CardContent dir="rtl">
              <div className="space-y-6" dir="rtl">
                <div className="flex items-start justify-end p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200" dir="rtl">
                  <div className="text-right flex-1">
                    <h3 className="font-bold text-blue-900 mb-2 text-lg">الخطوة 1: تحقق من حالة الاشتراك</h3>
                    <p className="text-blue-800">انتقل إلى صفحة الاشتراكات للتأكد من عدم وجود اشتراك نشط</p>
                    <p className="text-blue-700 text-sm mt-1">إذا كان لديك اشتراك نشط، يجب إلغاؤه أولاً</p>
                  </div>
                  <div className="bg-blue-600 rounded-full p-3 ml-4 flex-shrink-0">
                    <span className="text-white font-bold text-lg">1</span>
                  </div>
                </div>

                <div className="flex items-start justify-end p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200" dir="rtl">
                  <div className="text-right flex-1">
                    <h3 className="font-bold text-orange-900 mb-2 text-lg">الخطوة 2: انتقل إلى الإعدادات</h3>
                    <p className="text-orange-800">اذهب إلى صفحة إعدادات حسابك من القائمة الجانبية</p>
                    <p className="text-orange-700 text-sm mt-1">يمكنك الوصول إليها من الموقع أو التطبيق</p>
                  </div>
                  <div className="bg-orange-600 rounded-full p-3 ml-4 flex-shrink-0">
                    <span className="text-white font-bold text-lg">2</span>
                  </div>
                </div>

                <div className="flex items-start justify-end p-6 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200" dir="rtl">
                  <div className="text-right flex-1">
                    <h3 className="font-bold text-red-900 mb-2 text-lg">الخطوة 3: ابحث عن زر حذف الحساب</h3>
                    <p className="text-red-800">ستجد زر "حذف الحساب نهائياً" في أسفل صفحة الإعدادات</p>
                    <p className="text-red-700 text-sm mt-1">هذا الزر متوفر فقط إذا لم يكن لديك اشتراك نشط</p>
                  </div>
                  <div className="bg-red-600 rounded-full p-3 ml-4 flex-shrink-0">
                    <span className="text-white font-bold text-lg">3</span>
                  </div>
                </div>

                <div className="flex items-start justify-end p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200" dir="rtl">
                  <div className="text-right flex-1">
                    <h3 className="font-bold text-purple-900 mb-2 text-lg">الخطوة 4: تأكيد الحذف النهائي</h3>
                    <p className="text-purple-800">اكتب كلمة "حذف" في المربع المطلوب واضغط على تأكيد الحذف</p>
                    <p className="text-purple-700 text-sm mt-1">هذه العملية نهائية ولا يمكن التراجع عنها</p>
                  </div>
                  <div className="bg-purple-600 rounded-full p-3 ml-4 flex-shrink-0">
                    <span className="text-white font-bold text-lg">4</span>
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
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          dir="rtl"
        >
          <Button asChild size="lg" className="bg-red-600 hover:bg-red-700 text-lg px-8 py-3">
            <Link href="https://community.motherhoodclub.net/community/subscription">
              <CreditCard className="w-5 h-5 ml-2" />
              تحقق من حالة الاشتراك
            </Link>
          </Button>

          <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700 text-lg px-8 py-3">
            <Link href="https://community.motherhoodclub.net/community/settings">
              <Settings className="w-5 h-5 ml-2" />
              انتقل إلى الإعدادات
            </Link>
          </Button>

          <Button variant="outline" asChild size="lg" className="text-lg px-8 py-3 border-2">
            <Link href="https://community.motherhoodclub.net/community">العودة إلى المجتمع</Link>
          </Button>
        </motion.div>

        {/* Support Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="text-center bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-xl border border-blue-200"
          dir="rtl"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4">هل تحتاج مساعدة؟</h3>
          <p className="text-gray-600 text-lg leading-relaxed mb-4">
            إذا كنت تواجه مشاكل تقنية أو تحتاج مساعدة، يمكنك التواصل معنا قبل حذف حسابك.
            <br />
            فريق مجتمع الأمومة هنا لمساعدتك في حل أي مشكلة قد تواجهها على الموقع أو التطبيق.
          </p>
          <Button variant="outline" asChild className="border-blue-400 text-blue-700 hover:bg-blue-50">
            <Link href="mailto:info@motherhoodclub.net">تواصل معنا للمساعدة</Link>
          </Button>
        </motion.div>
      </div>

      {/* Footer */}
      <footer id="contact" className="bg-primary text-white py-12 mt-16" dir="rtl">
        <div className="container mx-auto px-4 text-center" dir="rtl">
          <p className="text-lg mb-4">جميع الحقوق محفوظة لمجتمع الأمومة © {new Date().getFullYear()}</p>
          <div className="flex justify-center space-x-4 rtl:space-x-reverse">
            <Link href="https://motherhoodclub.net/%d8%b4%d8%b1%d9%88%d8%b7-%d8%a7%d9%84%d8%a7%d8%b3%d8%aa%d8%ae%d8%af%d8%a7%d9%85/" className="hover:text-secondary transition-colors duration-300">
              شروط الاستخدام
            </Link>
            <Link href="https://motherhoodclub.net/%d8%b3%d9%8a%d8%a7%d8%b3%d8%a9-%d8%a7%d9%84%d8%ae%d8%b5%d9%88%d8%b5%d9%8a%d8%a9/" className="hover:text-secondary transition-colors duration-300">
              سياسة الخصوصية
            </Link>
            <Link href="mailto:info@motherhoodclub.net" className="hover:text-secondary transition-colors duration-300">
              اتصل بنا
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

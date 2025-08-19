import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { ArrowRight, Shield, Eye, Lock, Database, Smartphone, Trash2 } from "lucide-react"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">م</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">مجتمع الدعم التربوي</h1>
                <p className="text-sm text-gray-600">منصة متكاملة لدعم الأمهات</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-8 space-x-reverse">
              <Link href="/" className="text-gray-700 hover:text-pink-600 transition-colors">
                الرئيسية
              </Link>
              <Link href="/community" className="text-gray-700 hover:text-pink-600 transition-colors">
                المجتمع
              </Link>
              <Link href="/terms" className="text-gray-700 hover:text-pink-600 transition-colors">
                شروط الاستخدام
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">سياسة الخصوصية</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            كيف نجمع ونستخدم ونحمي بياناتك الشخصية في منصة مجتمع الدعم التربوي
          </p>
        </div>

        <div className="space-y-8">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-blue-600" />
                التزامنا بخصوصيتك
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                نحن في مجتمع الدعم التربوي نقدر خصوصيتك ونلتزم بحماية بياناتك الشخصية. هذه السياسة توضح كيف نجمع ونستخدم
                ونحمي معلوماتك عند استخدام موقعنا الإلكتروني وتطبيقاتنا المحمولة.
              </p>
              <p className="text-gray-700 leading-relaxed">تاريخ آخر تحديث: يناير 2025</p>
            </CardContent>
          </Card>

          {/* Data Collection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Database className="h-6 w-6 text-blue-600" />
                البيانات التي نجمعها
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">المعلومات الشخصية:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mr-4">
                  <li>الاسم والبريد الإلكتروني عند إنشاء الحساب</li>
                  <li>معلومات الملف الشخصي (الصورة، النبذة التعريفية)</li>
                  <li>تفضيلات الإشعارات والخصوصية</li>
                  <li>معلومات الاشتراك والدفع (عبر Stripe)</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">بيانات الاستخدام:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mr-4">
                  <li>المشاركات والتعليقات في المجتمع</li>
                  <li>الأسئلة والإجابات في قسم الاستشارات</li>
                  <li>سجل تصفح الموقع والتطبيق</li>
                  <li>إحصائيات الاستخدام والتفاعل</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">البيانات التقنية:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mr-4">
                  <li>عنوان IP ونوع المتصفح</li>
                  <li>معلومات الجهاز ونظام التشغيل</li>
                  <li>ملفات تعريف الارتباط (Cookies)</li>
                  <li>بيانات التحليلات (Google Analytics, Hotjar)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Data Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Eye className="h-6 w-6 text-blue-600" />
                كيف نستخدم بياناتك
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-gray-700 mr-4">
                <li>تقديم خدمات المنصة والمجتمع</li>
                <li>إرسال الإشعارات والتحديثات المهمة</li>
                <li>تحسين تجربة المستخدم وتطوير الخدمات</li>
                <li>معالجة المدفوعات والاشتراكات</li>
                <li>تحليل استخدام المنصة لأغراض التطوير</li>
                <li>ضمان الأمان ومنع الاستخدام المسيء</li>
                <li>الامتثال للمتطلبات القانونية</li>
              </ul>
            </CardContent>
          </Card>

          {/* Mobile Apps Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Smartphone className="h-6 w-6 text-blue-600" />
                خصوصية التطبيقات المحمولة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">تطبيق Android:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mr-4">
                  <li>يطلب أذونات الإنترنت والإشعارات فقط</li>
                  <li>لا يصل إلى جهات الاتصال أو الملفات الشخصية</li>
                  <li>يحفظ البيانات محلياً للتشغيل السريع</li>
                  <li>يتبع سياسات Google Play للخصوصية</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">تطبيق iOS:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mr-4">
                  <li>يلتزم بمعايير Apple للخصوصية</li>
                  <li>يطلب إذن الإشعارات عند الحاجة</li>
                  <li>لا يتتبع المستخدمين عبر التطبيقات الأخرى</li>
                  <li>يستخدم تشفير البيانات المحلية</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Data Protection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Lock className="h-6 w-6 text-blue-600" />
                حماية البيانات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">التدابير الأمنية:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mr-4">
                  <li>تشفير البيانات أثناء النقل والتخزين</li>
                  <li>استخدام خوادم آمنة ومحدثة</li>
                  <li>مراقبة مستمرة للأنشطة المشبوهة</li>
                  <li>نسخ احتياطية منتظمة للبيانات</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">الوصول المحدود:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mr-4">
                  <li>فقط الموظفون المخولون يمكنهم الوصول للبيانات</li>
                  <li>جميع الموظفين ملتزمون بسرية البيانات</li>
                  <li>مراجعة دورية لصلاحيات الوصول</li>
                  <li>تسجيل جميع عمليات الوصول للبيانات</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Data Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Trash2 className="h-6 w-6 text-blue-600" />
                حقوقك في البيانات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">حقوق المستخدم:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mr-4">
                  <li>
                    <strong>الوصول:</strong> طلب نسخة من جميع بياناتك
                  </li>
                  <li>
                    <strong>التصحيح:</strong> تعديل أو تحديث معلوماتك
                  </li>
                  <li>
                    <strong>الحذف:</strong> طلب حذف حسابك وبياناتك نهائياً
                  </li>
                  <li>
                    <strong>النقل:</strong> الحصول على بياناتك بصيغة قابلة للقراءة
                  </li>
                  <li>
                    <strong>الاعتراض:</strong> رفض معالجة بياناتك لأغراض معينة
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">كيفية ممارسة حقوقك:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mr-4">
                  <li>من خلال إعدادات الحساب في المنصة</li>
                  <li>صفحة الاشتراك تحتوي على خيار حذف الحساب</li>
                  <li>التواصل معنا عبر البريد الإلكتروني</li>
                  <li>سنرد على طلبك خلال 30 يوماً</li>
                </ul>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">حذف الحساب والبيانات:</h4>
                <ul className="list-disc list-inside space-y-1 text-red-700 text-sm mr-4">
                  <li>يمكن حذف الحساب من صفحة الإعدادات أو الاشتراك</li>
                  <li>سيتم حذف جميع البيانات الشخصية خلال 30 يوماً</li>
                  <li>المشاركات العامة قد تبقى مجهولة الهوية</li>
                  <li>عملية الحذف غير قابلة للإلغاء</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Third Party Services */}
          <Card>
            <CardHeader>
              <CardTitle>الخدمات الخارجية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">الخدمات المستخدمة:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mr-4">
                  <li>
                    <strong>Supabase:</strong> قاعدة البيانات والمصادقة
                  </li>
                  <li>
                    <strong>Stripe:</strong> معالجة المدفوعات
                  </li>
                  <li>
                    <strong>Resend:</strong> إرسال الإشعارات بالبريد الإلكتروني
                  </li>
                  <li>
                    <strong>Hotjar:</strong> تحليل تجربة المستخدم
                  </li>
                  <li>
                    <strong>Vercel:</strong> استضافة المنصة
                  </li>
                </ul>
              </div>
              <p className="text-gray-700">جميع هذه الخدمات تلتزم بمعايير عالية للخصوصية وحماية البيانات.</p>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card>
            <CardHeader>
              <CardTitle>ملفات تعريف الارتباط</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">أنواع الكوكيز المستخدمة:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mr-4">
                  <li>
                    <strong>الضرورية:</strong> لتشغيل المنصة وتسجيل الدخول
                  </li>
                  <li>
                    <strong>التحليلية:</strong> لفهم كيفية استخدام المنصة
                  </li>
                  <li>
                    <strong>الوظيفية:</strong> لحفظ تفضيلاتك
                  </li>
                  <li>
                    <strong>الأداء:</strong> لتحسين سرعة التحميل
                  </li>
                </ul>
              </div>
              <p className="text-gray-700">يمكنك إدارة إعدادات الكوكيز من متصفحك أو إعدادات الحساب.</p>
            </CardContent>
          </Card>

          {/* Updates */}
          <Card>
            <CardHeader>
              <CardTitle>تحديثات السياسة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                قد نقوم بتحديث هذه السياسة من وقت لآخر. سنقوم بإشعارك بأي تغييرات مهمة عبر:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mr-4">
                <li>إشعار في المنصة</li>
                <li>رسالة بريد إلكتروني</li>
                <li>إشعار في التطبيق المحمول</li>
              </ul>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>التواصل معنا</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                إذا كان لديك أي أسئلة حول سياسة الخصوصية أو تريد ممارسة حقوقك في البيانات:
              </p>
              <div className="space-y-2 text-gray-700">
                <p>البريد الإلكتروني: privacy@motherhoodclub.net</p>
                <p>البريد الإلكتروني العام: support@motherhoodclub.net</p>
                <p>الموقع: community.motherhoodclub.net</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/community" className="flex items-center gap-2">
              انضم للمجتمع
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/terms">اقرأ شروط الاستخدام</Link>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 space-x-reverse mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">م</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">مجتمع الدعم التربوي</h3>
                  <p className="text-gray-400">منصة متكاملة لدعم الأمهات</p>
                </div>
              </div>
              <p className="text-gray-400 max-w-md">نحن هنا لدعمك في رحلة الأمومة بمجتمع آمن ومحتوى تعليمي متخصص.</p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">روابط مهمة</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                    الرئيسية
                  </Link>
                </li>
                <li>
                  <Link href="/community" className="text-gray-400 hover:text-white transition-colors">
                    المجتمع
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                    شروط الاستخدام
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                    سياسة الخصوصية
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">تواصل معنا</h4>
              <ul className="space-y-2 text-gray-400">
                <li>support@motherhoodclub.net</li>
                <li>privacy@motherhoodclub.net</li>
                <li>community.motherhoodclub.net</li>
              </ul>
            </div>
          </div>

          <Separator className="my-8 bg-gray-800" />

          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">© 2025 مجتمع الدعم التربوي. جميع الحقوق محفوظة.</p>
            <div className="flex space-x-4 space-x-reverse mt-4 sm:mt-0">
              <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                الشروط
              </Link>
              <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
                الخصوصية
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

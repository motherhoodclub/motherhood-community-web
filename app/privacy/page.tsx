import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight, Shield, Eye, Lock, Database, Smartphone, Trash2 } from "lucide-react"
import { HeaderHome } from "@/components/header-home"

export default function PrivacyPage() {
  return (
    <div
      className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 font-alexandria overflow-hidden"
      dir="rtl"
    >
      {/* Header - Same as home page */}
      <div className="sticky top-0 w-full z-50 bg-white/90 backdrop-blur-md shadow-md">
        <HeaderHome />
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">سياسة الخصوصية</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            كيف نجمع ونستخدم ونحمي بياناتك الشخصية في منصة مجتمع الدعم التربوي
          </p>
        </div>

        <div className="space-y-8">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
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
                <Database className="h-6 w-6 text-primary" />
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
                <Eye className="h-6 w-6 text-primary" />
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
                <Smartphone className="h-6 w-6 text-primary" />
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
                <Lock className="h-6 w-6 text-primary" />
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
                <Trash2 className="h-6 w-6 text-primary" />
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
          <Button asChild className="bg-primary hover:bg-primary/90">
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

      {/* Footer - Same as home page */}
      <footer id="contact" className="bg-primary text-white py-12 mt-16" dir="rtl">
        <div className="container mx-auto px-4 text-center" dir="rtl">
          <p className="text-lg mb-4">جميع الحقوق محفوظة لمجتمع الأمومة © {new Date().getFullYear()}</p>
          <div className="flex justify-center space-x-4 rtl:space-x-reverse">
            <Link
              href="https://motherhoodclub.net/%d8%b4%d8%b1%d9%88%d8%b7-%d8%a7%d9%84%d8%a7%d8%b3%d8%aa%d8%ae%d8%af%d8%a7%d9%85/"
              className="hover:text-secondary transition-colors duration-300"
            >
              شروط الاستخدام
            </Link>
            <Link
              href="https://motherhoodclub.net/%d8%b3%d9%8a%d8%a7%d8%b3%d8%a9-%d8%a7%d9%84%d8%ae%d8%b5%d9%88%d8%b5%d9%8a%d8%a9/"
              className="hover:text-secondary transition-colors duration-300"
            >
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

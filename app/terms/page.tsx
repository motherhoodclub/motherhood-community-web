import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { ArrowRight, Shield, Users, Smartphone, Trash2 } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50" dir="rtl">
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
              <Link href="/privacy" className="text-gray-700 hover:text-pink-600 transition-colors">
                سياسة الخصوصية
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">شروط الاستخدام</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            شروط وأحكام استخدام منصة مجتمع الدعم التربوي وتطبيقاتها المحمولة
          </p>
        </div>

        <div className="space-y-8">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-pink-600" />
                مقدمة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                مرحباً بك في مجتمع الدعم التربوي. هذه الشروط والأحكام تحكم استخدامك لموقعنا الإلكتروني وتطبيقاتنا
                المحمولة (Android و iOS). باستخدام خدماتنا، فإنك توافق على الالتزام بهذه الشروط.
              </p>
              <p className="text-gray-700 leading-relaxed">تاريخ آخر تحديث: يناير 2025</p>
            </CardContent>
          </Card>

          {/* Community Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Users className="h-6 w-6 text-pink-600" />
                قواعد المجتمع
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">السلوك المقبول:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mr-4">
                  <li>احترام جميع الأعضاء والمشاركة بأدب واحترام</li>
                  <li>مشاركة المحتوى المفيد والبناء المتعلق بالتربية والأمومة</li>
                  <li>الحفاظ على خصوصية الآخرين وعدم مشاركة معلوماتهم الشخصية</li>
                  <li>استخدام اللغة المهذبة والابتعاد عن الألفاظ النابية</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">السلوك المحظور:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mr-4">
                  <li>نشر محتوى مسيء أو مضلل أو غير قانوني</li>
                  <li>التنمر أو المضايقة أو التهديد</li>
                  <li>انتهاك حقوق الطبع والنشر أو الملكية الفكرية</li>
                  <li>الترويج للمنتجات أو الخدمات دون إذن</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Apps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Smartphone className="h-6 w-6 text-pink-600" />
                تطبيقات الهاتف المحمول
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">تطبيق Android و iOS:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mr-4">
                  <li>التطبيقات متاحة للتحميل من متاجر التطبيقات الرسمية</li>
                  <li>يتطلب التطبيق إنشاء حساب للوصول إلى جميع الميزات</li>
                  <li>قد تتطلب بعض الميزات اشتراكاً مدفوعاً</li>
                  <li>نحتفظ بالحق في تحديث التطبيق وإضافة ميزات جديدة</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">الأذونات المطلوبة:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mr-4">
                  <li>الوصول إلى الإنترنت لتحميل المحتوى</li>
                  <li>إذن الإشعارات لتلقي التحديثات المهمة</li>
                  <li>إذن التخزين لحفظ الملفات المحملة (اختياري)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Trash2 className="h-6 w-6 text-pink-600" />
                إدارة البيانات وحذف الحساب
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">حقوقك في البيانات:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mr-4">
                  <li>يحق لك الوصول إلى جميع بياناتك الشخصية المحفوظة لدينا</li>
                  <li>يمكنك تعديل أو تحديث معلوماتك الشخصية في أي وقت</li>
                  <li>يحق لك طلب نسخة من بياناتك بصيغة قابلة للقراءة</li>
                  <li>يمكنك حذف حسابك وجميع بياناتك نهائياً</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">عملية حذف الحساب:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mr-4">
                  <li>يمكن حذف الحساب من صفحة الإعدادات أو صفحة الاشتراك</li>
                  <li>سيتم حذف جميع البيانات الشخصية خلال 30 يوماً</li>
                  <li>المشاركات العامة قد تبقى مجهولة الهوية لأغراض المجتمع</li>
                  <li>لا يمكن استرداد البيانات بعد الحذف النهائي</li>
                </ul>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 font-medium">
                  تنبيه: حذف الحساب عملية غير قابلة للإلغاء. تأكد من تحميل أي بيانات مهمة قبل المتابعة.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Subscriptions */}
          <Card>
            <CardHeader>
              <CardTitle>الاشتراكات والمدفوعات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-gray-700 mr-4">
                <li>الاشتراكات تتجدد تلقائياً ما لم يتم إلغاؤها</li>
                <li>يمكن إلغاء الاشتراك في أي وقت من صفحة الاشتراك</li>
                <li>لا توجد استردادات للفترات المدفوعة مسبقاً</li>
                <li>قد تتغير أسعار الاشتراكات مع إشعار مسبق</li>
              </ul>
            </CardContent>
          </Card>

          {/* Liability */}
          <Card>
            <CardHeader>
              <CardTitle>إخلاء المسؤولية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-gray-700 mr-4">
                <li>المحتوى المقدم للأغراض التعليمية والإرشادية فقط</li>
                <li>لا يغني عن الاستشارة الطبية أو النفسية المتخصصة</li>
                <li>نحن غير مسؤولين عن المحتوى المنشور من قبل المستخدمين</li>
                <li>استخدام المنصة على مسؤوليتك الشخصية</li>
              </ul>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>التواصل معنا</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">إذا كان لديك أي أسئلة حول هذه الشروط، يرجى التواصل معنا:</p>
              <div className="space-y-2 text-gray-700">
                <p>البريد الإلكتروني: support@motherhoodclub.net</p>
                <p>الموقع: community.motherhoodclub.net</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <Button asChild className="bg-pink-600 hover:bg-pink-700">
            <Link href="/community" className="flex items-center gap-2">
              انضم للمجتمع
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/privacy">اقرأ سياسة الخصوصية</Link>
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

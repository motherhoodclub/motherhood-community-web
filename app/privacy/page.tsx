import { HeaderHome } from "@/components/header-home"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50" dir="rtl">
      <HeaderHome />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">سياسة الخصوصية</h1>

          <div className="prose prose-lg max-w-none text-right">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. المعلومات التي نجمعها</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                نحن نجمع المعلومات التي تقدمينها لنا طوعاً عند التسجيل في موقعنا أو استخدام خدماتنا:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>المعلومات الشخصية مثل الاسم والبريد الإلكتروني</li>
                <li>المحتوى الذي تنشرينه في المنتديات والمناقشات</li>
                <li>معلومات الاستخدام وسجلات النشاط</li>
                <li>معلومات الجهاز والمتصفح</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. كيف نستخدم معلوماتك</h2>
              <p className="text-gray-700 leading-relaxed mb-4">نستخدم المعلومات التي نجمعها للأغراض التالية:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>تقديم وتحسين خدماتنا</li>
                <li>التواصل معك بشأن حسابك والخدمات</li>
                <li>إرسال التحديثات والإشعارات المهمة</li>
                <li>ضمان أمان وسلامة المنصة</li>
                <li>تحليل استخدام الموقع لتحسين التجربة</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. مشاركة المعلومات</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                نحن لا نبيع أو نؤجر أو نشارك معلوماتك الشخصية مع أطراف ثالثة إلا في الحالات التالية:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>بموافقتك الصريحة</li>
                <li>لتقديم الخدمات التي طلبتيها</li>
                <li>للامتثال للقوانين والأنظمة</li>
                <li>لحماية حقوقنا وسلامة المستخدمين</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. أمان المعلومات</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                نتخذ تدابير أمنية مناسبة لحماية معلوماتك من الوصول غير المصرح به أو التغيير أو الكشف أو التدمير. هذا
                يشمل:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>تشفير البيانات الحساسة</li>
                <li>استخدام اتصالات آمنة (HTTPS)</li>
                <li>مراقبة النظام بانتظام</li>
                <li>تحديث الأنظمة الأمنية</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. حقوقك</h2>
              <p className="text-gray-700 leading-relaxed mb-4">لديك الحق في:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>الوصول إلى معلوماتك الشخصية</li>
                <li>تصحيح أو تحديث معلوماتك</li>
                <li>حذف حسابك ومعلوماتك</li>
                <li>الاعتراض على معالجة معلوماتك</li>
                <li>نقل معلوماتك إلى خدمة أخرى</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. ملفات تعريف الارتباط</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                نستخدم ملفات تعريف الارتباط (Cookies) لتحسين تجربتك على موقعنا. يمكنك التحكم في هذه الملفات من خلال
                إعدادات متصفحك.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. التغييرات على هذه السياسة</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سنقوم بإشعارك بأي تغييرات مهمة عبر البريد الإلكتروني أو
                إشعار على الموقع.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. الاتصال بنا</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه أو كيفية تعاملنا مع معلوماتك، يرجى التواصل معنا على:
              </p>
              <p className="text-gray-700 leading-relaxed">البريد الإلكتروني: privacy@motherhood-platform.com</p>
            </section>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">عن المنصة</h3>
              <p className="text-gray-600 text-sm">منصة شاملة لدعم الأمهات في رحلة الأمومة والتربية</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">روابط مهمة</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="/community" className="hover:text-pink-600">
                    المجتمع
                  </a>
                </li>
                <li>
                  <a href="/community/workshops" className="hover:text-pink-600">
                    الورش
                  </a>
                </li>
                <li>
                  <a href="/community/qa" className="hover:text-pink-600">
                    الأسئلة والأجوبة
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">الدعم</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="/terms" className="hover:text-pink-600">
                    شروط الاستخدام
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="hover:text-pink-600">
                    سياسة الخصوصية
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">تواصل معنا</h3>
              <p className="text-gray-600 text-sm">support@motherhood-platform.com</p>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-gray-600 text-sm">
            <p>&copy; 2024 منصة الأمومة. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

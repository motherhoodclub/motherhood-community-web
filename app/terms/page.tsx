import { HeaderHome } from "@/components/header-home"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50" dir="rtl">
      <HeaderHome />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">شروط الاستخدام</h1>

          <div className="prose prose-lg max-w-none text-right">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. قبول الشروط</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                بوصولك واستخدامك لهذا الموقع، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي من
                هذه الشروط، يرجى عدم استخدام موقعنا.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. استخدام الموقع</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                يمكنك استخدام موقعنا للأغراض الشخصية والتعليمية فقط. يُمنع استخدام الموقع لأي أغراض تجارية أو غير
                قانونية.
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>احترام الآخرين وعدم نشر محتوى مسيء أو غير لائق</li>
                <li>عدم انتهاك حقوق الطبع والنشر</li>
                <li>عدم نشر معلومات شخصية للآخرين دون إذن</li>
                <li>الالتزام بالقوانين المحلية والدولية</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. المحتوى المنشور</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                أنت مسؤول عن جميع المحتويات التي تنشرها على الموقع. نحتفظ بالحق في إزالة أي محتوى نراه غير مناسب أو
                ينتهك هذه الشروط.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. الخصوصية</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                نحن نحترم خصوصيتك ونلتزم بحماية معلوماتك الشخصية. يرجى مراجعة سياسة الخصوصية الخاصة بنا لمزيد من
                التفاصيل.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. إخلاء المسؤولية</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                المعلومات المقدمة على هذا الموقع هي لأغراض تعليمية فقط ولا تشكل نصيحة طبية أو قانونية. استشر المختصين
                دائماً للحصول على نصيحة مهنية.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. التعديلات</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إشعارك بأي تغييرات مهمة عبر الموقع أو البريد الإلكتروني.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. الاتصال بنا</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                إذا كان لديك أي أسئلة حول هذه الشروط، يرجى التواصل معنا عبر البريد الإلكتروني أو من خلال صفحة الاتصال.
              </p>
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

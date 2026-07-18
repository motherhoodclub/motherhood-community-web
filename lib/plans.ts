import type { PlanType } from "./entitlements"

/**
 * Single source of truth for subscription plan presentation (prices, copy,
 * feature lists). Shared by the marketing landing page (components/pricing-
 * section.tsx) and the in-app purchase page (app/community/subscription).
 *
 * NOTE: The displayed prices are marketing copy. The amount actually charged is
 * driven by the Stripe price IDs resolved in app/api/create-checkout-session.
 */

export interface PlanFeature {
  text: string
  included: boolean
}

export interface Plan {
  id: PlanType
  /** Card title */
  name: string
  /** Big price, e.g. "33$" */
  price: string
  /** Period suffix, e.g. "شهرياً" or "/ 6 أشهر" */
  period: string
  /** Highlight badge, e.g. "⭐ الأكثر شعبية" */
  badge?: string
  /** Whether to visually emphasise this card */
  highlighted?: boolean
  /** Short bold tagline */
  tagline: string
  /** One-line description under the tagline */
  description: string
  /** CTA button label */
  cta: string
  /** Optional heading above the feature list, e.g. "يشمل ... بالإضافة إلى:" */
  featuresHeading?: string
  /** Feature rows (included = ✓, excluded = ✗) */
  features: PlanFeature[]
  /** Optional footnote shown under the features */
  note?: string
}

export const PRICING_HEADLINE = "اختاري الاشتراك المناسب لرحلتك التربوية"

export const PRICING_INTRO =
  "أكثر من 200 فيديو تدريبي، لقاء مباشر أسبوعي، إجابات على أسئلتك، ملفات وأنشطة جاهزة للطباعة، ودعم مستمر يساعدك على تربية أطفالك بثقة وهدوء."

export const PLANS: Plan[] = [
  {
    id: "monthly",
    name: "الاشتراك الشهري",
    price: "33$",
    period: "شهرياً",
    tagline: "ابدئي بخطوة صغيرة",
    description: "تعلمي استراتيجيات تربوية عملية واحصلي على الدعم الذي تحتاجينه.",
    cta: "اشتركي الآن",
    features: [
      { text: "الوصول إلى جميع فيديوهات المجتمع المسجلة", included: true },
      { text: "فيديو تدريبي جديد كل أسبوع", included: true },
      { text: "اللقاء المباشر الأسبوعي", included: true },
      { text: "إمكانية طرح الأسئلة داخل المجتمع", included: true },
      { text: "الوصول إلى جميع الملفات والأنشطة الحالية", included: true },
      { text: "المشاركة في التحديات الشهرية", included: true },
      { text: "الوصول إلى تطبيق Motherhood Club", included: true },
      { text: "الورش المدفوعة", included: false },
      { text: "تسجيلات الورش السابقة", included: false },
      { text: "مكتبة الملفات المميزة", included: false },
      { text: "الخصومات على الاستشارات", included: false },
      { text: "الدورات المسجلة", included: false },
      { text: "الجلسات الحصرية للأعضاء المميزين", included: false },
    ],
  },
  {
    id: "semi-annual",
    name: "اشتراك 6 أشهر",
    price: "165$",
    period: "/ 6 أشهر",
    badge: "⭐ الأكثر شعبية",
    highlighted: true,
    tagline: "ابني تغييراً يدوم",
    description: "ورش مباشرة، دعم مستمر، وأدوات عملية تساعدك على تحقيق نتائج حقيقية.",
    cta: "ابدئي الآن",
    featuresHeading: "يشمل جميع مزايا الاشتراك الشهري بالإضافة إلى:",
    features: [
      { text: "دخول مجاني لجميع الورش المباشرة خلال فترة الاشتراك", included: true },
      { text: "الوصول إلى تسجيلات الورش السابقة", included: true },
      { text: "مكتبة الملفات المميزة", included: true },
      { text: "خصم 15% على الاستشارات الفردية", included: true },
      { text: "أولوية بالإجابة على الأسئلة", included: true },
      { text: "شهادات إكمال للتحديات والبرامج عند الطلب", included: true },
    ],
  },
  {
    id: "yearly",
    name: "الاشتراك السنوي",
    price: "250$",
    period: "/ سنوياً",
    badge: "👑 أفضل قيمة",
    tagline: "كل ما تحتاجينه لمدة سنة كاملة",
    description: "احصلي على جميع المزايا بالإضافة إلى دورتين مسجلتين ومزايا حصرية للأعضاء السنويين.",
    cta: "احصلي على أفضل قيمة",
    featuresHeading: "يشمل جميع مزايا اشتراك 6 أشهر بالإضافة إلى:",
    features: [
      { text: "دورتان مسجلتان من اختيار المشترك", included: true },
      { text: "جلسة جماعية حصرية شهرية مع سما", included: true },
      { text: "خصم 25% على الاستشارات الفردية", included: true },
      { text: "أولوية قصوى بالإجابة على الأسئلة", included: true },
      { text: "الوصول المبكر للبرامج والورش الجديدة", included: true },
      { text: "مكتبة البونصات والملفات الحصرية", included: true },
      { text: "هدية رقمية ترحيبية", included: true },
    ],
    note: "يشمل دورتين مسجلتين من اختيار المشترك بقيمة تصل إلى 150 دولار.",
  },
]

export function getPlan(id: PlanType): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0]
}

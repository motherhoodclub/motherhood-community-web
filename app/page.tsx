"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  ChevronDown,
  ArrowUpCircle,
  Heart,
  Home,
  SmilePlus,
  Volume2,
  ShieldOff,
  Brain,
  Utensils,
  HelpCircle,
  HandHeart,
  Package,
  Gamepad2,
  Video,
  UserPlus,
  MousePointerClick,
  Wrench,
  Headphones,
  Check,
  X,
  Baby,
  Puzzle,
  Milk,
} from "lucide-react"
import { HeaderHome } from "@/components/header-home"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

// Particle Animation Component
const Particles = () => {
  const particleCount = 10
  const colors = ["rgba(8, 42, 69, 0.2)", "rgba(199, 216, 51, 0.2)"]

  return (
    <div className="absolute inset-0 overflow-hidden z-0">
      {Array.from({ length: particleCount }).map((_, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full"
          style={{
            background: colors[Math.floor(Math.random() * colors.length)],
            width: Math.random() * 20 + 5,
            height: Math.random() * 20 + 5,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, Math.random() * 100 - 50],
            x: [0, Math.random() * 100 - 50],
            opacity: [0, 0.7, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

// BackToTop Button Component
const BackToTop = () => {
  const { scrollYProgress } = useScroll()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const unsubscribe = scrollYProgress.onChange((v) => {
      setVisible(v > 0.2)
    })
    return unsubscribe
  }, [scrollYProgress])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          className="fixed bottom-8 left-8 z-50 p-3 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90"
          onClick={scrollToTop}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ArrowUpCircle className="w-6 h-6" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

export default function Home() {
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "100%"])
  const [mounted, setMounted] = useState(false)
  const [isHeaderFixed, setIsHeaderFixed] = useState(false)

  useEffect(() => {
    setMounted(true)

    const handleScroll = () => {
      setIsHeaderFixed(window.scrollY > 100)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!mounted) {
    return null
  }

  const problemCards = [
    { icon: Volume2, text: "أصرخ… ثم أندم" },
    { icon: ShieldOff, text: "طفلي يتحداني/ما يسمع" },
    { icon: Brain, text: "وقت الضغط أنسى كل اللي أعرفه" },
    { icon: Utensils, text: "صراعات الأكل تستنزفني" },
    { icon: HelpCircle, text: "محتاجة طريقة واضحة مو نصائح متفرقة" },
    { icon: HandHeart, text: "أحس اني وحدي وما عندي دعم" },
  ]

  const packages = [
    {
      title: "تربية بلا صراخ",
      icon: Volume2,
      color: "from-red-50 to-orange-50",
      accent: "bg-red-100 text-red-600",
      items: [
        "فهم جذور الغضب",
        "أدوات تهدئة سريعة + عميقة",
        "بدائل للصراخ والتهديد",
      ],
      result: "أم أهدأ + طفل أقل تحديًا",
    },
    {
      title: "أساسيات تربوية",
      icon: Home,
      color: "from-blue-50 to-indigo-50",
      accent: "bg-blue-100 text-blue-600",
      items: [
        "حدود بحزم بدون قسوة",
        "نظام واضح داخل البيت",
        "احترام بدون خوف",
      ],
      result: "بيت منظم + علاقة أقوى",
    },
    {
      title: "النضج العاطفي والتواصل الصحيح",
      icon: Heart,
      color: "from-pink-50 to-rose-50",
      accent: "bg-pink-100 text-pink-600",
      items: [
        "تعليم الطفل التعبير عن مشاعره",
        "جمل جاهزة للمواقف",
        "إصغاء واعي عملي",
      ],
      result: "تعاون أعلى + انفجارات أقل",
    },
    {
      title: "إدخال الطعام",
      icon: Utensils,
      color: "from-amber-50 to-yellow-50",
      accent: "bg-amber-100 text-amber-600",
      items: [
        "فهم رفض الطعام",
        "إيقاف صراعات المائدة",
        "بناء علاقة صحية مع الأكل",
      ],
      result: "أكل أهدأ بدون ضغط",
    },
    {
      title: "الرضاعة ومشاكلها",
      icon: Milk,
      color: "from-sky-50 to-cyan-50",
      accent: "bg-sky-100 text-sky-600",
      items: [
        "صعوبات الرضاعة",
        "الفطام بدون صدمة",
        "قرارات واعية بلا ذنب",
      ],
      result: "راحة للأم والطفل",
    },
    {
      title: "قسم خاص بالتوحد",
      icon: Puzzle,
      color: "from-purple-50 to-violet-50",
      accent: "bg-purple-100 text-purple-600",
      items: [
        "توعية داعمة غير مخيفة",
        "أدوات عملية يومية",
        "دعم بدون أحكام",
      ],
      result: "فهم + طمأنينة + خطوات واضحة",
    },
  ]

  const faqItems = [
    {
      q: "هل الدخول فوري بعد الدفع؟",
      a: "نعم، عند التسجيل ستكون كل الأدوات متوفرة لديك.",
    },
    {
      q: "هل المحتوى يناسب أعمار مختلفة؟",
      a: "المحتوى يساعد الأهالي من مرحلة الحمل وحتى عمر المراهقة.",
    },
    {
      q: "هل أحتاج وقت يوميًا؟ كم؟",
      a: "المحتوى مسجل لذلك يناسب الأمهات المشغولات للاستفادة منه حسب وقتهم الخاص.",
    },
    {
      q: "هل اللقاءات تتسجل؟",
      a: "جميع الورش واللقاءات مسجلة.",
    },
    {
      q: "شلون أعرف أي باقة أبدأ بها؟",
      a: "يمكنك الاستفسار من خلال قسم الأسئلة والفريق يساعدك بالاختيار والبدء بطريقة صحيحة.",
    },
    {
      q: "هل فيه أنشطة جاهزة للطفل؟",
      a: "عدد كبير من الأنشطة التي تدعم تطور الطفل العاطفي والمعرفي.",
    },
  ]

  const steps = [
    { icon: UserPlus, text: "تسجلين وتدخلين فورًا" },
    { icon: MousePointerClick, text: "تختارين الباقة حسب مشكلتك" },
    { icon: Wrench, text: "تطبقين الأدوات خطوة خطوة" },
    { icon: Headphones, text: "تتابعين اللقاءات والدعم" },
  ]

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 font-alexandria overflow-hidden"
      dir="rtl"
    >
      {/* Sticky Header */}
      <div
        className={`sticky top-0 w-full z-50 transition-all duration-300 ${isHeaderFixed ? "bg-white/90 backdrop-blur-md shadow-md" : ""}`}
      >
        <HeaderHome />
      </div>

      <BackToTop />

      <main>
        {/* ============================== */}
        {/* 1) Hero Section */}
        {/* ============================== */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-20">
          <Particles />
          <motion.div
            className="absolute inset-0 z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <div className="absolute inset-0 overflow-hidden">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/markus-spiske-97Rpu-UmCaY-unsplash.jpg-3KFMHqVOnYu9bOCowifl5ujEHdVZ2K.jpeg"
                alt="خلفية مجتمع الدعم التربوي"
                fill
                priority
                quality={75}
                className="object-cover object-center filter brightness-75"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-primary/60" />
              <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-transparent to-primary/80" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/70 via-transparent to-primary/70" />
              <div
                className="absolute inset-0"
                style={{
                  background: "radial-gradient(circle at center, transparent 0%, rgba(8, 42, 69, 0.6) 100%)",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/50 to-secondary/30 mix-blend-overlay" />
              <div
                className="absolute inset-0"
                style={{
                  boxShadow: "inset 0 0 100px 20px rgba(0, 0, 0, 0.5)",
                }}
              />
            </div>
          </motion.div>

          <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
            <motion.h1
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4 text-white leading-tight"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              مجتمع الدعم التربوي
            </motion.h1>

            <motion.p
              className="text-2xl md:text-3xl text-secondary font-bold mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              توقفي عن الصراخ… وابدئي تربية أهدأ وأكثر وعيًا
            </motion.p>

            <motion.p
              className="text-lg md:text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              مجتمع دعم تربوي عملي يعطيك أدوات واضحة + باقات متخصصة + لقاءات مباشرة… لتحلين مشاكل التربية من جذورها.
            </motion.p>

            {/* Loom Video Embed */}
            <motion.div
              className="mb-10 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <div style={{ position: "relative", paddingBottom: "62.5%", height: 0 }}>
                <iframe
                  src="https://www.loom.com/embed/49975ea48d33451ebacbefcf8fe69d3d?sid=&hide_owner=true&hide_share_and_embed=true&hide_title=true&hideEmbedTopBar=true"
                  frameBorder="0"
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                  allowFullScreen
                />
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 rtl:space-x-reverse mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              <Button
                size="lg"
                className="bg-secondary hover:bg-secondary/90 text-primary font-bold text-lg px-10 py-6 transition-all duration-300 ease-in-out hover:shadow-lg transform hover:-translate-y-1 group"
                asChild
              >
                <Link href="https://community.motherhoodclub.net/auth/register">
                  <span>انضمي الآن</span>
                  <motion.span
                    className="inline-block mr-2"
                    animate={{ x: [0, -5, 0] }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, repeatType: "loop" }}
                  >
                    ←
                  </motion.span>
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-white border-white/50 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-lg px-8 transition-all duration-300 ease-in-out hover:shadow-lg transform hover:-translate-y-1"
                asChild
              >
                <Link href="#offerings">ماذا ستجدين داخل المجتمع</Link>
              </Button>
            </motion.div>

            {/* Micro-trust */}
            <motion.div
              className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 text-white/70 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              <span className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-secondary" />
                مناسب لأمهات من مرحلة الحمل وحتى عمر المراهقة
              </span>
              <span className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-secondary" />
                محتوى عملي وليس تنظير
              </span>
            </motion.div>

            {/* App Download */}
            <motion.div
              className="mt-10 pt-8 border-t border-white/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
            >
              <p className="text-white/70 mb-4">أو حمّلي التطبيق على جوالك</p>
              <div className="flex flex-row justify-center gap-4">
                <a
                  href="https://play.google.com/store/apps/details?id=com.mmayman1009.motherhoodclubappqy4uoy10&hl=en"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-transform hover:scale-105"
                >
                  <Image
                    src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                    alt="حمل من Google Play"
                    width={135}
                    height={40}
                    className="h-12 w-auto"
                  />
                </a>
                <a
                  href="https://apps.apple.com/in/app/motherhoodclub-community/id6749237917?platform=vision"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-transform hover:scale-105"
                >
                  <Image
                    src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                    alt="حمل من App Store"
                    width={120}
                    height={40}
                    className="h-12 w-auto"
                  />
                </a>
              </div>
            </motion.div>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
          >
            <ChevronDown className="w-10 h-10 text-white" />
          </motion.div>
        </section>

        {/* ============================== */}
        {/* 2) "هل المجتمع مناسب لك؟" */}
        {/* ============================== */}
        <section className="py-20 bg-white relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4 px-3 py-1 bg-secondary/20 text-primary rounded-full">هل المجتمع مناسب لك؟</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary leading-tight max-w-3xl mx-auto">
                إذا تحسين إنك متعبة ومرهقة من التربية رغم محاولاتك فأنتِ بالمكان الصحيح
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
              {problemCards.map((card, index) => (
                <motion.div
                  key={index}
                  className="bg-gray-50 border border-gray-100 rounded-xl p-6 text-center hover:shadow-custom-hover transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="bg-primary/10 p-3 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                    <card.icon className="w-7 h-7 text-primary" />
                  </div>
                  <p className="text-gray-700 font-medium text-lg">{card.text}</p>
                </motion.div>
              ))}
            </div>

            <motion.p
              className="text-center text-xl font-bold text-primary max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              هذا المجتمع ليس للأمهات المثاليات… هذا للأمهات الحقيقيات اللي يريدون تغيير فعلي.
            </motion.p>
          </div>
        </section>

        {/* ============================== */}
        {/* 3) Value Section – النتائج المتوقعة */}
        {/* ============================== */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 to-secondary/5 opacity-50"
            style={{ y }}
          />
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <Badge className="mb-4 px-3 py-1 bg-secondary/20 text-primary rounded-full">النتائج المتوقعة</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">ماهو التغيير الذي ستلاحظيه؟</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
              {[
                {
                  icon: SmilePlus,
                  title: "أم أهدأ",
                  description: "تقل العصبية وردات الفعل",
                  color: "bg-green-50 border-green-100",
                  iconBg: "bg-green-100",
                  iconColor: "text-green-600",
                },
                {
                  icon: Home,
                  title: "بيت أوضح",
                  description: "حدود محترمة بدون تهديد",
                  color: "bg-blue-50 border-blue-100",
                  iconBg: "bg-blue-100",
                  iconColor: "text-blue-600",
                },
                {
                  icon: Baby,
                  title: "طفل أهدأ",
                  description: "يفهم مشاعره ويتعاون أكثر",
                  color: "bg-purple-50 border-purple-100",
                  iconBg: "bg-purple-100",
                  iconColor: "text-purple-600",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className={`${item.color} border rounded-xl p-8 text-center shadow-custom hover:shadow-custom-hover transition-all duration-300`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  whileHover={{ y: -5 }}
                >
                  <div className={`${item.iconBg} p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-5`}>
                    <item.icon className={`w-8 h-8 ${item.iconColor}`} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-primary">{item.title}</h3>
                  <p className="text-gray-600 text-lg">{item.description}</p>
                </motion.div>
              ))}
            </div>

            <motion.p
              className="text-center text-xl font-bold text-primary"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              التغيير ليس فقط بطفلك… التغيير يبدأ منك.
            </motion.p>
          </div>
        </section>

        {/* ============================== */}
        {/* 4) Core Offering – ماذا ستجدين داخل المجتمع */}
        {/* ============================== */}
        <section id="offerings" className="py-20 bg-white relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <Badge className="mb-4 px-3 py-1 bg-secondary/20 text-primary rounded-full">ماذا ستجدين؟</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">
                داخل المجتمع… عندك نظام كامل، وليس محتوى عشوائي
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
              {[
                {
                  icon: Package,
                  title: "حزم تربوية متكاملة",
                  description: "باقات متخصصة تحل مشاكل محددة (صراخ/حدود/مشاعر/طعام/رضاعة/توحد)",
                  color: "from-primary/5 to-primary/10",
                },
                {
                  icon: Gamepad2,
                  title: "أنشطة للأطفال",
                  description: "أنشطة بسيطة وقابلة للتطبيق داخل البيت لتطوير مهارات طفلك",
                  color: "from-secondary/5 to-secondary/10",
                },
                {
                  icon: Video,
                  title: "ورش ولقاءات مباشرة + دعم",
                  description: "لقاءات مباشرة للتوجيه والإجابة + مساحة آمنة للأسئلة والدعم المستمر",
                  color: "from-primary/5 to-secondary/5",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className={`bg-gradient-to-br ${item.color} rounded-xl p-8 text-center border border-gray-100 shadow-custom hover:shadow-custom-hover transition-all duration-300`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <div className="bg-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-5 shadow-sm">
                    <item.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-primary">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>

            {/* Mid-page CTA */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-lg px-10 py-6 transition-all duration-300 ease-in-out hover:shadow-lg transform hover:-translate-y-1"
                asChild
              >
                <Link href="https://community.motherhoodclub.net/auth/register">
                  ابدئي الآن – الدخول فوري
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* ============================== */}
        {/* 5) Packages Section */}
        {/* ============================== */}
        <section id="packages" className="py-20 bg-gray-50 relative overflow-hidden">
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <svg className="absolute w-full h-full opacity-10" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path
                fill="#082a45"
                d="M47.7,-57.2C59.5,-47.3,65.5,-30.9,67.7,-14.3C69.9,2.3,68.3,19.2,60.6,32.6C52.9,46,39.2,55.9,24.1,62.3C9,68.7,-7.4,71.6,-22.7,67.4C-38,63.2,-52.1,52,-61.1,37.8C-70.1,23.7,-74,6.6,-70.8,-8.8C-67.7,-24.2,-57.5,-38,-45,-48.7C-32.5,-59.3,-16.2,-66.9,0.8,-67.8C17.9,-68.8,35.8,-67.2,47.7,-57.2Z"
                transform="translate(100 100)"
              />
            </svg>
          </motion.div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <Badge className="mb-4 px-3 py-1 bg-secondary/20 text-primary rounded-full">الباقات</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">
                اختاري مشكلتك… وخلي المجتمع يعطيك المسار
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {packages.map((pkg, index) => (
                <motion.div
                  key={index}
                  className={`bg-gradient-to-br ${pkg.color} rounded-xl overflow-hidden shadow-custom hover:shadow-custom-hover transition-all duration-300 border border-gray-100`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`${pkg.accent} p-3 rounded-full`}>
                        <pkg.icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold text-primary">{pkg.title}</h3>
                    </div>

                    <ul className="space-y-3 mb-5">
                      {pkg.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-700">
                          <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-white/80">
                      <p className="text-sm font-bold text-primary">
                        <span className="text-secondary">النتيجة:</span> {pkg.result}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================== */}
        {/* 6) Activities Section */}
        {/* ============================== */}
        <section className="py-20 bg-white relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4 px-3 py-1 bg-secondary/20 text-primary rounded-full">أنشطة الأطفال</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">
                ليس فقط للأم.. نقدم لطفلك أنشطة وأدوات تطور مهاراته
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto mb-6"></div>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                أنشطة بسيطة تساعد طفلك على تطوير مهاراته العاطفية والاجتماعية والسلوكية… وتخلّي التطبيق داخل البيت أسهل.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { icon: Heart, text: "أنشطة لتنمية مهارات المشاعر والتواصل" },
                { icon: Wrench, text: "أدوات قابلة للطباعة/التطبيق" },
                { icon: Baby, text: "تركيز على التطور الحقيقي" },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="bg-secondary/5 border border-secondary/10 rounded-xl p-6 text-center hover:shadow-custom transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  whileHover={{ y: -3 }}
                >
                  <div className="bg-secondary/20 p-3 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <p className="text-gray-700 font-medium">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================== */}
        {/* 7) Live & Workshops Section */}
        {/* ============================== */}
        <section className="py-20 bg-gray-50 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4 px-3 py-1 bg-secondary/20 text-primary rounded-full">لقاءات وورش</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">
                لقاءات مباشرة وورش… حتى ما تبقين وحدك
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { icon: Video, text: "لقاءات مباشرة للتوجيه والإجابة" },
                { icon: Wrench, text: "تطبيق على حالات واقعية" },
                { icon: HandHeart, text: "مساحة آمنة للأسئلة" },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="bg-white border border-gray-100 rounded-xl p-6 text-center shadow-custom hover:shadow-custom-hover transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  whileHover={{ y: -3 }}
                >
                  <div className="bg-primary/10 p-3 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <p className="text-gray-700 font-medium">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================== */}
        {/* 8) How it Works – خطوات بسيطة */}
        {/* ============================== */}
        <section className="py-20 bg-white relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4 px-3 py-1 bg-secondary/20 text-primary rounded-full">كيف تبدأين؟</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">
                كيف ستكون التجربة بعد التسجيل؟
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  className="relative text-center"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                >
                  {/* Step number */}
                  <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold shadow-lg">
                    {index + 1}
                  </div>

                  {/* Connector line (hidden on mobile and last item) */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-6 right-0 w-full h-0.5 bg-gradient-to-l from-primary/30 to-secondary/30 -z-10 translate-x-1/2" />
                  )}

                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                    <div className="bg-secondary/20 p-3 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                      <step.icon className="w-7 h-7 text-primary" />
                    </div>
                    <p className="text-gray-700 font-medium">{step.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================== */}
        {/* 9) Who it's for / Not for */}
        {/* ============================== */}
        <section className="py-20 bg-gray-50 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4 px-3 py-1 bg-secondary/20 text-primary rounded-full">لمن هذا المجتمع؟</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">
                هذا المجتمع مناسب لك إذا…
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Suitable */}
              <motion.div
                className="bg-white rounded-xl p-8 border border-green-100 shadow-custom"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="text-xl font-bold text-green-600 mb-6 flex items-center gap-2">
                  <Check className="w-6 h-6" />
                  مناسب لكِ إذا:
                </h3>
                <ul className="space-y-4">
                  {[
                    "تريدين تغيير طويل الأمد",
                    "تحبين الأدوات الواضحة والتطبيق العملي",
                    "تحتاجين دعم واستمرارية",
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Not suitable */}
              <motion.div
                className="bg-white rounded-xl p-8 border border-red-100 shadow-custom"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.15 }}
              >
                <h3 className="text-xl font-bold text-red-500 mb-6 flex items-center gap-2">
                  <X className="w-6 h-6" />
                  غير مناسب إذا:
                </h3>
                <ul className="space-y-4">
                  {[
                    "تبحثين عن حل سحري بدون التزام",
                    "تريدين \"معلومة سريعة\" بدون تطبيق",
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <X className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ============================== */}
        {/* 10) FAQ Section */}
        {/* ============================== */}
        <section className="py-20 bg-white relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4 px-3 py-1 bg-secondary/20 text-primary rounded-full">أسئلة شائعة</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">الأسئلة الشائعة</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto"></div>
            </div>

            <motion.div
              className="max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-200">
                    <AccordionTrigger className="text-right text-lg font-medium text-primary hover:text-primary/80 py-5">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 text-base leading-relaxed pb-5">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </div>
        </section>

        {/* ============================== */}
        {/* 11) Final CTA Section */}
        {/* ============================== */}
        <section className="py-20 bg-gradient-to-br from-primary via-primary/95 to-primary relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-40 h-40 bg-secondary rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-60 h-60 bg-secondary rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              className="text-center max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-white leading-tight">
                التربية تكون أصعب بدون خطة وأدوات واضحة
              </h2>
              <p className="text-xl text-white/80 mb-10 leading-relaxed">
                إذا تريدين تربية أهدأ، حدود أوضح، وطفل يفهم نفسه ويتعاون… المجتمع راح يكون سندك.
              </p>

              {/* CTA Button */}
              <div className="mb-6">
                <Button
                  size="lg"
                  className="bg-secondary hover:bg-secondary/90 text-primary font-bold text-xl px-12 py-7 transition-all duration-300 ease-in-out hover:shadow-xl transform hover:-translate-y-1"
                  asChild
                >
                  <Link href="https://community.motherhoodclub.net/auth/register">
                    <span>انضمّي الآن</span>
                    <ArrowRight className="mr-2 h-6 w-6" />
                  </Link>
                </Button>
              </div>

              <p className="text-white/60 text-sm">
                دخول فوري &bull; أدوات عملية
              </p>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className="bg-primary text-white py-12" dir="rtl">
        <div className="container mx-auto px-4 text-center" dir="rtl">
          <p className="text-lg mb-4">جميع الحقوق محفوظة لمجتمع الأمومة &copy; {new Date().getFullYear()}</p>
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

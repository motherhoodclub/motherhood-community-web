"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  MessageCircle,
  Users,
  Calendar,
  Heart,
  Book,
  Star,
  ArrowRight,
  ChevronDown,
  CheckCircle,
  Award,
  ArrowUpCircle,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react"
import { HeaderHome } from "@/components/header-home"
import { PricingSection } from "@/components/pricing-section"

const MotionLink = motion(Link)

// Particle Animation Component
const Particles = () => {
  const particleCount = 20
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

// Floating Bubble Component
const FloatingBubble = ({ children, delay = 0, position = {} }) => (
  <motion.div
    className="absolute"
    style={{
      ...position,
      right: position.right || `${Math.random() * 20 + 5}%`,
      top: position.top || `${Math.random() * 30 + 20}%`,
    }}
    initial={{ y: 100, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{
      type: "spring",
      stiffness: 100,
      damping: 10,
      delay: delay,
    }}
  >
    {children}
  </motion.div>
)

// Wave Divider Component
// const WaveDivider = ({ flip = false, className = "", color = "text-white" }) => (
//   <div
//     className={`absolute ${flip ? "bottom-0 rotate-180" : "top-0"} left-0 w-full overflow-hidden leading-0 ${className}`}
//   >
//     <svg className={`relative block w-full h-16 md:h-24 ${color}`} viewBox="0 0 1200 120" preserveAspectRatio="none">
//       <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z"></path>
//     </svg>
//   </div>
// )

// Enhanced Service Card
const ServiceCard = ({ title, icon: Icon, color, description }) => {
  const cardRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      ref={cardRef}
      className={`${color} p-6 rounded-lg shadow-custom transition-all duration-300 ease-in-out transform hover:-translate-y-2 hover:shadow-custom-hover relative overflow-hidden`}
      whileHover={{ scale: 1.05 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div
        className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary transform origin-left transition-all duration-300 ease-in-out"
        style={{ transform: isHovered ? "scaleX(1)" : "scaleX(0)" }}
      />
      <div className="flex items-start">
        <div className="p-3 rounded-full bg-white/30 backdrop-blur-sm mr-4">
          <Icon className={`w-10 h-10 transition-all duration-300 ${isHovered ? "scale-110 text-primary" : ""}`} />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-gray-600">{description}</p>
        </div>
      </div>

      {isHovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-primary font-medium flex items-center"
        >
          <span>تعرفي على المزيد</span>
          <ArrowRight className="mr-2 h-4 w-4" />
        </motion.div>
      )}
    </motion.div>
  )
}

// Statistics Card Component
const StatCard = ({ value, label, icon: Icon }) => (
  <motion.div
    className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-custom text-center"
    whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(8, 42, 69, 0.2)" }}
  >
    <div className="flex justify-center mb-4">
      <div className="p-4 rounded-full bg-secondary/20">
        <Icon className="w-8 h-8 text-primary" />
      </div>
    </div>
    <h3 className="text-4xl font-bold mb-2 text-primary">{value}</h3>
    <p className="text-gray-600">{label}</p>
  </motion.div>
)

// Expert Profile Card
const ExpertCard = ({ name, specialty, avatar }) => (
  <motion.div
    className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-custom text-center"
    whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(8, 42, 69, 0.2)" }}
  >
    <Avatar className="w-24 h-24 mx-auto border-4 border-secondary/30">
      <AvatarImage src={avatar || "/placeholder.svg"} alt={name} />
      <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{name[0]}</AvatarFallback>
    </Avatar>
    <h3 className="text-xl font-semibold mt-4 mb-2">{name}</h3>
    <p className="text-gray-600">{specialty}</p>
    <Badge className="mt-4 bg-secondary/20 text-primary hover:bg-secondary/30">متاح للاستشارة</Badge>
  </motion.div>
)

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

// Feature Card Component
const FeatureCard = ({ icon: Icon, title, description }) => (
  <motion.div
    className="bg-white rounded-lg p-6 shadow-custom hover:shadow-custom-hover transition-all duration-300"
    whileHover={{ y: -5 }}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
  >
    <div className="bg-primary/10 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
      <Icon className="w-7 h-7 text-primary" />
    </div>
    <h3 className="text-xl font-semibold mb-2 text-primary">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </motion.div>
)

export default function Home() {
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "100%"])
  const [mounted, setMounted] = useState(false)
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0)
  const [isHeaderFixed, setIsHeaderFixed] = useState(false)
  const [expanded, setExpanded] = useState({})

  const testimonials = [
    {
      name: "سارة أحمد",
      comment: "مجتمع الدعم التربوي غير حياتي كوالد. الدعم والمعلومات التي حصلت عليها لا تقدر بثمن.",
      avatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=100&h=100&fit=crop",
    },
    {
      name: "منى الخالد",
      comment: "الاستشارات المتخصصة ساعدتني كثيراً في التعامل مع تحديات تربية أطفالي.",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
    },
    {
      name: "نورة العتيبي",
      comment: "المجتمع هنا رائع. وجدت أصدقاء والآباء والأمهات يفهمون تماماً ما أمر به.",
      avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&h=100&fit=crop",
    },
    {
      name: "ليلى القحطاني",
      comment: "ورش العمل التفاعلية أعطتني مهارات جديدة ساعدتني في فهم احتياجات طفلي بشكل أفضل.",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop",
    },
  ]

  useEffect(() => {
    setMounted(true)

    const handleScroll = () => {
      setIsHeaderFixed(window.scrollY > 100)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonialIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [testimonials.length])

  if (!mounted) {
    return null
  }

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
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-20">
          <Particles />
          <motion.div
            className="absolute inset-0 z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            {/* Background image with multiple overlay layers */}
            <div className="absolute inset-0 overflow-hidden">
              {/* Base image with reduced brightness */}
              <motion.img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/markus-spiske-97Rpu-UmCaY-unsplash.jpg-3KFMHqVOnYu9bOCowifl5ujEHdVZ2K.jpeg"
                alt="Background"
                className="w-full h-full object-cover object-center filter brightness-75"
                initial={{ scale: 1.1 }}
                animate={{
                  scale: [1.1, 1.15, 1.1],
                  filter: ["brightness(0.75)", "brightness(0.65)", "brightness(0.75)"],
                }}
                transition={{
                  duration: 20,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                }}
              />

              {/* Solid color overlay */}
              <div className="absolute inset-0 bg-primary/60" />

              {/* Vertical gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-transparent to-primary/80" />

              {/* Horizontal gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/70 via-transparent to-primary/70" />

              {/* Radial gradient for depth */}
              <div
                className="absolute inset-0"
                style={{
                  background: "radial-gradient(circle at center, transparent 0%, rgba(8, 42, 69, 0.6) 100%)",
                }}
              />

              {/* Accent color overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/50 to-secondary/30 mix-blend-overlay" />

              {/* Vignette effect */}
              <div
                className="absolute inset-0"
                style={{
                  boxShadow: "inset 0 0 100px 20px rgba(0, 0, 0, 0.5)",
                }}
              />
            </div>
          </motion.div>
          <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
            <Badge className="inline-block mb-6 px-4 py-2 bg-white/80 backdrop-blur-sm text-primary rounded-full shadow-md">
              منصة رائدة للآباء والأمهات في العالم العربي
            </Badge>
            <motion.h1
              className="text-6xl md:text-7xl font-bold mb-8 text-white leading-tight"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              رحلة التربية أجمل
              <br />
              <motion.span
                className="text-secondary inline-block"
                animate={{
                  textShadow: [
                    "0 0 0px rgba(199, 216, 51, 0)",
                    "0 0 10px rgba(199, 216, 51, 0.5)",
                    "0 0 0px rgba(199, 216, 51, 0)",
                  ],
                }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
              >
                مع الدعم والمعرفة
              </motion.span>
            </motion.h1>
            <motion.p
              className="text-xl text-white mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              انضم إلى مجتمع الدعم التربوي واحصل على الدعم والمعرفة التي تحتاجها في كل مرحلة من رحلة الوالدية
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 rtl:space-x-reverse"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-lg px-8 transition-all duration-300 ease-in-out hover:shadow-lg transform hover:-translate-y-1 group"
                asChild
              >
                <Link href="https://community.motherhoodclub.net/auth/register">
                  <span>ابدأ رحلتك معنا</span>
                  <motion.span
                    className="inline-block ml-2"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, repeatType: "loop" }}
                  >
                    →
                  </motion.span>
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-black border-white bg-white/80 hover:bg-white/90 text-lg px-8 transition-all duration-300 ease-in-out hover:shadow-lg transform hover:-translate-y-1"
              >
                تعرف على خدماتنا
              </Button>
            </motion.div>
          </div>

          {/* Floating Elements */}

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
          >
            <ChevronDown className="w-10 h-10 text-white" />
          </motion.div>

          {/* Wave Divider */}
          {/* <WaveDivider className="bottom-0" flip={true} color="text-white" /> */}
        </section>

        {/* Features Section - NEW */}
        <section className="py-20 bg-white relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4 px-3 py-1 bg-secondary/20 text-primary rounded-full">مميزاتنا</Badge>
              <h2 className="text-4xl font-semibold mb-4 text-primary">ما يميز مجتمع الدعم التربوي</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard
                icon={Shield}
                title="خبرة موثوقة"
                description="خبرة أكثر من 6 سنوات في مجالات التربية والطفولة لتقديم المشورة الموثوقة"
              />
              <FeatureCard
                icon={Users}
                title="مجتمع داعم"
                description="تواصل مع الآباء والأمهات آخرين وتبادل الخبرات والتجارب في بيئة آمنة وداعمة"
              />
              <FeatureCard
                icon={Sparkles}
                title="محتوى متميز"
                description="مقالات وفيديوهات تعليمية عالية الجودة مصممة خصيصاً لتلبية احتياجاتك"
              />
              <FeatureCard
                icon={Zap}
                title="دعم مستمر"
                description="خدمات استشارية على مدار الساعة لمساعدتك في التغلب على تحديات التربية"
              />
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-20 relative overflow-hidden bg-gray-50">
          <motion.div
            className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 to-secondary/5 opacity-50"
            style={{ y }}
          />
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <Badge className="mb-4 px-3 py-1 bg-secondary/20 text-primary rounded-full">خدماتنا</Badge>
              <h2 className="text-4xl font-semibold mb-4 text-primary">خدماتنا الشاملة</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <ServiceCard
                title="استشارات متخصصة"
                icon={MessageCircle}
                color="bg-primary/5"
                description="احصل على نصائح من خبراء في مجالات التربية والطفولة"
              />
              <ServiceCard
                title="مجتمع داعم"
                icon={Users}
                color="bg-secondary/5"
                description="تواصل مع الآباء والأمهات آخرين وتبادل الخبرات والدعم"
              />
              <ServiceCard
                title="ورش عمل وفعاليات"
                icon={Calendar}
                color="bg-primary/5"
                description="شارك في ورش عمل تفاعلية لتطوير مهاراتك في التربية"
              />
              <ServiceCard
                title="مكتبة تعليمية"
                icon={Book}
                color="bg-secondary/5"
                description="استفيدي من مجموعة واسعة من المقالات والفيديوهات التعليمية"
              />
              <ServiceCard
                title="متابعة صحية"
                icon={Heart}
                color="bg-primary/5"
                description="احصل على نصائح ومتابعة لصحتك وصحة طفلك"
              />
              <ServiceCard
                title="دعم نفسي"
                icon={Star}
                color="bg-secondary/5"
                description="جلسات دعم نفسي لمساعدتك في التعامل مع تحديات التربية"
              />
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <PricingSection />

        {/* Statistics Section - Hidden */}
        <section className="hidden py-20 bg-gradient-to-r from-primary/10 to-secondary/10 relative overflow-hidden">
          {/* <WaveDivider color="text-white" /> */}
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <Badge className="mb-4 px-3 py-1 bg-white text-primary rounded-full">إحصائيات</Badge>
              <h2 className="text-4xl font-semibold mb-4 text-primary">مجتمع الدعم التربوي بالأرقام</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <StatCard value="10,000+" label="الآباء والأمهات في المجتمع" icon={Users} />
              <StatCard value="120+" label="خبير متخصص" icon={Award} />
              <StatCard value="500+" label="استشارة شهرياً" icon={MessageCircle} />
              <StatCard value="50+" label="ورشة عمل سنوياً" icon={Calendar} />
            </div>
          </div>
          {/* <WaveDivider className="bottom-0" flip={true} color="text-white" /> */}
        </section>

        {/* Why Us Section */}
        <section id="community" className="py-20 relative overflow-hidden bg-white">
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
              <Badge className="mb-4 px-3 py-1 bg-secondary/20 text-primary rounded-full">مميزاتنا</Badge>
              <h2 className="text-4xl font-semibold mb-4 text-primary">لماذا مجتمع الدعم التربوي؟</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { text: "خبراء متخصصون في مجالات التربية والطفولة", icon: Award },
                { text: "مجتمع داعم من الآباء والأمهات لتبادل الخبرات", icon: Users },
                { text: "محتوى موثوق ومحدث باستمرار", icon: CheckCircle },
                { text: "دعم شامل لجميع مراحل الوالدية", icon: Heart },
                { text: "ورش عمل وفعاليات تفاعلية", icon: Calendar },
                { text: "خدمات استشارية على مدار الساعة", icon: MessageCircle },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-custom group hover:border-secondary/30 border border-transparent"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(8, 42, 69, 0.2)" }}
                >
                  <div className="bg-secondary/20 p-4 rounded-full inline-block mb-4 group-hover:bg-secondary/30 transition-colors duration-300">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-gray-700 text-lg">{feature.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Experts Section */}
        <section className="py-20 bg-gradient-to-r from-primary/10 to-secondary/10 relative overflow-hidden">
          {/* <WaveDivider color="text-white" /> */}
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <Badge className="mb-4 px-3 py-1 bg-white text-primary rounded-full">الخبراء</Badge>
              <h2 className="text-4xl font-semibold mb-4 text-primary">خبراؤنا المتخصصون</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto"></div>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                فريق من الخبراء المتخصصين في مختلف مجالات التربية والطفولة لتقديم الدعم والاستشارات
              </p>
            </div>

            <div className="flex flex-col gap-8 max-w-3xl mx-auto">
              {/* First Expert - Sama Al-Azzawi */}
              <motion.div
                className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true }}
                whileHover={{
                  boxShadow: "0 25px 50px -12px rgba(8, 42, 69, 0.25)",
                  y: -5,
                }}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Image container with special effects */}
                  <div className="relative w-full md:w-64 h-64 md:h-auto md:min-w-[16rem] overflow-hidden group">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 opacity-70 z-10"
                      whileHover={{ opacity: 0.4 }}
                      transition={{ duration: 0.3 }}
                    />
                    <motion.div
                      className="absolute inset-0 border-8 border-secondary/30 z-20 opacity-0 scale-90"
                      whileHover={{ opacity: 1, scale: 0.98 }}
                      transition={{ duration: 0.4 }}
                    />
                    <motion.img
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Copy-of-Untitled12-768x768-VLaV6PrIRYWgvGutdX5bFV7mz2ym8A.webp"
                      alt="سما العزاوي"
                      className="w-full h-full object-cover object-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>

                  {/* Content container */}
                  <div className="p-6 flex-1 flex flex-col justify-center text-center md:text-right">
                    <Badge className="mb-4 self-center md:self-start px-3 py-1 bg-secondary/20 text-primary rounded-full">
                      المدربة الرئيسية
                    </Badge>
                    <h3 className="text-2xl font-bold mb-2 text-primary">سما العزاوي</h3>
                    <p className="text-lg text-gray-600 mb-3">خبيرة في تربية الأطفال والتنمية الأسرية</p>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      مدربة متخصصة في مجال التربية والطفولة مع خبرة أكثر من 6 سنوات في تقديم الاستشارات والدورات
                      التدريبية للآباء والأمهات. حاصلة على شهادات متخصصة في التربية الإيجابية وعلم نفس الطفل.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Second Expert - Marwa Al-Asadi */}
              <motion.div
                className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                viewport={{ once: true }}
                whileHover={{
                  boxShadow: "0 25px 50px -12px rgba(8, 42, 69, 0.25)",
                  y: -5,
                }}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Image container with special effects */}
                  <div className="relative w-full md:w-64 h-64 md:h-auto md:min-w-[16rem] overflow-hidden group">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 opacity-70 z-10"
                      whileHover={{ opacity: 0.4 }}
                      transition={{ duration: 0.3 }}
                    />
                    <motion.div
                      className="absolute inset-0 border-8 border-secondary/30 z-20 opacity-0 scale-90"
                      whileHover={{ opacity: 1, scale: 0.98 }}
                      transition={{ duration: 0.4 }}
                    />
                    <motion.img
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-03-25%20at%206.21.14%20PM%281%29-quUCWamThUD31eYku2i6uixnVo6rvI.jpeg"
                      alt="مروة الأسدي"
                      className="w-full h-full object-cover object-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>

                  {/* Content container */}
                  <div className="p-6 flex-1 flex flex-col justify-center text-center md:text-right">
                    <Badge className="mb-4 self-center md:self-start px-3 py-1 bg-secondary/20 text-primary rounded-full">
                      مدربة توحد
                    </Badge>
                    <h3 className="text-2xl font-bold mb-2 text-primary">مروة الأسدي</h3>
                    <p className="text-lg text-gray-600 mb-3">خبيرة في مجال التوحد بخبرة 18 عامًا</p>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      بدأت رحلتي مع التوحد من منطلق الأمومة، حيث خضت تجربة شخصية مع طفلي، دفعتني للبحث والتعلم حتى حصلت
                      على شهادات معتمدة في هذا المجال. على مدار السنوات، ساعدت عددًا كبيرًا من الأهالي في السويد والعراق
                      وحول العالم على فهم التوحد، وتدريب أطفالهم، وتمكينهم من التطور والاندماج.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Third Expert - Coach Mariam */}
              <motion.div
                className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                viewport={{ once: true }}
                whileHover={{
                  boxShadow: "0 25px 50px -12px rgba(8, 42, 69, 0.25)",
                  y: -5,
                }}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Image container with special effects */}
                  <div className="relative w-full md:w-64 h-64 md:h-auto md:min-w-[16rem] overflow-hidden group flex justify-center md:justify-start">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 opacity-70 z-10"
                      whileHover={{ opacity: 0.4 }}
                      transition={{ duration: 0.3 }}
                    />
                    <motion.div
                      className="absolute inset-0 border-8 border-secondary/30 z-20 opacity-0 scale-90"
                      whileHover={{ opacity: 1, scale: 0.98 }}
                      transition={{ duration: 0.4 }}
                    />
                    <motion.img
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled%20design%2840%29-lmaz5ngOaWe27KI4vGiODtYGtsnFpt.png"
                      alt="كوتش مريم"
                      className="h-full object-top md:object-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>

                  {/* Content container */}
                  <div className="p-6 flex-1 flex flex-col justify-center text-center md:text-right">
                    <Badge className="mb-4 self-center md:self-start px-3 py-1 bg-secondary/20 text-primary rounded-full">
                      أخصائية تغذية
                    </Badge>
                    <h3 className="text-2xl font-bold mb-2 text-primary">كوتش مريم</h3>
                    <p className="text-lg text-gray-600 mb-3">متخصصة في تغذية الأطفال</p>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      أخصائية تغذية متخصصة في تغذية الأطفال، مع اهتمام خاص بالأطفال دون سن السنتين. على مدار مسيرتها،
                      ساعدت مئات الأمهات في بناء عادات غذائية صحية لأطفالهن، مما يدعم نموهم السليم ويعزز استقلاليتهم منذ
                      البداية.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Fourth Expert - Dr. Naem Al-Zubaidi */}
              <motion.div
                className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.6 }}
                viewport={{ once: true }}
                whileHover={{
                  boxShadow: "0 25px 50px -12px rgba(8, 42, 69, 0.25)",
                  y: -5,
                }}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Image container with special effects */}
                  <div className="relative w-full md:w-64 h-64 md:h-auto md:min-w-[16rem] overflow-hidden group flex justify-center md:justify-start">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 opacity-70 z-10"
                      whileHover={{ opacity: 0.4 }}
                      transition={{ duration: 0.3 }}
                    />
                    <motion.div
                      className="absolute inset-0 border-8 border-secondary/30 z-20 opacity-0 scale-90"
                      whileHover={{ opacity: 1, scale: 0.98 }}
                      transition={{ duration: 0.4 }}
                    />
                    <motion.img
                      src="/dr-naem-al-zubaidi.jpeg"
                      alt="د. نعم الزبيدي"
                      className="h-full object-cover object-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>

                  {/* Content container */}
                  <div className="p-6 flex-1 flex flex-col justify-center text-center md:text-right">
                    <Badge className="mb-4 self-center md:self-start px-3 py-1 bg-secondary/20 text-primary rounded-full">
                      مدربة معتمدة في الولادة والرضاعة
                    </Badge>
                    <h3 className="text-2xl font-bold mb-2 text-primary">د. نعم الزبيدي</h3>
                    <p className="text-lg text-gray-600 mb-3">
                      مدربة معتمدة في الولادة الطبيعية والرضاعة الطبيعية (CBE)
                    </p>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      تهدف إلى دعم وتمكين الأمهات العربيات من خلال تقديم محتوى علمي وطبي متخصص ومتكامل. تقدم استشارات
                      الحمل والولادة مثل استشارة ولادة طبيعية آمنة وإيجابية، واستشارات الرضاعة الطبيعية بما في ذلك
                      أساسيات الرضاعة خلال فترة الحمل، إعادة الإرضاع بعد انقطاع أو رفض الرضاعة، واستشارة الفطام
                      التدريجي.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
          {/* <WaveDivider className="bottom-0" flip={true} color="text-white" /> */}
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-white relative">
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bg-dots-darker.png_sQW9Y1tL3j9g5yvG17V8jJ39965666.png')",
              opacity: 0.2,
              zIndex: 0,
            }}
          />
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <Badge className="mb-4 px-3 py-1 bg-secondary/20 text-primary rounded-full">آراء الآباء والأمهات</Badge>
              <h2 className="text-4xl font-semibold mb-4 text-primary">ماذا قال الآباء والأمهات عن مجتمعنا؟</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto"></div>
            </div>

            <motion.div
              className="max-w-3xl mx-auto bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-8 md:p-12"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center mb-6">
                <Avatar className="w-16 h-16 border-2 border-secondary/30">
                  <AvatarImage
                    src={testimonials[activeTestimonialIndex].avatar || "/placeholder.svg"}
                    alt={testimonials[activeTestimonialIndex].name}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                    {testimonials[activeTestimonialIndex].name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="mr-4">
                  <h4 className="text-xl font-semibold text-primary">{testimonials[activeTestimonialIndex].name}</h4>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed text-lg">"{testimonials[activeTestimonialIndex].comment}"</p>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className="bg-primary text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg mb-4">جميع الحقوق محفوظة لمجتمع الدعم التربوي © {new Date().getFullYear()}</p>
          <div className="flex justify-center space-x-4 rtl:space-x-reverse">
            <Link href="#" className="hover:text-secondary transition-colors duration-300">
              شروط الاستخدام
            </Link>
            <Link href="#" className="hover:text-secondary transition-colors duration-300">
              سياسة الخصوصية
            </Link>
            <Link href="#" className="hover:text-secondary transition-colors duration-300">
              اتصل بنا
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

export function PricingSection() {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "semi-annual" | "yearly">("monthly")

  const monthlyFeatures = [
    "الوصول إلى جميع المناقشات والمواضيع",
    "المشاركة في المنتديات والمجموعات",
    "حضور ورش العمل والفعاليات",
    "الوصول إلى المحتوى الحصري",
  ]

  const semiAnnualFeatures = [
    "الوصول إلى جميع المناقشات والمواضيع",
    "المشاركة في المنتديات والمجموعات",
    "حضور ورش العمل والفعاليات",
    "الوصول إلى المحتوى الحصري",
  ]

  const yearlyFeatures = [
    "الوصول إلى جميع المناقشات والمواضيع",
    "المشاركة في المنتديات والمجموعات",
    "حضور ورش العمل والفعاليات",
    "الوصول إلى المحتوى الحصري",
    "استشارة تربوية مجانية",
    "موارد تربوية مجانية",
  ]

  return (
    <section id="pricing" className="py-20 relative overflow-hidden bg-gray-50">
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
          <Badge className="mb-4 px-3 py-1 bg-secondary/20 text-primary rounded-full">الاشتراكات</Badge>
          <h2 className="text-4xl font-semibold mb-4 text-primary">خطط الاشتراك</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            انضم إلى مجتمع الدعم التربوي واحصل على الدعم والمعرفة الذي تحتاجه في كل مرحلة من رحلة الأمومة
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <Tabs
            defaultValue="monthly"
            value={selectedPlan}
            onValueChange={(value) => setSelectedPlan(value as "monthly" | "semi-annual" | "yearly")}
            className="w-full max-w-lg"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="monthly">شهري</TabsTrigger>
              <TabsTrigger value="semi-annual">6 أشهر</TabsTrigger>
              <TabsTrigger value="yearly">سنوي</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <Card className={`h-full ${selectedPlan === "monthly" ? "border-primary" : ""}`}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>الاشتراك الشهري</span>
                  {selectedPlan === "monthly" && <Badge className="bg-primary text-primary-foreground">مختار</Badge>}
                </CardTitle>
                <CardDescription>اشتراك شهري مرن</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold">
                  $33 <span className="text-muted-foreground text-sm font-normal">/ شهرياً</span>
                </div>

                <ul className="space-y-2">
                  {monthlyFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="ml-2 h-4 w-4 text-green-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full transition-all duration-300 ease-in-out hover:shadow-lg transform hover:-translate-y-1"
                  asChild
                >
                  <Link href="/auth/login">اشترك الآن</Link>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Card className={`h-full ${selectedPlan === "semi-annual" ? "border-primary" : ""}`}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex justify-between items-center">
                    <span>اشتراك 6 أشهر</span>
                    {selectedPlan === "semi-annual" && <Badge className="bg-primary text-primary-foreground">مختار</Badge>}
                  </CardTitle>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    وفري 17%
                  </Badge>
                </div>
                <CardDescription>اشتراك نصف سنوي بسعر مخفض</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold">
                  $165 <span className="text-muted-foreground text-sm font-normal">/ 6 أشهر</span>
                </div>

                <ul className="space-y-2">
                  {semiAnnualFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="ml-2 h-4 w-4 text-green-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full transition-all duration-300 ease-in-out hover:shadow-lg transform hover:-translate-y-1"
                  asChild
                >
                  <Link href="/auth/login">اشترك الآن</Link>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <Card className={`h-full ${selectedPlan === "yearly" ? "border-primary" : ""}`}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex justify-between items-center">
                    <span>الاشتراك السنوي</span>
                    {selectedPlan === "yearly" && <Badge className="bg-primary text-primary-foreground">مختار</Badge>}
                  </CardTitle>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    وفري 37%
                  </Badge>
                </div>
                <CardDescription>اشتراك سنوي بسعر مخفض</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold">
                  $250 <span className="text-muted-foreground text-sm font-normal">/ سنوياً</span>
                </div>

                <ul className="space-y-2">
                  {yearlyFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="ml-2 h-4 w-4 text-green-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full transition-all duration-300 ease-in-out hover:shadow-lg transform hover:-translate-y-1"
                  asChild
                >
                  <Link href="/auth/login">اشترك الآن</Link>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

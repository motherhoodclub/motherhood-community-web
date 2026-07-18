"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, X } from "lucide-react"
import { PLANS, PRICING_HEADLINE, PRICING_INTRO } from "@/lib/plans"

export function PricingSection() {
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
          <h2 className="text-4xl font-semibold mb-4 text-primary">{PRICING_HEADLINE}</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">{PRICING_INTRO}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
              viewport={{ once: true }}
            >
              <Card
                className={`h-full flex flex-col relative ${
                  plan.highlighted ? "border-primary border-2 shadow-lg md:-translate-y-2" : ""
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 right-1/2 translate-x-1/2 z-10">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1 whitespace-nowrap shadow">
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                <CardHeader className="pt-8">
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription className="font-semibold text-primary/90 text-base">{plan.tagline}</CardDescription>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 flex-1">
                  <div className="text-3xl font-bold">
                    {plan.price} <span className="text-muted-foreground text-sm font-normal">{plan.period}</span>
                  </div>

                  {plan.featuresHeading && (
                    <p className="text-sm font-medium text-gray-700">{plan.featuresHeading}</p>
                  )}

                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        {feature.included ? (
                          <Check className="h-4 w-4 text-green-500 shrink-0 mt-1" />
                        ) : (
                          <X className="h-4 w-4 text-red-400 shrink-0 mt-1" />
                        )}
                        <span className={feature.included ? "" : "text-muted-foreground line-through"}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {plan.note && <p className="text-xs text-muted-foreground pt-2 border-t">{plan.note}</p>}
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full transition-all duration-300 ease-in-out hover:shadow-lg transform hover:-translate-y-1"
                    variant={plan.highlighted ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/auth/login">{plan.cta}</Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

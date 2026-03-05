"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

const MotionLink = motion(Link)

export function HeaderHome() {
  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 transition-all duration-300 ease-in-out hover:shadow-md">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        <MotionLink
          href="/"
          className="transition-transform duration-300 ease-in-out hover:scale-105"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/motherhood-logo-qunMHbphVKqXlODOdKhLneaTuWZME4.webp"
            alt="نادي الأمومة"
            className="h-[70px] md:h-[100px] w-auto object-contain"
          />
        </MotionLink>
        <nav className="hidden md:flex space-x-6 rtl:space-x-reverse">
          <MotionLink
            href="/#offerings"
            className="text-gray-600 hover:text-primary transition-colors duration-300 ease-in-out"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            ماذا نقدم
          </MotionLink>
          <MotionLink
            href="/#packages"
            className="text-gray-600 hover:text-primary transition-colors duration-300 ease-in-out"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            الباقات
          </MotionLink>
          <MotionLink
            href="/#pricing"
            className="text-gray-600 hover:text-primary transition-colors duration-300 ease-in-out"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            الأسعار
          </MotionLink>
          <MotionLink
            href="/#testimonials"
            className="text-gray-600 hover:text-primary transition-colors duration-300 ease-in-out"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            آراء الأمهات
          </MotionLink>
          <MotionLink
            href="/#faq"
            className="text-gray-600 hover:text-primary transition-colors duration-300 ease-in-out"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            أسئلة شائعة
          </MotionLink>
        </nav>
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <Button
            variant="outline"
            className="hidden md:inline-flex hover:bg-primary/5 transition-colors duration-300 ease-in-out border-primary text-primary"
            asChild
          >
            <Link href="https://community.motherhoodclub.net/auth/login">تسجيل الدخول</Link>
          </Button>
          <Button className="bg-primary hover:bg-primary/90 transition-colors duration-300 ease-in-out" asChild>
            <Link href="https://community.motherhoodclub.net/auth/register">انضمي الآن</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

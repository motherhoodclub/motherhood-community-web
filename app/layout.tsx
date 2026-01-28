import type React from "react"
import { Almarai } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { SubscriptionProvider } from "@/context/subscription-context"
// Import the HotjarInit component at the top of the file
import { HotjarInit } from "@/components/hotjar-init"

const almarai = Almarai({
  subsets: ["arabic"],
  weight: ["300", "400", "700", "800"],
  variable: "--font-almarai",
})

export const metadata = {
  title: "مجتمع الدعم التربوي",
  description: "منصة متكاملة لدعم الأمهات في رحلة الأمومة",
  generator: 'v0.dev',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={cn("min-h-screen bg-background font-sans antialiased", almarai.variable)}>
        <HotjarInit />
        <SubscriptionProvider>{children}</SubscriptionProvider>
      </body>
    </html>
  )
}

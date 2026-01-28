import type React from "react"
import type { Metadata } from "next"
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

export const metadata: Metadata = {
  title: {
    default: "مجتمع الدعم التربوي | Motherhood Club",
    template: "%s | مجتمع الدعم التربوي",
  },
  description: "انضم إلى مجتمع الدعم التربوي واحصل على استشارات متخصصة، ورش عمل تفاعلية، ومحتوى تعليمي لدعم رحلتك في التربية الإيجابية",
  keywords: [
    "تربية الأطفال",
    "الأمومة",
    "التربية الإيجابية",
    "استشارات تربوية",
    "دعم الوالدين",
    "ورش عمل تربوية",
    "الطفولة",
    "parenting",
    "motherhood",
    "child development",
  ],
  authors: [{ name: "Motherhood Club" }],
  creator: "Motherhood Club",
  publisher: "Motherhood Club",
  metadataBase: new URL("https://community.motherhoodclub.net"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ar_SA",
    url: "https://community.motherhoodclub.net",
    siteName: "مجتمع الدعم التربوي",
    title: "مجتمع الدعم التربوي | رحلة التربية أجمل مع الدعم والمعرفة",
    description: "انضم إلى آلاف الآباء والأمهات في مجتمعنا واحصل على استشارات متخصصة ودعم مستمر في رحلة التربية",
    images: [
      {
        url: "/favicon.png",
        width: 512,
        height: 512,
        alt: "مجتمع الدعم التربوي",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "مجتمع الدعم التربوي | Motherhood Club",
    description: "انضم إلى مجتمع الدعم التربوي واحصل على الدعم والمعرفة في رحلة الوالدية",
    images: ["/favicon.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  verification: {
    google: "your-google-verification-code",
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

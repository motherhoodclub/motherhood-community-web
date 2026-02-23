"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LayoutDashboard, Users, Calendar, Settings, CreditCard } from "lucide-react"

const sidebarNavItems = [
  {
    title: "لوحة التحكم",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "المستخدمون",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "الاشتراكات",
    href: "/admin/subscriptions",
    icon: CreditCard,
  },
  {
    title: "ورش العمل",
    href: "/admin/workshops",
    icon: Calendar,
  },
  {
    title: "الإعدادات",
    href: "/admin/settings",
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <nav className="w-64 bg-white border-l border-gray-200 dark:bg-gray-800 dark:border-gray-700" dir="rtl">
      <div className="flex flex-col h-full">
        <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">لوحة الإدارة</h2>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4">
            {sidebarNavItems.map((item) => (
              <Button
                key={item.href}
                asChild
                variant="ghost"
                className={cn("w-full justify-start mb-2", pathname === item.href && "bg-gray-100 dark:bg-gray-700")}
              >
                <Link href={item.href}>
                  <item.icon className="ml-2 h-4 w-4" />
                  {item.title}
                </Link>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </nav>
  )
}

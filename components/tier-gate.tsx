"use client"

import Link from "next/link"
import { Lock, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { minTierLabel } from "@/lib/entitlements"

/** Small "locked" badge showing the tier required for an item. */
export function TierBadge({ minTier, className }: { minTier: number | null | undefined; className?: string }) {
  const label = minTierLabel(minTier)
  if (!label) return null
  return (
    <Badge className={`bg-amber-500/90 text-white gap-1 ${className ?? ""}`}>
      <Lock className="h-3 w-3" />
      {label}
    </Badge>
  )
}

/**
 * Upgrade prompt shown in place of gated content when the current user's tier
 * is below the required `minTier`.
 */
export function UpgradeCard({
  minTier,
  title = "هذا المحتوى ضمن باقة أعلى",
  description,
}: {
  minTier: number | null | undefined
  title?: string
  description?: string
}) {
  const label = minTierLabel(minTier)
  return (
    <Card className="border-amber-200 bg-amber-50/60">
      <CardContent className="flex flex-col items-center text-center gap-3 py-8">
        <div className="rounded-full bg-amber-100 p-3">
          <Lock className="h-6 w-6 text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {description ?? `هذا المحتوى متاح لمشتركي ${label ?? "الباقات الأعلى"}. رقّي اشتراكك للوصول إليه.`}
        </p>
        <Button asChild className="mt-2">
          <Link href="/community/subscription">
            <Sparkles className="h-4 w-4 ml-2" />
            ترقية الاشتراك
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

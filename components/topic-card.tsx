"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Eye, Heart, MessageCircle, TrendingUp, ImageIcon } from "lucide-react"

interface TopicCardProps {
  topic: {
    id: string
    title: string
    excerpt?: string
    created_at: string
    category?: string
    views: number
    likes: number
    comments_count: number
    featured_image_url?: string
    is_sticky?: boolean
    is_featured?: boolean
    author_name?: string
    author_avatar?: string
  }
}

export default function TopicCard({ topic }: TopicCardProps) {
  const [imageError, setImageError] = useState(false)

  const handleImageError = () => {
    setImageError(true)
  }

  const imageUrl = topic.featured_image_url
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${topic.featured_image_url}`
    : "/placeholder.svg?height=144&width=144"

  return (
    <Card className="group hover:shadow-md transition-shadow duration-300">
      <CardContent className="pt-6 pb-3 px-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          {/* Image container - On the left */}
          <div className="relative w-full sm:w-36 h-32 shrink-0 rounded-xl overflow-hidden shadow-md border border-muted/50 group-hover:border-primary/30 transition-colors">
            {imageError ? (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <ImageIcon className="w-12 h-12 text-muted-foreground" />
              </div>
            ) : (
              <Image
                src={imageUrl || "/placeholder.svg"}
                alt={topic.title}
                width={144}
                height={144}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={handleImageError}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>

          {/* Content container */}
          <div className="flex-1 min-w-0 flex flex-col justify-between text-right">
            <div className="space-y-3">
              {/* Sticky and Featured badges on top */}
              <div className="flex flex-wrap gap-2 mb-2 justify-end">
                {topic.is_sticky && (
                  <Badge
                    variant="outline"
                    className="text-xs px-3 py-1 rounded-full border-amber-500/40 text-amber-600 bg-amber-500/10 font-medium"
                  >
                    <TrendingUp className="h-3 w-3 ml-1" />
                    مثبت
                  </Badge>
                )}
                {topic.is_featured && (
                  <Badge className="text-xs px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 border-emerald-500/30 font-medium">
                    مميز
                  </Badge>
                )}
              </div>

              {/* Title with better styling */}
              <div className="text-right">
                <Link
                  href={`/community/topic/${topic.id}`}
                  className="inline-block text-xl font-bold hover:text-primary transition-colors line-clamp-2 group-hover:text-primary"
                >
                  {topic.title}
                </Link>
              </div>

              {/* Category under the title */}
              {topic.category && (
                <div className="text-right">
                  <Badge
                    variant="secondary"
                    className="text-xs px-3 py-1 rounded-full font-medium bg-primary/10 text-primary border-none"
                  >
                    {topic.category}
                  </Badge>
                </div>
              )}

              {/* Topic excerpt/preview with better formatting */}
              {topic.excerpt && (
                <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed text-right">{topic.excerpt}</p>
              )}
            </div>

            {/* Author and stats */}
            <div className="flex flex-wrap items-center justify-between gap-y-3 text-sm text-muted-foreground pt-4 border-t border-muted/30 mt-3">
              <div className="flex items-center gap-2">
                <Avatar className="w-7 h-7 ring-2 ring-primary/10">
                  <AvatarImage src={topic.author_avatar} alt={topic.author_name || "مستخدم"} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                    {(topic.author_name || "م").charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{topic.author_name || "مستخدم"}</span>
                <span className="text-muted-foreground/50">•</span>
                <span title={new Date(topic.created_at).toLocaleString("ar-SA-u-ca-gregory")}>
                  {new Date(topic.created_at).toLocaleDateString("ar-SA-u-ca-gregory")}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className="flex items-center gap-1.5 bg-muted/20 dark:bg-muted/30 px-2 py-1 rounded-full"
                  title="عدد المشاهدات"
                >
                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  {topic.views || 0}
                </span>
                <span
                  className="flex items-center gap-1.5 bg-muted/20 dark:bg-muted/30 px-2 py-1 rounded-full"
                  title="عدد الإعجابات"
                >
                  <Heart className="w-3.5 h-3.5 text-muted-foreground" />
                  {topic.likes || 0}
                </span>
                <span
                  className="flex items-center gap-1.5 bg-muted/20 dark:bg-muted/30 px-2 py-1 rounded-full"
                  title="عدد التعليقات"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
                  {topic.comments_count || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

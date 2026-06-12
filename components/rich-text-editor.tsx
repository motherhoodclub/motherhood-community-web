"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import TextStyle from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import TextAlign from "@tiptap/extension-text-align"
import Youtube from "@tiptap/extension-youtube"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Unlink,
  ImagePlus,
  Film,
  Youtube as YoutubeIcon,
  AlignRight,
  AlignCenter,
  AlignLeft,
  AlignJustify,
  Undo,
  Redo,
  Loader2,
  Minus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { FontSize } from "./rich-text-editor/font-size"
import { Video } from "./rich-text-editor/video-node"

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
}

const FONT_SIZES = [
  { label: "صغير جداً", value: "12px" },
  { label: "صغير", value: "14px" },
  { label: "عادي", value: "16px" },
  { label: "متوسط", value: "20px" },
  { label: "كبير", value: "24px" },
  { label: "كبير جداً", value: "32px" },
]

const COLORS = ["#000000", "#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#2563eb", "#7c3aed", "#db2777", "#6b7280"]

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40",
        active && "bg-primary/10 text-primary",
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span className="mx-1 h-6 w-px self-center bg-border" />
}

function Toolbar({ editor }: { editor: Editor }) {
  const supabase = createClientComponentClient()
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const uploadToStorage = useCallback(
    async (file: File) => {
      const path = `topic-content/${Date.now()}-${file.name.replace(/\s+/g, "-")}`
      const { data, error } = await supabase.storage.from("uploads").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      })
      if (error) throw error
      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(data.path)
      return urlData.publicUrl
    },
    [supabase],
  )

  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const url = await uploadToStorage(file)
        editor.chain().focus().setImage({ src: url, alt: file.name }).run()
      }
    } catch (err) {
      console.error("Error uploading image:", err)
      alert("فشل في رفع الصورة")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const handleVideoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadToStorage(file)
      editor.chain().focus().setVideo({ src: url }).run()
    } catch (err) {
      console.error("Error uploading video:", err)
      alert("فشل في رفع الفيديو")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const setLink = useCallback(() => {
    const previous = editor.getAttributes("link").href
    const url = window.prompt("أدخل الرابط (URL):", previous || "https://")
    if (url === null) return
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run()
  }, [editor])

  const addYoutube = useCallback(() => {
    const url = window.prompt("أدخل رابط فيديو يوتيوب:")
    if (url) editor.commands.setYoutubeVideo({ src: url, width: 640, height: 360 })
  }, [editor])

  const headingValue = editor.isActive("heading", { level: 1 })
    ? "h1"
    : editor.isActive("heading", { level: 2 })
      ? "h2"
      : editor.isActive("heading", { level: 3 })
        ? "h3"
        : "p"

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-t-md border border-b-0 bg-muted/30 p-1.5">
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="تراجع">
        <Undo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="إعادة">
        <Redo className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      {/* Block type */}
      <select
        value={headingValue}
        onChange={(e) => {
          const v = e.target.value
          if (v === "p") editor.chain().focus().setParagraph().run()
          else editor.chain().focus().toggleHeading({ level: Number(v[1]) as 1 | 2 | 3 }).run()
        }}
        className="h-8 rounded-md border bg-background px-1 text-sm"
        title="نوع النص"
      >
        <option value="p">نص عادي</option>
        <option value="h1">عنوان 1</option>
        <option value="h2">عنوان 2</option>
        <option value="h3">عنوان 3</option>
      </select>

      {/* Font size */}
      <select
        onChange={(e) => {
          const v = e.target.value
          if (v) editor.chain().focus().setFontSize(v).run()
          else editor.chain().focus().unsetFontSize().run()
        }}
        value={editor.getAttributes("textStyle").fontSize || ""}
        className="h-8 rounded-md border bg-background px-1 text-sm"
        title="حجم الخط"
      >
        <option value="">الحجم</option>
        {FONT_SIZES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <Divider />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="عريض">
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="مائل">
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="تحته خط">
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="يتوسطه خط">
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>

      {/* Text color */}
      <label className="relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md hover:bg-muted" title="لون النص">
        <span className="text-sm font-bold" style={{ color: editor.getAttributes("textStyle").color || "currentColor" }}>
          A
        </span>
        <input
          type="color"
          value={editor.getAttributes("textStyle").color || "#000000"}
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      <div className="hidden items-center gap-0.5 sm:flex">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            title={c}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().setColor(c).run()}
            className="h-4 w-4 rounded-full border"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <Divider />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="قائمة نقطية">
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="قائمة مرقمة">
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="اقتباس">
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="كود">
        <Code className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="خط فاصل">
        <Minus className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="محاذاة لليمين">
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="توسيط">
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="محاذاة لليسار">
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })} title="ضبط">
        <AlignJustify className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton onClick={setLink} active={editor.isActive("link")} title="إضافة رابط">
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().unsetLink().run()} disabled={!editor.isActive("link")} title="إزالة الرابط">
        <Unlink className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => imageInputRef.current?.click()} disabled={uploading} title="إدراج صورة">
        <ImagePlus className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => videoInputRef.current?.click()} disabled={uploading} title="إدراج فيديو">
        <Film className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={addYoutube} title="إدراج فيديو يوتيوب">
        <YoutubeIcon className="h-4 w-4" />
      </ToolbarButton>

      {uploading && (
        <span className="ml-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> جاري الرفع...
        </span>
      )}

      <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelected} />
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoSelected} />
    </div>
  )
}

export default function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      FontSize,
      Image.configure({ HTMLAttributes: { class: "rounded-lg max-w-full my-3" } }),
      Video,
      Youtube.configure({ controls: true, nocookie: true, HTMLAttributes: { class: "rounded-lg my-3 max-w-full" } }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        dir: "rtl",
        class: "rich-content min-h-[240px] w-full px-4 py-3 focus:outline-none",
        ...(placeholder ? { "data-placeholder": placeholder } : {}),
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  // Sync external value (e.g. when an edit form loads data after mount)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor])

  if (!editor) {
    return <div className={cn("min-h-[300px] rounded-md border bg-muted/20", className)} />
  }

  return (
    <div className={cn("rounded-md border bg-background", className)}>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} className="max-h-[600px] overflow-y-auto" />
    </div>
  )
}

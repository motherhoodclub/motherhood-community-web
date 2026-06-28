"use client"

import { useState } from "react"
import { PlusCircle, MinusCircle, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

const MAX_OPTIONS = 6

export function CreatePollDialog({
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (question: string, options: string[]) => Promise<void> | void
  submitting?: boolean
}) {
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState<string[]>(["", ""])

  const reset = () => {
    setQuestion("")
    setOptions(["", ""])
  }

  const validCount = options.filter((o) => o.trim()).length
  const canSubmit = question.trim().length > 0 && validCount >= 2 && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    await onSubmit(question.trim(), options.map((o) => o.trim()).filter(Boolean))
    reset()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            إنشاء استطلاع
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>سؤال الاستطلاع</Label>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="اكتب سؤال الاستطلاع…"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>الخيارات</Label>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={opt}
                  onChange={(e) =>
                    setOptions((prev) => prev.map((o, idx) => (idx === i ? e.target.value : o)))
                  }
                  placeholder={`الخيار ${i + 1}`}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setOptions((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-red-500 hover:text-red-600"
                  >
                    <MinusCircle className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
            {options.length < MAX_OPTIONS && (
              <button
                type="button"
                onClick={() => setOptions((prev) => [...prev, ""])}
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <PlusCircle className="h-4 w-4" />
                إضافة خيار
              </button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full">
            {submitting ? "جارٍ النشر…" : "نشر الاستطلاع"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

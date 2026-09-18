"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/ui/icons"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowRight } from "lucide-react"

/**
 * WhatsApp OTP sign-in / sign-up.
 *
 * Supabase sends the code through Twilio's WhatsApp channel
 * (signInWithOtp with channel: "whatsapp"), using the approved
 * authentication template configured in the Supabase dashboard.
 *
 * One flow covers both login and registration: signInWithOtp creates the
 * user when they don't exist yet (shouldCreateUser defaults to true), and a
 * database trigger fills in their user_profiles row with a username derived
 * from the phone number (verified: a phone-only signup yields e.g.
 * username "user_56992989").
 */

/** Dial codes, Egypt first since that's the primary market. */
const COUNTRY_CODES = [
  { code: "+20", label: "مصر +20" },
  { code: "+966", label: "السعودية +966" },
  { code: "+971", label: "الإمارات +971" },
  { code: "+965", label: "الكويت +965" },
  { code: "+974", label: "قطر +974" },
  { code: "+973", label: "البحرين +973" },
  { code: "+968", label: "عُمان +968" },
  { code: "+962", label: "الأردن +962" },
  { code: "+964", label: "العراق +964" },
  { code: "+961", label: "لبنان +961" },
  { code: "+970", label: "فلسطين +970" },
  { code: "+963", label: "سوريا +963" },
  { code: "+967", label: "اليمن +967" },
  { code: "+249", label: "السودان +249" },
  { code: "+218", label: "ليبيا +218" },
  { code: "+216", label: "تونس +216" },
  { code: "+213", label: "الجزائر +213" },
  { code: "+212", label: "المغرب +212" },
  { code: "+1", label: "أمريكا/كندا +1" },
  { code: "+44", label: "بريطانيا +44" },
]

const OTP_LENGTH = 6
/** Supabase rate-limits OTP requests; don't let users hammer the button. */
const RESEND_COOLDOWN_SECONDS = 60

/**
 * Build an E.164 number from a dial code + locally-typed number.
 * Strips spaces/dashes and the local trunk "0" (Egyptians type 010…, which
 * must be sent as +2010…, not +20010…).
 */
function toE164(dialCode: string, localNumber: string): string {
  const digits = localNumber.replace(/\D/g, "").replace(/^0+/, "")
  return `${dialCode}${digits}`
}

function isValidPhone(e164: string): boolean {
  // E.164: "+" then 8–15 digits. Deliberately loose — the real check is
  // whether WhatsApp can deliver, which only the send attempt can tell us.
  return /^\+\d{8,15}$/.test(e164)
}

/** Map Supabase/Twilio errors onto something a member can act on. */
function arabicError(message: string): string {
  const m = message.toLowerCase()

  if (m.includes("invalid") && m.includes("token")) {
    return "الرمز غير صحيح. تأكدي من الرقم وحاولي مرة أخرى."
  }
  if (m.includes("expired")) {
    return "انتهت صلاحية الرمز. اطلبي رمزًا جديدًا."
  }
  if (m.includes("security purposes") || m.includes("rate limit") || m.includes("too many")) {
    return "لقد طلبتِ رموزًا كثيرة. انتظري قليلًا ثم حاولي مرة أخرى."
  }
  if (m.includes("invalid phone") || m.includes("phone")) {
    return "رقم الهاتف غير صحيح. تأكدي من الرقم ومن رمز الدولة."
  }
  if (m.includes("signups not allowed") || m.includes("disabled")) {
    return "التسجيل عبر واتساب غير مفعّل حاليًا."
  }
  return "تعذّر إرسال الرمز عبر واتساب. حاولي مرة أخرى."
}

interface WhatsAppLoginProps {
  /** Where to go after a successful verification. */
  redirectTo?: string
}

export function WhatsAppLogin({ redirectTo = "/community" }: WhatsAppLoginProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const [step, setStep] = useState<"phone" | "code">("phone")
  const [dialCode, setDialCode] = useState("+20")
  const [localNumber, setLocalNumber] = useState("")
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  const codeInputRef = useRef<HTMLInputElement>(null)
  /** The exact string sent to Supabase — verifyOtp must receive the same one. */
  const phoneRef = useRef<string>("")

  // Resend cooldown ticker.
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  // Focus the code box as soon as we switch steps.
  useEffect(() => {
    if (step === "code") codeInputRef.current?.focus()
  }, [step])

  async function sendCode(isResend = false) {
    const phone = toE164(dialCode, localNumber)

    if (!isValidPhone(phone)) {
      setError("رقم الهاتف غير صحيح. تأكدي من الرقم ومن رمز الدولة.")
      return
    }

    setIsLoading(true)
    setError(null)

    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone,
      options: { channel: "whatsapp" },
    })

    setIsLoading(false)

    if (otpError) {
      setError(arabicError(otpError.message))
      return
    }

    phoneRef.current = phone
    setStep("code")
    setCooldown(RESEND_COOLDOWN_SECONDS)
    toast({
      title: isResend ? "تم إرسال رمز جديد" : "تم إرسال الرمز",
      description: `أرسلنا رمز التحقق عبر واتساب إلى ${phone}`,
    })
  }

  async function verifyCode() {
    if (code.length !== OTP_LENGTH) {
      setError(`الرمز يجب أن يكون ${OTP_LENGTH} أرقام.`)
      return
    }

    setIsLoading(true)
    setError(null)

    // type stays "sms" for phone OTP even when delivered over WhatsApp —
    // the channel only controls delivery, not the verification type.
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone: phoneRef.current,
      token: code,
      type: "sms",
    })

    if (verifyError) {
      setIsLoading(false)
      setError(arabicError(verifyError.message))
      return
    }

    if (data.session) {
      localStorage.setItem("last_auth_method", "whatsapp")
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحبًا بك في نادي الأمومة",
      })
      router.push(redirectTo)
      router.refresh()
    } else {
      setIsLoading(false)
      setError("تعذّر إتمام تسجيل الدخول. حاولي مرة أخرى.")
    }
  }

  function backToPhone() {
    setStep("phone")
    setCode("")
    setError(null)
  }

  return (
    <div className="space-y-4 pt-2">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {step === "phone" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            sendCode()
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="wa-phone" className="text-right block">
              رقم الواتساب
            </Label>
            <div className="flex gap-2" dir="ltr">
              <Select value={dialCode} onValueChange={setDialCode}>
                <SelectTrigger className="w-[130px] shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_CODES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="wa-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="1012345678"
                required
                dir="ltr"
                className="flex-1"
                value={localNumber}
                onChange={(e) => setLocalNumber(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">
              سنرسل رمز تحقق عبر واتساب إلى هذا الرقم
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || !localNumber.trim()}>
            {isLoading && <Icons.spinner className="ml-2 h-4 w-4 animate-spin" />}
            إرسال الرمز
          </Button>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            verifyCode()
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="wa-code" className="text-right block">
              رمز التحقق
            </Label>
            <Input
              id="wa-code"
              ref={codeInputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={OTP_LENGTH}
              placeholder="------"
              required
              dir="ltr"
              className="text-center text-2xl tracking-[0.5em] font-mono"
              value={code}
              onChange={(e) => {
                const next = e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH)
                setCode(next)
                setError(null)
              }}
            />
            <p className="text-xs text-muted-foreground text-right">
              أرسلنا الرمز إلى <span dir="ltr">{phoneRef.current}</span>
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || code.length !== OTP_LENGTH}
          >
            {isLoading && <Icons.spinner className="ml-2 h-4 w-4 animate-spin" />}
            تأكيد الرمز
          </Button>

          <div className="flex items-center justify-between text-sm">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={backToPhone}
              disabled={isLoading}
              className="text-muted-foreground"
            >
              <ArrowRight className="ml-1 h-4 w-4" />
              تغيير الرقم
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => sendCode(true)}
              disabled={isLoading || cooldown > 0}
              className="text-muted-foreground"
            >
              {cooldown > 0 ? `إعادة الإرسال بعد ${cooldown}s` : "إعادة إرسال الرمز"}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

export default WhatsAppLogin

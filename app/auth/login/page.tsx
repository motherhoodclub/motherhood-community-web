"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/ui/icons"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const [phone, setPhone] = useState<string>("")
  const [otp, setOtp] = useState<string>("")
  const [showOtpInput, setShowOtpInput] = useState<boolean>(false)
  const [isPhoneLoading, setIsPhoneLoading] = useState<boolean>(false)

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        router.push("/community")
      }
    }
    checkUser()
  }, [supabase, router])

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setIsLoading(false)
      if (error.message === "Email not confirmed") {
        setError("يرجى تأكيد بريدك الإلكتروني قبل تسجيل الدخول.")
      } else {
        setError("خطأ في تسجيل الدخول. يرجى التحقق من بريدك الإلكتروني وكلمة المرور.")
      }
    } else if (data.user) {
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحبًا بك في نادي الأمومة",
      })
      router.push("/community")
      router.refresh()
    }
  }

  async function handlePhoneSignInSendOtp(event: React.SyntheticEvent) {
    event.preventDefault()
    setIsPhoneLoading(true)
    setError(null)
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: phone,
      options: {
        channel: "whatsapp", // Specify WhatsApp channel
      },
    })
    setIsPhoneLoading(false)
    if (otpError) {
      setError(`خطأ في إرسال الرمز عبر واتساب: ${otpError.message}`)
      toast({
        variant: "destructive",
        title: "خطأ في إرسال الرمز",
        description: otpError.message,
      })
    } else {
      setShowOtpInput(true)
      toast({
        title: "تم إرسال الرمز عبر واتساب",
        description: "يرجى التحقق من واتساب وإدخال الرمز.",
      })
    }
  }

  async function handlePhoneSignInVerifyOtp(event: React.SyntheticEvent) {
    event.preventDefault()
    setIsPhoneLoading(true)
    setError(null)
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone: phone,
      token: otp,
      type: "sms", // Type remains 'sms' for phone OTP verification
    })
    setIsPhoneLoading(false)
    if (verifyError) {
      setError(`خطأ في التحقق من الرمز: ${verifyError.message}`)
      toast({
        variant: "destructive",
        title: "خطأ في التحقق",
        description: verifyError.message,
      })
    } else if (data.session) {
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحبًا بك في نادي الأمومة",
      })
      router.push("/community")
      router.refresh()
    } else {
      setError("لم يتمكن من التحقق من الرمز. حاول مرة أخرى أو اطلب رمزًا جديدًا.")
      toast({
        variant: "destructive",
        title: "فشل التحقق",
        description: "لم يتمكن من التحقق من الرمز. حاول مرة أخرى أو اطلب رمزًا جديدًا.",
      })
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">تسجيل الدخول</CardTitle>
        <CardDescription>أدخلي بياناتك للدخول إلى حسابك</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>خطأ</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-right block">
              البريد الإلكتروني
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              required
              className="text-right"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPhoneLoading || showOtpInput}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-right block">
              كلمة المرور
            </Label>
            <Input
              id="password"
              type="password"
              required
              className="text-right"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPhoneLoading || showOtpInput}
            />
          </div>
          <Button className="w-full" disabled={isLoading || isPhoneLoading || showOtpInput}>
            {isLoading && <Icons.spinner className="ml-2 h-4 w-4 animate-spin" />}
            تسجيل الدخول بالبريد
          </Button>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">أو</span>
            </div>
          </div>
          <Button
            variant="outline"
            type="button"
            className="w-full"
            onClick={async () => {
              setIsLoading(true)
              setError(null)
              const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                  redirectTo: `${window.location.origin}/auth/callback`,
                },
              })
              if (error) {
                setIsLoading(false)
                setError("حدث خطأ أثناء تسجيل الدخول باستخدام Google")
                toast({ variant: "destructive", title: "خطأ Google", description: error.message })
              }
            }}
            disabled={isLoading || isPhoneLoading || showOtpInput}
          >
            {isLoading && !isPhoneLoading ? (
              <Icons.spinner className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.google className="ml-2 h-4 w-4" />
            )}
            تسجيل الدخول باستخدام Google
          </Button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">أو</span>
          </div>
        </div>

        {!showOtpInput ? (
          <form onSubmit={handlePhoneSignInSendOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone-login" className="text-right block">
                رقم الهاتف (مع رمز الدولة)
              </Label>
              <Input
                id="phone-login"
                type="tel"
                placeholder="+201000000000"
                required
                className="text-left"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                dir="ltr"
                disabled={isLoading || isPhoneLoading}
              />
            </div>
            <Button className="w-full" type="submit" disabled={isLoading || isPhoneLoading}>
              {isPhoneLoading && <Icons.spinner className="ml-2 h-4 w-4 animate-spin" />}
              تسجيل الدخول عبر واتساب
            </Button>
          </form>
        ) : (
          <form onSubmit={handlePhoneSignInVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp-login" className="text-right block">
                الرمز المُرسل إلى واتساب
              </Label>
              <Input
                id="otp-login"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                required
                className="text-center"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                dir="ltr"
                disabled={isLoading || isPhoneLoading}
              />
            </div>
            <Button className="w-full" type="submit" disabled={isLoading || isPhoneLoading}>
              {isPhoneLoading && <Icons.spinner className="ml-2 h-4 w-4 animate-spin" />}
              تحقق وتسجيل الدخول
            </Button>
            <Button
              variant="link"
              type="button"
              onClick={() => {
                setShowOtpInput(false)
                setError(null)
                setOtp("")
              }}
              className="w-full"
              disabled={isPhoneLoading}
            >
              تغيير رقم الهاتف أو استخدام طريقة أخرى
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-center gap-4">
        <Link href="/auth/reset-password" className="text-sm text-muted-foreground hover:underline">
          نسيت كلمة المرور؟
        </Link>
        <div className="text-sm text-muted-foreground">
          ليس لديك حساب؟{" "}
          <Link href="/auth/register" className="text-primary hover:underline">
            إنشاء حساب
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}

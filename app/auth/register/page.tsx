"use client"

import type React from "react"

import { useState } from "react"
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

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [name, setName] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [isRegistered, setIsRegistered] = useState<boolean>(false) // For email registration flow
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const [phone, setPhone] = useState<string>("")
  const [otp, setOtp] = useState<string>("")
  const [showOtpInput, setShowOtpInput] = useState<boolean>(false)
  const [isPhoneLoading, setIsPhoneLoading] = useState<boolean>(false)

  async function handleEmailSubmit(event: React.SyntheticEvent) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setIsLoading(false)
    if (signUpError) {
      if (signUpError.message.includes("User already registered")) {
        setError("البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول أو استخدام بريد إلكتروني آخر.")
      } else {
        setError(signUpError.message)
      }
      toast({ variant: "destructive", title: "خطأ في التسجيل", description: signUpError.message })
    } else if (data.user) {
      setIsRegistered(true) // Show email confirmation message
      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "يرجى التحقق من بريدك الإلكتروني لتأكيد حسابك",
      })
    }
  }

  async function handlePhoneSignUpSendOtp(event: React.SyntheticEvent) {
    event.preventDefault()
    setIsPhoneLoading(true)
    setError(null)
    // For sign-up, Supabase creates the user if they don't exist when signInWithOtp is called.
    // Name can be collected via a profile update step later if needed for phone-only signups.
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: phone,
      options: {
        channel: "whatsapp", // Specify WhatsApp channel
        // data: { name: name } // You can pass user metadata here if needed during signup
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
        description: "يرجى التحقق من واتساب وإدخال الرمز لإنشاء الحساب.",
      })
    }
  }

  async function handlePhoneSignUpVerifyOtp(event: React.SyntheticEvent) {
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
      // User is now signed up and signed in.
      toast({
        title: "تم إنشاء الحساب وتسجيل الدخول بنجاح",
        description: "مرحبًا بك في نادي الأمومة!",
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

  if (isRegistered) {
    // This state is for email registration confirmation
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">تم إنشاء الحساب</CardTitle>
          <CardDescription>يرجى التحقق من بريدك الإلكتروني لتأكيد حسابك</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTitle>تم إرسال رابط التأكيد</AlertTitle>
            <AlertDescription>
              لقد أرسلنا رابط تأكيد إلى بريدك الإلكتروني. يرجى النقر على الرابط لتفعيل حسابك.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link href="/auth/login">العودة إلى صفحة تسجيل الدخول</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">إنشاء حساب</CardTitle>
        <CardDescription>أدخلي بياناتك لإنشاء حساب جديد</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>خطأ</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-right block">
              الاسم
            </Label>
            <Input
              id="name"
              type="text"
              required
              className="text-right"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPhoneLoading || showOtpInput}
            />
          </div>
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
          <Button className="w-full" type="submit" disabled={isLoading || isPhoneLoading || showOtpInput}>
            {isLoading && <Icons.spinner className="ml-2 h-4 w-4 animate-spin" />}
            إنشاء حساب بالبريد
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
                setError("حدث خطأ أثناء التسجيل باستخدام Google")
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
            التسجيل باستخدام Google
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
          <form onSubmit={handlePhoneSignUpSendOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone-register" className="text-right block">
                رقم الهاتف (مع رمز الدولة)
              </Label>
              <Input
                id="phone-register"
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
              التسجيل عبر واتساب
            </Button>
          </form>
        ) : (
          <form onSubmit={handlePhoneSignUpVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp-register" className="text-right block">
                الرمز المُرسل إلى واتساب
              </Label>
              <Input
                id="otp-register"
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
              تحقق وإنشاء الحساب
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
      <CardFooter className="text-center">
        <div className="text-sm text-muted-foreground">
          لديك حساب بالفعل؟{" "}
          <Link href="/auth/login" className="text-primary hover:underline">
            تسجيل الدخول
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}

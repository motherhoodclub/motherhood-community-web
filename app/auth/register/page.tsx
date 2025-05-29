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
  const [isRegistered, setIsRegistered] = useState<boolean>(false)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const [phone, setPhone] = useState<string>("")
  const [otp, setOtp] = useState<string>("")
  const [showOtpInput, setShowOtpInput] = useState<boolean>(false)
  const [isPhoneLoading, setIsPhoneLoading] = useState<boolean>(false)

  async function handlePhoneSignUpSendOtp(event: React.SyntheticEvent) {
    event.preventDefault()
    setIsPhoneLoading(true)
    setError(null) // Clear previous errors

    // signInWithOtp will create a user if they don't exist.
    // Name is not collected in this simplified flow for phone, can be added in profile later.
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: phone,
    })
    setIsPhoneLoading(false)
    if (otpError) {
      setError(`خطأ في إرسال الرمز: ${otpError.message}`)
    } else {
      setShowOtpInput(true)
      toast({
        title: "تم إرسال الرمز",
        description: "يرجى التحقق من هاتفك وإدخال الرمز لإنشاء الحساب.",
      })
    }
  }

  async function handlePhoneSignUpVerifyOtp(event: React.SyntheticEvent) {
    event.preventDefault()
    setIsPhoneLoading(true)
    setError(null) // Clear previous errors
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone: phone,
      token: otp,
      type: "sms",
    })
    setIsPhoneLoading(false)
    if (verifyError) {
      setError(`خطأ في التحقق من الرمز: ${verifyError.message}`)
    } else if (data.session) {
      // User is now signed up and signed in.
      // The `isRegistered` state and its UI are for email confirmation.
      // For phone OTP, successful verification means they are in.
      toast({
        title: "تم إنشاء الحساب وتسجيل الدخول بنجاح",
        description: "مرحبًا بك في نادي الأمومة!",
      })
      router.push("/community")
      router.refresh()
    } else {
      setError("لم يتمكن من التحقق من الرمز. حاول مرة أخرى أو اطلب رمزًا جديدًا.")
    }
  }

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setIsLoading(false)
      if (error.message.includes("User already registered")) {
        setError("البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول أو استخدام بريد إلكتروني آخر.")
      } else {
        setError(error.message)
      }
    } else if (data.user) {
      setIsRegistered(true)
      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "يرجى التحقق من بريدك الإلكتروني لتأكيد حسابك",
      })
    }

    setIsLoading(false)
  }

  if (isRegistered) {
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
        <form onSubmit={onSubmit} className="space-y-4">
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
            />
          </div>
          <Button className="w-full" disabled={isLoading || isPhoneLoading}>
            {isLoading && <Icons.spinner className="ml-2 h-4 w-4 animate-spin" />}
            إنشاء الحساب
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
              const { data, error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                  redirectTo: `${window.location.origin}/auth/callback`,
                },
              })
              if (error) {
                setIsLoading(false)
                setError("حدث خطأ أثناء التسجيل باستخدام Google")
              }
            }}
            disabled={isLoading || isPhoneLoading}
          >
            {isLoading ? (
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
                placeholder="+1234567890"
                required
                className="text-left"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                dir="ltr"
                disabled={isLoading || isPhoneLoading}
              />
            </div>
            <Button className="w-full" disabled={isLoading || isPhoneLoading}>
              {isPhoneLoading && <Icons.spinner className="ml-2 h-4 w-4 animate-spin" />}
              التسجيل باستخدام الهاتف
            </Button>
          </form>
        ) : (
          <form onSubmit={handlePhoneSignUpVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp-register" className="text-right block">
                الرمز المُرسل إلى هاتفك
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
            <Button className="w-full" disabled={isLoading || isPhoneLoading}>
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

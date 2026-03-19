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
import { ChevronDown, ChevronUp, Mail } from "lucide-react"

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [name, setName] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [isRegistered, setIsRegistered] = useState<boolean>(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [lastUsedMethod, setLastUsedMethod] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    const saved = localStorage.getItem("last_auth_method")
    if (saved) {
      setLastUsedMethod(saved)
      if (saved === "email") setShowEmailForm(true)
    }
  }, [])

  async function handleOAuth(provider: "google" | "apple") {
    localStorage.setItem("last_auth_method", provider)
    setLoadingProvider(provider)
    setIsLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setIsLoading(false)
      setLoadingProvider(null)
      const providerName = provider === "google" ? "Google" : "Apple"
      setError(`حدث خطأ أثناء التسجيل باستخدام ${providerName}`)
      toast({ variant: "destructive", title: `خطأ ${providerName}`, description: error.message })
    }
  }

  async function handleEmailSubmit(event: React.SyntheticEvent) {
    event.preventDefault()
    localStorage.setItem("last_auth_method", "email")
    setIsLoading(true)
    setLoadingProvider("email")
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
    setLoadingProvider(null)
    if (signUpError) {
      if (signUpError.message.includes("User already registered")) {
        setError("البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول أو استخدام بريد إلكتروني آخر.")
      } else {
        setError(signUpError.message)
      }
      toast({ variant: "destructive", title: "خطأ في التسجيل", description: signUpError.message })
    } else if (data.user) {
      setIsRegistered(true)
      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "يرجى التحقق من بريدك الإلكتروني لتأكيد حسابك",
      })
    }
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
        <CardDescription>اختاري طريقة إنشاء حسابك</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <Alert variant="destructive" className="mb-2">
            <AlertTitle>خطأ</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Google Button - Primary */}
        <div className="relative">
          <Button
            className="w-full h-12 text-base"
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={isLoading}
          >
            {loadingProvider === "google" ? (
              <Icons.spinner className="ml-2 h-6 w-6 animate-spin" />
            ) : (
              <Icons.google className="ml-2 h-6 w-6" />
            )}
            التسجيل باستخدام Google
          </Button>
          {lastUsedMethod === "google" && (
            <span className="absolute -top-2 left-2 bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full border border-primary/20">
              آخر استخدام
            </span>
          )}
        </div>

        {/* Apple Button */}
        <div className="relative">
          <Button
            variant="outline"
            className="w-full h-12 text-base bg-black text-white hover:bg-gray-900 hover:text-white border-black"
            type="button"
            onClick={() => handleOAuth("apple")}
            disabled={isLoading}
          >
            {loadingProvider === "apple" ? (
              <Icons.spinner className="ml-2 h-6 w-6 animate-spin" />
            ) : (
              <Icons.apple className="ml-2 h-6 w-6" />
            )}
            التسجيل باستخدام Apple
          </Button>
          {lastUsedMethod === "apple" && (
            <span className="absolute -top-2 left-2 bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full border border-primary/20">
              آخر استخدام
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">أو</span>
          </div>
        </div>

        {/* Expandable Email Section */}
        <div className="relative">
          <Button
            variant="ghost"
            type="button"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={() => setShowEmailForm(!showEmailForm)}
            disabled={isLoading && loadingProvider !== "email"}
          >
            <Mail className="ml-2 h-4 w-4" />
            التسجيل بالبريد الإلكتروني
            {showEmailForm ? (
              <ChevronUp className="mr-2 h-4 w-4" />
            ) : (
              <ChevronDown className="mr-2 h-4 w-4" />
            )}
          </Button>
          {lastUsedMethod === "email" && (
            <span className="absolute -top-2 left-2 bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full border border-primary/20">
              آخر استخدام
            </span>
          )}
        </div>

        {showEmailForm && (
          <form onSubmit={handleEmailSubmit} className="space-y-4 pt-2">
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
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {loadingProvider === "email" && <Icons.spinner className="ml-2 h-4 w-4 animate-spin" />}
              إنشاء حساب
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
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

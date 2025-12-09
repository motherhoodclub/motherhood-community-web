"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { User, Mail, Calendar, Shield, Search, UserCheck, UserX, RefreshCw, AlertCircle, Info, ChevronRight, ChevronLeft, CreditCard } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const USERS_PER_PAGE_OPTIONS = [10, 25, 50, 100]

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [error, setError] = useState(null)
  const [debugInfo, setDebugInfo] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [usersPerPage, setUsersPerPage] = useState(10)
  const [filterType, setFilterType] = useState<"all" | "admin" | "user">("all")
  const { toast } = useToast()
  const searchTimeout = useRef(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/users")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch users")
      }

      const data = await response.json()
      setDebugInfo(data.debug || null)

      if (!data.users || !Array.isArray(data.users)) {
        throw new Error("Invalid data format received from server")
      }

      console.log("Received users data:", data.users.length)
      setUsers(data.users || [])
    } catch (err) {
      console.error("Exception fetching users:", err)
      setError(err.message || "حدث خطأ أثناء جلب بيانات المستخدمين")
      toast({
        title: "خطأ",
        description: err.message || "حدث خطأ أثناء جلب بيانات المستخدمين",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter and search users
  const filteredUsers = useMemo(() => {
    let result = users

    // Apply role filter
    if (filterType === "admin") {
      result = result.filter((user) => user.is_admin)
    } else if (filterType === "user") {
      result = result.filter((user) => !user.is_admin)
    }

    // Apply search filter
    if (searchTerm && searchTerm.trim() !== "") {
      const search = searchTerm.toLowerCase().trim()
      result = result.filter(
        (user) =>
          (user.username && user.username.toLowerCase().includes(search)) ||
          (user.email && user.email.toLowerCase().includes(search)) ||
          (user.full_name && user.full_name.toLowerCase().includes(search)) ||
          (user.id && user.id.toLowerCase().includes(search))
      )
    }

    return result
  }, [users, searchTerm, filterType])

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
  const startIndex = (currentPage - 1) * usersPerPage
  const endIndex = startIndex + usersPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  // Reset to page 1 when search/filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterType, usersPerPage])

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const toggleAdminStatus = async (userId: string, isAdmin: boolean) => {
    setIsUpdating(userId)
    try {
      const response = await fetch("/api/admin/update-user-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          isAdmin: !isAdmin,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "فشل تحديث صلاحيات المستخدم")
      }

      toast({
        title: "تم بنجاح",
        description: !isAdmin ? "تم ترقية المستخدم إلى مشرف" : "تم إلغاء صلاحيات المشرف",
      })

      // Update user in the local state
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user.id === userId ? { ...user, is_admin: !isAdmin } : user))
      )
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل تحديث صلاحيات المستخدم",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(null)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "غير متوفر"
    try {
      return new Date(dateString).toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (e) {
      return "تاريخ غير صالح"
    }
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return "غير متوفر"
    try {
      return new Date(dateString).toLocaleString("ar-SA", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (e) {
      return "تاريخ غير صالح"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-2xl font-bold">إدارة المستخدمين</CardTitle>
            <CardDescription>عرض وإدارة جميع المستخدمين في النظام</CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={() => fetchUsers()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="البحث بالاسم أو البريد الإلكتروني أو المعرف..."
                value={searchTerm}
                onChange={handleSearch}
                className="flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterType} onValueChange={(value: "all" | "admin" | "user") => setFilterType(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="تصفية حسب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="admin">المشرفين</SelectItem>
                  <SelectItem value="user">المستخدمين</SelectItem>
                </SelectContent>
              </Select>
              <Select value={usersPerPage.toString()} onValueChange={(value) => setUsersPerPage(Number(value))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USERS_PER_PAGE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option.toString()}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>خطأ في جلب البيانات</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {debugInfo && (
            <Alert className="mb-4 bg-blue-50 border-blue-200">
              <Info className="h-4 w-4" />
              <AlertTitle>معلومات التشخيص</AlertTitle>
              <AlertDescription>
                <div className="text-xs text-muted-foreground mt-1">
                  عدد الملفات الشخصية: {debugInfo.profilesCount || "غير متوفر"} | عدد مستخدمي المصادقة:{" "}
                  {debugInfo.authUsersCount || "غير متوفر"} | عدد المستخدمين المدمجين:{" "}
                  {debugInfo.combinedCount || "غير متوفر"} | مفتاح الخدمة متوفر:{" "}
                  {debugInfo.serviceRoleAvailable ? "نعم" : "لا"}
                </div>
                {debugInfo.authError && (
                  <div className="text-xs text-red-500 mt-1">خطأ المصادقة: {debugInfo.authError}</div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right whitespace-nowrap font-bold">المعلومات الشخصية</TableHead>
                  <TableHead className="text-right whitespace-nowrap font-bold">البريد الإلكتروني</TableHead>
                  <TableHead className="text-right whitespace-nowrap font-bold">تاريخ الانضمام</TableHead>
                  <TableHead className="text-right whitespace-nowrap font-bold">آخر دخول</TableHead>
                  <TableHead className="text-right whitespace-nowrap font-bold">الصلاحيات</TableHead>
                  <TableHead className="text-right whitespace-nowrap font-bold">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <RefreshCw className="h-8 w-8 animate-spin text-primary mb-2" />
                        <span>جاري تحميل بيانات المستخدمين...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <UserX className="h-8 w-8 text-muted-foreground mb-2" />
                        <span>لا يوجد مستخدمين مطابقين للبحث</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="text-right">
                        <div className="flex flex-col">
                          <div className="font-medium flex items-center gap-1">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {user.full_name || user.username || "غير متوفر"}
                          </div>
                          {user.username && (
                            <div className="text-sm text-muted-foreground">@{user.username}</div>
                          )}
                          <div className="text-xs text-muted-foreground font-mono mt-1">
                            {user.id.substring(0, 8)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {user.email ? (
                            <span dir="ltr" className="text-primary text-sm">
                              {user.email}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">لا يوجد</span>
                          )}
                        </div>
                        {user.phone && (
                          <div className="text-sm text-muted-foreground mt-1" dir="ltr">
                            {user.phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{formatDate(user.created_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm text-muted-foreground">
                          {formatDateTime(user.last_sign_in_at)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            {user.is_admin ? (
                              <Badge className="bg-purple-500 hover:bg-purple-600">مشرف</Badge>
                            ) : (
                              <Badge variant="outline">مستخدم</Badge>
                            )}
                          </div>
                          {user.subscription_status && (
                            <div className="flex items-center gap-1">
                              <CreditCard className="h-3 w-3 text-muted-foreground" />
                              <Badge
                                variant="secondary"
                                className={user.subscription_status === "active" ? "bg-green-100 text-green-800" : ""}
                              >
                                {user.subscription_status === "active" ? "مشترك" : "غير مشترك"}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                          disabled={isUpdating === user.id}
                          className="w-full"
                        >
                          {isUpdating === user.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : user.is_admin ? (
                            <>
                              <UserX className="h-4 w-4 ml-1" />
                              إلغاء الإشراف
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 ml-1" />
                              جعله مشرفًا
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
            <div className="text-sm text-muted-foreground">
              عرض {filteredUsers.length > 0 ? startIndex + 1 : 0} - {Math.min(endIndex, filteredUsers.length)} من {filteredUsers.length} مستخدم
              {searchTerm && ` (تصفية من ${users.length})`}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronRight className="h-4 w-4 ml-1" />
                السابق
              </Button>

              <div className="flex items-center gap-1 px-2">
                <span className="text-sm">صفحة</span>
                <span className="font-medium">{currentPage}</span>
                <span className="text-sm">من</span>
                <span className="font-medium">{totalPages || 1}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage >= totalPages || isLoading}
              >
                التالي
                <ChevronLeft className="h-4 w-4 mr-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

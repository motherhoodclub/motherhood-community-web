// app/api/notifications/subscription/route.ts

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

import { sendEmail } from "@/lib/email"
import { userWantsNotification } from "@/lib/supabase"

export const dynamic = "force-dynamic"

// Initialize Supabase client with service role key
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Store processed notification IDs to prevent duplicates
const processedNotifications = new Set<string>()

export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    const { userId, userEmail, username, planType, endDate, isRecurring, notificationId } = await request.json()

    // Check if we've already processed this notification
    if (notificationId) {
      // If this notification ID has already been processed, return success without sending again
      if (processedNotifications.has(notificationId)) {
        console.log(`Skipping duplicate notification: ${notificationId}`)
        return NextResponse.json({ success: true, skipped: true }, { status: 200 })
      }

      // Add to processed set
      processedNotifications.add(notificationId)

      // Limit the size of the set to prevent memory leaks
      if (processedNotifications.size > 1000) {
        const iterator = processedNotifications.values()
        processedNotifications.delete(iterator.next().value)
      }
    }

    // Add a small delay to avoid rate limiting issues
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Check if the user wants subscription notifications
    const wantsNotification = await userWantsNotification(supabase, userId, "email_subscription")

    if (wantsNotification) {
      // Fetch subscription details based on whether it's recurring or one-time
      const tableName = isRecurring ? "user_subscriptions" : "user_payments"
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from(tableName)
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (subscriptionError) {
        console.error("Error fetching subscription details:", subscriptionError)
      }

      // Format subscription details for email
      const subscriptionDetails = subscriptionData
        ? {
            plan: planType,
            startDate: new Date(subscriptionData.created_at).toLocaleDateString("ar-SA-u-ca-gregory"),
            endDate: endDate || new Date(subscriptionData.end_date).toLocaleDateString("ar-SA-u-ca-gregory"),
            amount: subscriptionData.amount || "غير متوفر",
            status: subscriptionData.status || "نشط",
            isRecurring: isRecurring ? "اشتراك متجدد" : "دفعة لمرة واحدة",
          }
        : {
            plan: planType,
            endDate: endDate,
            isRecurring: isRecurring ? "اشتراك متجدد" : "دفعة لمرة واحدة",
          }

      // Send confirmation email to the user
      const userEmailResult = await sendEmail({
        from: "منصة الأمومة <notifications@updates.motherhoodclub.net>",
        to: userEmail,
        subject: `تأكيد الاشتراك: ${planType}`,
        html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>تأكيد الاشتراك</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-top: 20px; margin-bottom: 20px;">
            <!-- Header with Logo -->
            <div style="background-color: #f8f2f7; padding: 20px; text-align: center; border-bottom: 1px solid #eaeaea;">
              <img src="cid:motherhood-logo" alt="منصة الأمومة" style="max-width: 180px; height: auto;">
            </div>
            
            <!-- Email Content -->
            <div style="padding: 30px; text-align: right;">
              <h2 style="color: #9c27b0; margin-bottom: 20px; font-size: 24px;">مرحباً ${username}،</h2>
              <p style="margin-bottom: 20px; line-height: 1.6; font-size: 16px;">نشكرك على اشتراكك في منصة الأمومة!</p>
              
              <div style="background-color: #f8f2f7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <h3 style="color: #9c27b0; margin-top: 0; margin-bottom: 15px; font-size: 18px;">تفاصيل اشتراكك:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea;"><strong style="color: #555;">نوع الخطة:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea;">${subscriptionDetails.plan}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea;"><strong style="color: #555;">نوع الاشتراك:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea;">${subscriptionDetails.isRecurring}</td>
                  </tr>
                  ${
                    subscriptionDetails.startDate
                      ? `
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea;"><strong style="color: #555;">تاريخ البدء:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea;">${subscriptionDetails.startDate}</td>
                  </tr>`
                      : ""
                  }
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea;"><strong style="color: #555;">تاريخ الانتهاء:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea;">${subscriptionDetails.endDate}</td>
                  </tr>
                  ${
                    subscriptionDetails.amount
                      ? `
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea;"><strong style="color: #555;">المبلغ:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea;">${subscriptionDetails.amount}</td>
                  </tr>`
                      : ""
                  }
                  ${
                    subscriptionDetails.status
                      ? `
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea;"><strong style="color: #555;">الحالة:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea;">${subscriptionDetails.status}</td>
                  </tr>`
                      : ""
                  }
                </table>
              </div>
              
              <p style="margin-bottom: 25px; line-height: 1.6; font-size: 16px;">يمكنك الآن الاستمتاع بجميع مزايا العضوية المميزة.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${requestUrl.origin}/community/subscription" style="background-color: #9c27b0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">إدارة اشتراكك</a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f8f2f7; padding: 20px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #eaeaea;">
              <p>شكراً لك،<br>فريق منصة الأمومة</p>
              <div style="margin-top: 15px; font-size: 12px; color: #888;">
                <p>© 2025 منصة الأمومة. جميع الحقوق محفوظة.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
        attachments: [
          {
            filename: "motherhood-logo.jpg",
            path: `${requestUrl.origin}/images/motherhood-logo.jpg`,
            cid: "motherhood-logo",
          },
        ],
      })

      if (userEmailResult?.error) {
        console.error("Failed to send user email", userEmailResult.error)
      }
    }

    // Always send notification to admins regardless of user preferences
    const adminEmailResult = await sendEmail({
      from: "منصة الأمومة <notifications@updates.motherhoodclub.net>",
      to: "samamalazzawi@gmail.com",
      subject: `اشتراك جديد: ${username} - ${planType}`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>اشتراك جديد</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-top: 20px; margin-bottom: 20px;">
            <!-- Header with Logo -->
            <div style="background-color: #f8f2f7; padding: 20px; text-align: center; border-bottom: 1px solid #eaeaea;">
              <img src="cid:motherhood-logo" alt="منصة الأمومة" style="max-width: 180px; height: auto;">
            </div>
            
            <!-- Email Content -->
            <div style="padding: 30px; text-align: right;">
              <h2 style="color: #9c27b0; margin-bottom: 20px; font-size: 24px;">اشتراك جديد!</h2>
              
              <div style="background-color: #f8f2f7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea;"><strong style="color: #555;">المستخدم:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea;">${username}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea;"><strong style="color: #555;">نوع الخطة:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea;">${planType}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea;"><strong style="color: #555;">نوع الاشتراك:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea;">${isRecurring ? "اشتراك متجدد" : "دفعة لمرة واحدة"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea;"><strong style="color: #555;">تاريخ الانتهاء:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea;">${endDate}</td>
                  </tr>
                </table>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${requestUrl.origin}/admin/subscriptions" style="background-color: #9c27b0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">عرض تفاصيل الاشتراكات</a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f8f2f7; padding: 20px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #eaeaea;">
              <p>فريق منصة الأمومة</p>
              <div style="margin-top: 15px; font-size: 12px; color: #888;">
                <p>© 2025 منصة الأمومة. جميع الحقوق محفوظة.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: "motherhood-logo.jpg",
          path: `${requestUrl.origin}/images/motherhood-logo.jpg`,
          cid: "motherhood-logo",
        },
      ],
    })

    if (adminEmailResult?.error) {
      console.error("Failed to send admin email", adminEmailResult.error)
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Error sending subscription notification:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

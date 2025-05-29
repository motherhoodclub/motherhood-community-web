import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to check if user wants a specific notification
async function userWantsNotification(supabase: any, userId: string, preferenceField: string) {
  const { data, error } = await supabase
    .from("user_notification_settings")
    .select(preferenceField)
    .eq("user_id", userId)
    .single()

  if (error || !data) {
    // Default to true if no settings found
    return true
  }

  return data[preferenceField]
}

export { userWantsNotification }

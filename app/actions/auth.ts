'use server'

import { createClient } from '@/lib/supabase/server'

export async function checkUserExists(email: string): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.admin.listUsers()
  if (error) return false
  return data.users.some((u) => u.email?.toLowerCase() === email.toLowerCase())
}

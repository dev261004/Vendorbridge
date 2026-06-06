'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  ActivityCenterData,
  ActivityLogRecord,
  NotificationRecord,
} from '@/lib/activity'

interface ActivityProfile {
  organization_id: string | null
  role: string | null
}

interface AuthenticatedActivityProfile extends ActivityProfile {
  organization_id: string
}

async function getAuthenticatedProfile() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Unauthorized')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .maybeSingle<ActivityProfile>()

  if (profileError) {
    throw profileError
  }

  if (!profile?.organization_id) {
    throw new Error('Your account is not linked to an organization.')
  }

  return {
    supabase,
    user,
    profile: profile as AuthenticatedActivityProfile,
  }
}

export async function getActivityCenter(): Promise<ActivityCenterData> {
  const { supabase, user, profile } = await getAuthenticatedProfile()

  const [activityResult, notificationResult] = await Promise.all([
    supabase
      .from('activity_logs')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })
      .limit(100)
      .returns<ActivityLogRecord[]>(),
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .returns<NotificationRecord[]>(),
  ])

  if (activityResult.error) {
    throw activityResult.error
  }

  if (notificationResult.error) {
    throw notificationResult.error
  }

  return {
    role: profile.role,
    activityLogs: activityResult.data || [],
    notifications: notificationResult.data || [],
  }
}

export async function markNotificationRead(notificationId: string) {
  const { supabase, user } = await getAuthenticatedProfile()

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) {
    throw error
  }

  revalidatePath('/dashboard/activity')
}

export async function markAllNotificationsRead() {
  const { supabase, user } = await getAuthenticatedProfile()

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null)

  if (error) {
    throw error
  }

  revalidatePath('/dashboard/activity')
}

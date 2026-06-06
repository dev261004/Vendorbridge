'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  CreateVendorResult,
  VendorFormValues,
  VendorInviteResult,
  VendorRecord,
  VendorStatus,
  VendorStatusFilter,
} from '@/lib/vendors'

type VendorManagerRole = 'admin'

interface VendorProfile {
  organization_id: string | null
  role: string | null
  vendor_id: string | null
}

interface AuthenticatedVendorProfile extends VendorProfile {
  organization_id: string
}

interface GetVendorsOptions {
  query?: string
  status?: VendorStatusFilter
}

function canManageVendors(role: string | null): role is VendorManagerRole {
  return role === 'admin'
}

function canViewOrganizationVendors(role: string | null) {
  return ['admin', 'procurement_officer', 'manager'].includes(role || '')
}

function normalizeText(value?: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function normalizeEmail(value?: string | null) {
  return normalizeText(value)?.toLowerCase() || null
}

function normalizeVendorPayload(values: VendorFormValues) {
  return {
    name: values.name.trim(),
    category: values.category.trim(),
    gst_number: normalizeText(values.gst_number)?.toUpperCase() || null,
    contact_person: normalizeText(values.contact_person),
    email: normalizeEmail(values.email),
    phone: normalizeText(values.phone),
    address: normalizeText(values.address),
    city: normalizeText(values.city),
    state: normalizeText(values.state),
    country: normalizeText(values.country) || 'India',
    rating: Number(values.rating || 0),
    status: values.status,
  }
}

function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.SITE_URL

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '')
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`
  }

  return 'http://localhost:3000'
}

function splitContactName(contactPerson: string | null) {
  if (!contactPerson) {
    return { firstName: null, lastName: null }
  }

  const [firstName, ...rest] = contactPerson.trim().split(/\s+/)

  return {
    firstName: firstName || null,
    lastName: rest.join(' ') || null,
  }
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
    .select('organization_id, role, vendor_id')
    .eq('id', user.id)
    .maybeSingle<VendorProfile>()

  if (profileError) {
    throw profileError
  }

  if (!profile?.organization_id) {
    throw new Error('Your account is not linked to an organization.')
  }

  return {
    supabase,
    user,
    profile: profile as AuthenticatedVendorProfile,
  }
}

export async function getVendorAccess() {
  const { profile } = await getAuthenticatedProfile()

  return {
    role: profile.role,
    canManage: canManageVendors(profile.role),
  }
}

async function logVendorActivity(params: {
  organizationId: string
  actorId: string
  vendorId: string
  action: string
  message: string
  metadata?: Record<string, unknown>
}) {
  const supabase = await createClient()
  await supabase.from('activity_logs').insert({
    organization_id: params.organizationId,
    actor_id: params.actorId,
    entity_type: 'vendor',
    entity_id: params.vendorId,
    action: params.action,
    message: params.message,
    metadata: params.metadata || {},
  })
}

async function sendVendorInvite(params: {
  vendor: VendorRecord
  organizationId: string
}): Promise<VendorInviteResult> {
  const email = normalizeEmail(params.vendor.email)

  if (!email) {
    return {
      sent: false,
      email: '',
      message: 'Vendor was saved, but no invite was sent because email is missing.',
    }
  }

  try {
    const admin = createAdminClient()
    const { firstName, lastName } = splitContactName(params.vendor.contact_person)
    const redirectTo = `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(
      '/auth/reset-password'
    )}`

    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {
        role: 'vendor',
        vendor_id: params.vendor.id,
        organization_id: params.organizationId,
        first_name: firstName,
        last_name: lastName,
        phone: params.vendor.phone,
        country: params.vendor.country,
      },
    })

    if (error) {
      throw error
    }

    if (data.user?.id) {
      await admin.from('profiles').upsert(
        {
          id: data.user.id,
          organization_id: params.organizationId,
          role: 'vendor',
          vendor_id: params.vendor.id,
          first_name: firstName,
          last_name: lastName,
          phone: params.vendor.phone,
          country: params.vendor.country,
        },
        { onConflict: 'id' }
      )
    }

    return {
      sent: true,
      email,
      message: `Vendor invite sent to ${email}.`,
    }
  } catch (error) {
    return {
      sent: false,
      email,
      message:
        error instanceof Error
          ? `Vendor was saved, but invite email was not sent: ${error.message}`
          : 'Vendor was saved, but invite email was not sent.',
    }
  }
}

export async function getVendors(options: GetVendorsOptions = {}) {
  const { supabase, profile } = await getAuthenticatedProfile()
  const status = options.status || 'all'
  const query = options.query?.trim()

  let request = supabase
    .from('vendors')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  if (!canViewOrganizationVendors(profile.role)) {
    if (!profile.vendor_id) {
      return []
    }
    request = request.eq('id', profile.vendor_id)
  }

  if (status !== 'all') {
    request = request.eq('status', status)
  }

  if (query) {
    const search = query.replace(/[%_,]/g, '').slice(0, 80)
    request = request.or(
      `name.ilike.%${search}%,gst_number.ilike.%${search}%,category.ilike.%${search}%,contact_person.ilike.%${search}%`
    )
  }

  const { data, error } = await request.returns<VendorRecord[]>()

  if (error) {
    throw error
  }

  return data || []
}

export async function getVendorById(id: string) {
  const { supabase, profile } = await getAuthenticatedProfile()

  let request = supabase
    .from('vendors')
    .select('*')
    .eq('id', id)
    .eq('organization_id', profile.organization_id)

  if (!canViewOrganizationVendors(profile.role)) {
    request = request.eq('id', profile.vendor_id)
  }

  const { data, error } = await request.maybeSingle<VendorRecord>()

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error('Vendor not found')
  }

  return data
}

export async function createVendor(
  values: VendorFormValues
): Promise<CreateVendorResult> {
  const { supabase, user, profile } = await getAuthenticatedProfile()

  if (!canManageVendors(profile.role)) {
    throw new Error('You do not have permission to create vendors.')
  }

  const payload = normalizeVendorPayload(values)

  if (!payload.email) {
    throw new Error('Vendor email is required so the invite can be sent.')
  }

  const { data, error } = await supabase
    .from('vendors')
    .insert({
      ...payload,
      organization_id: profile.organization_id,
      created_by: user.id,
    })
    .select('*')
    .single<VendorRecord>()

  if (error) {
    throw error
  }

  await logVendorActivity({
    organizationId: profile.organization_id,
    actorId: user.id,
    vendorId: data.id,
    action: 'vendor.created',
    message: `${data.name} was added as a ${data.status} vendor.`,
    metadata: { status: data.status, category: data.category },
  })

  const invite = await sendVendorInvite({
    vendor: data,
    organizationId: profile.organization_id,
  })

  await logVendorActivity({
    organizationId: profile.organization_id,
    actorId: user.id,
    vendorId: data.id,
    action: invite.sent ? 'vendor.invite_sent' : 'vendor.invite_failed',
    message: invite.message,
    metadata: { email: invite.email, sent: invite.sent },
  })

  revalidatePath('/dashboard/vendors')
  return { vendor: data, invite }
}

export async function updateVendor(id: string, values: VendorFormValues) {
  const { supabase, user, profile } = await getAuthenticatedProfile()

  if (!canManageVendors(profile.role)) {
    throw new Error('You do not have permission to update vendors.')
  }

  const payload = normalizeVendorPayload(values)
  const { data, error } = await supabase
    .from('vendors')
    .update(payload)
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .select('*')
    .single<VendorRecord>()

  if (error) {
    throw error
  }

  await logVendorActivity({
    organizationId: profile.organization_id,
    actorId: user.id,
    vendorId: data.id,
    action: 'vendor.updated',
    message: `${data.name} vendor details were updated.`,
    metadata: { status: data.status, category: data.category },
  })

  revalidatePath('/dashboard/vendors')
  return data
}

export async function updateVendorStatus(id: string, status: VendorStatus) {
  const { supabase, user, profile } = await getAuthenticatedProfile()

  if (!canManageVendors(profile.role)) {
    throw new Error('You do not have permission to update vendor status.')
  }

  const { data, error } = await supabase
    .from('vendors')
    .update({ status })
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .select('*')
    .single<VendorRecord>()

  if (error) {
    throw error
  }

  await logVendorActivity({
    organizationId: profile.organization_id,
    actorId: user.id,
    vendorId: data.id,
    action: 'vendor.status_changed',
    message: `${data.name} status changed to ${status}.`,
    metadata: { status },
  })

  revalidatePath('/dashboard/vendors')
  return data
}

export async function deactivateVendor(id: string) {
  return updateVendorStatus(id, 'inactive')
}

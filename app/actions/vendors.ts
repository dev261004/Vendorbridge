'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  VendorFormValues,
  VendorRecord,
  VendorStatus,
  VendorStatusFilter,
} from '@/lib/vendors'

type VendorManagerRole = 'admin' | 'procurement_officer'

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
  return role === 'admin' || role === 'procurement_officer'
}

function normalizeText(value?: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function normalizeVendorPayload(values: VendorFormValues) {
  return {
    name: values.name.trim(),
    category: values.category.trim(),
    gst_number: normalizeText(values.gst_number)?.toUpperCase() || null,
    contact_person: normalizeText(values.contact_person),
    email: normalizeText(values.email)?.toLowerCase() || null,
    phone: normalizeText(values.phone),
    address: normalizeText(values.address),
    city: normalizeText(values.city),
    state: normalizeText(values.state),
    country: normalizeText(values.country) || 'India',
    rating: Number(values.rating || 0),
    status: values.status,
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

export async function getVendors(options: GetVendorsOptions = {}) {
  const { supabase, profile } = await getAuthenticatedProfile()
  const status = options.status || 'all'
  const query = options.query?.trim()

  let request = supabase
    .from('vendors')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  if (!canManageVendors(profile.role)) {
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

  if (!canManageVendors(profile.role)) {
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

export async function createVendor(values: VendorFormValues) {
  const { supabase, user, profile } = await getAuthenticatedProfile()

  if (!canManageVendors(profile.role)) {
    throw new Error('You do not have permission to create vendors.')
  }

  const payload = normalizeVendorPayload(values)
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

  revalidatePath('/dashboard/vendors')
  return data
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

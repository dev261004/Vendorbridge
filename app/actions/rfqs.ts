'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  RFQAttachmentRecord,
  RFQFormValues,
  RFQRecord,
  RFQStatus,
  RFQStatusFilter,
  RFQWithDetails,
} from '@/lib/rfqs'

type RFQManagerRole = 'procurement_officer'

interface RFQProfile {
  organization_id: string | null
  role: string | null
  vendor_id: string | null
}

interface AuthenticatedRFQProfile extends RFQProfile {
  organization_id: string
}

interface GetRFQsOptions {
  query?: string
  status?: RFQStatusFilter
}

interface AttachmentInput {
  file_name: string
  storage_path: string
  mime_type?: string | null
  file_size?: number | null
}

function canManageRFQs(role: string | null): role is RFQManagerRole {
  return role === 'procurement_officer'
}

function canViewOrganizationRFQs(role: string | null) {
  return ['admin', 'procurement_officer', 'manager'].includes(role || '')
}

function normalizeText(value?: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : null
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
    .maybeSingle<RFQProfile>()

  if (profileError) {
    throw profileError
  }

  if (!profile?.organization_id) {
    throw new Error('Your account is not linked to an organization.')
  }

  return {
    supabase,
    user,
    profile: profile as AuthenticatedRFQProfile,
  }
}

export async function getRFQAccess() {
  const { profile } = await getAuthenticatedProfile()

  return {
    role: profile.role,
    canManage: canManageRFQs(profile.role),
  }
}

function generateRFQNumber() {
  const year = new Date().getFullYear()
  const random = Math.floor(100000 + Math.random() * 900000)
  return `RFQ-${year}-${random}`
}

async function logRFQActivity(params: {
  organizationId: string
  actorId: string
  rfqId: string
  action: string
  message: string
  metadata?: Record<string, unknown>
}) {
  const supabase = await createClient()
  await supabase.from('activity_logs').insert({
    organization_id: params.organizationId,
    actor_id: params.actorId,
    entity_type: 'rfq',
    entity_id: params.rfqId,
    action: params.action,
    message: params.message,
    metadata: params.metadata || {},
  })
}

async function replaceRFQItems(
  rfqId: string,
  items: RFQFormValues['items']
) {
  const supabase = await createClient()

  await supabase.from('rfq_items').delete().eq('rfq_id', rfqId)

  if (items.length === 0) {
    return
  }

  const { error } = await supabase.from('rfq_items').insert(
    items.map((item, index) => ({
      rfq_id: rfqId,
      item_name: item.item_name.trim(),
      description: normalizeText(item.description),
      quantity: Number(item.quantity),
      unit: item.unit.trim() || 'pcs',
      estimated_unit_price:
        Number(item.estimated_unit_price || 0) > 0
          ? Number(item.estimated_unit_price)
          : null,
      specifications: normalizeText(item.specifications),
      sort_order: index,
    }))
  )

  if (error) {
    throw error
  }
}

async function replaceRFQInvitations(params: {
  rfqId: string
  organizationId: string
  vendorIds: string[]
}) {
  const supabase = await createClient()

  await supabase.from('rfq_vendor_invitations').delete().eq('rfq_id', params.rfqId)

  const uniqueVendorIds = Array.from(new Set(params.vendorIds)).filter(Boolean)

  if (uniqueVendorIds.length === 0) {
    return
  }

  const { error } = await supabase.from('rfq_vendor_invitations').insert(
    uniqueVendorIds.map((vendorId) => ({
      organization_id: params.organizationId,
      rfq_id: params.rfqId,
      vendor_id: vendorId,
      status: 'invited',
    }))
  )

  if (error) {
    throw error
  }
}

export async function getRFQs(options: GetRFQsOptions = {}) {
  const { supabase, profile } = await getAuthenticatedProfile()
  const status = options.status || 'all'
  const query = options.query?.trim()

  let request = supabase
    .from('rfqs')
    .select(
      `
        *,
        rfq_items(id),
        rfq_vendor_invitations(id, vendor_id),
        rfq_attachments(id)
      `
    )
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  if (!canViewOrganizationRFQs(profile.role)) {
    if (!profile.vendor_id) {
      return []
    }

    request = request.eq('rfq_vendor_invitations.vendor_id', profile.vendor_id)
  }

  if (status !== 'all') {
    request = request.eq('status', status)
  }

  if (query) {
    const search = query.replace(/[%_,]/g, '').slice(0, 80)
    request = request.or(
      `title.ilike.%${search}%,category.ilike.%${search}%,rfq_number.ilike.%${search}%`
    )
  }

  const { data, error } = await request.returns<RFQWithDetails[]>()

  if (error) {
    throw error
  }

  return data || []
}

export async function getRFQById(id: string) {
  const { supabase, profile } = await getAuthenticatedProfile()

  let request = supabase
    .from('rfqs')
    .select(
      `
        *,
        rfq_items(*),
        rfq_vendor_invitations(
          *,
          vendors(id, name, category, status, rating)
        ),
        rfq_attachments(*)
      `
    )
    .eq('id', id)
    .eq('organization_id', profile.organization_id)

  if (!canViewOrganizationRFQs(profile.role)) {
    request = request.eq('rfq_vendor_invitations.vendor_id', profile.vendor_id)
  }

  const { data, error } = await request.maybeSingle<RFQWithDetails>()

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error('RFQ not found')
  }

  return {
    ...data,
    rfq_items: data.rfq_items.sort((a, b) => a.sort_order - b.sort_order),
  }
}

export async function createRFQ(values: RFQFormValues) {
  const { supabase, user, profile } = await getAuthenticatedProfile()

  if (!canManageRFQs(profile.role)) {
    throw new Error('You do not have permission to create RFQs.')
  }

  if (values.items.length === 0) {
    throw new Error('Add at least one product or service line item.')
  }

  if (values.status === 'published' && values.vendor_ids.length === 0) {
    throw new Error('Assign at least one vendor before sending an RFQ.')
  }

  const { data, error } = await supabase
    .from('rfqs')
    .insert({
      organization_id: profile.organization_id,
      rfq_number: generateRFQNumber(),
      title: values.title.trim(),
      category: values.category.trim(),
      description: normalizeText(values.description),
      deadline: values.deadline,
      status: values.status,
      created_by: user.id,
      published_at: values.status === 'published' ? new Date().toISOString() : null,
    })
    .select('*')
    .single<RFQRecord>()

  if (error) {
    throw error
  }

  await replaceRFQItems(data.id, values.items)
  await replaceRFQInvitations({
    rfqId: data.id,
    organizationId: profile.organization_id,
    vendorIds: values.vendor_ids,
  })

  await logRFQActivity({
    organizationId: profile.organization_id,
    actorId: user.id,
    rfqId: data.id,
    action: values.status === 'published' ? 'rfq.published' : 'rfq.created',
    message:
      values.status === 'published'
        ? `${data.rfq_number} was published and sent to ${values.vendor_ids.length} vendor(s).`
        : `${data.rfq_number} was saved as draft.`,
    metadata: {
      status: values.status,
      category: data.category,
      vendor_count: values.vendor_ids.length,
      item_count: values.items.length,
    },
  })

  revalidatePath('/dashboard/rfqs')
  return data
}

export async function updateRFQ(id: string, values: RFQFormValues) {
  const { supabase, user, profile } = await getAuthenticatedProfile()

  if (!canManageRFQs(profile.role)) {
    throw new Error('You do not have permission to update RFQs.')
  }

  if (values.items.length === 0) {
    throw new Error('Add at least one product or service line item.')
  }

  if (values.status === 'published' && values.vendor_ids.length === 0) {
    throw new Error('Assign at least one vendor before sending an RFQ.')
  }

  const { data, error } = await supabase
    .from('rfqs')
    .update({
      title: values.title.trim(),
      category: values.category.trim(),
      description: normalizeText(values.description),
      deadline: values.deadline,
      status: values.status,
      published_at: values.status === 'published' ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .select('*')
    .single<RFQRecord>()

  if (error) {
    throw error
  }

  await replaceRFQItems(data.id, values.items)
  await replaceRFQInvitations({
    rfqId: data.id,
    organizationId: profile.organization_id,
    vendorIds: values.vendor_ids,
  })

  await logRFQActivity({
    organizationId: profile.organization_id,
    actorId: user.id,
    rfqId: data.id,
    action: 'rfq.updated',
    message: `${data.rfq_number} was updated.`,
    metadata: {
      status: values.status,
      category: data.category,
      vendor_count: values.vendor_ids.length,
      item_count: values.items.length,
    },
  })

  revalidatePath('/dashboard/rfqs')
  revalidatePath(`/dashboard/rfqs/${id}`)
  return data
}

export async function updateRFQStatus(id: string, status: RFQStatus) {
  const { supabase, user, profile } = await getAuthenticatedProfile()

  if (!canManageRFQs(profile.role)) {
    throw new Error('You do not have permission to update RFQ status.')
  }

  const { data, error } = await supabase
    .from('rfqs')
    .update({
      status,
      closed_at: status === 'closed' ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .select('*')
    .single<RFQRecord>()

  if (error) {
    throw error
  }

  await logRFQActivity({
    organizationId: profile.organization_id,
    actorId: user.id,
    rfqId: data.id,
    action: 'rfq.status_changed',
    message: `${data.rfq_number} status changed to ${status}.`,
    metadata: { status },
  })

  revalidatePath('/dashboard/rfqs')
  revalidatePath(`/dashboard/rfqs/${id}`)
  return data
}

export async function addRFQAttachment(rfqId: string, attachment: AttachmentInput) {
  const { supabase, user, profile } = await getAuthenticatedProfile()

  if (!canManageRFQs(profile.role)) {
    throw new Error('You do not have permission to upload RFQ attachments.')
  }

  const { data: rfq, error: rfqError } = await supabase
    .from('rfqs')
    .select('id, organization_id')
    .eq('id', rfqId)
    .eq('organization_id', profile.organization_id)
    .maybeSingle()

  if (rfqError) {
    throw rfqError
  }

  if (!rfq) {
    throw new Error('RFQ not found')
  }

  const { data, error } = await supabase
    .from('rfq_attachments')
    .insert({
      organization_id: profile.organization_id,
      rfq_id: rfqId,
      file_name: attachment.file_name,
      storage_bucket: 'rfq-attachments',
      storage_path: attachment.storage_path,
      mime_type: attachment.mime_type || null,
      file_size: attachment.file_size || null,
      uploaded_by: user.id,
    })
    .select('*')
    .single<RFQAttachmentRecord>()

  if (error) {
    throw error
  }

  await logRFQActivity({
    organizationId: profile.organization_id,
    actorId: user.id,
    rfqId,
    action: 'rfq.attachment_added',
    message: `${attachment.file_name} was attached to the RFQ.`,
    metadata: { file_name: attachment.file_name },
  })

  revalidatePath('/dashboard/rfqs')
  revalidatePath(`/dashboard/rfqs/${rfqId}`)
  return data
}

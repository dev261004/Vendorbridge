'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  QuotationFormValues,
  QuotationRecord,
  QuotationStatus,
  QuotationWithDetails,
  VendorQuotationOpportunity,
} from '@/lib/quotations'

interface QuotationProfile {
  organization_id: string | null
  role: string | null
  vendor_id: string | null
}

interface AuthenticatedQuotationProfile extends QuotationProfile {
  organization_id: string
}

interface RFQForSubmission {
  id: string
  organization_id: string
  rfq_number: string
  title: string
  status: string
  deadline: string
}

function canSubmitQuotations(role: string | null) {
  return role === 'vendor'
}

function canCompareQuotations(role: string | null) {
  return role === 'procurement_officer'
}

function normalizeText(value?: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function todayISODate() {
  return new Date().toISOString().slice(0, 10)
}

function generateQuotationNumber() {
  const year = new Date().getFullYear()
  const random = Math.floor(100000 + Math.random() * 900000)
  return `QT-${year}-${random}`
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
    .maybeSingle<QuotationProfile>()

  if (profileError) {
    throw profileError
  }

  if (!profile?.organization_id) {
    throw new Error('Your account is not linked to an organization.')
  }

  return {
    supabase,
    user,
    profile: profile as AuthenticatedQuotationProfile,
  }
}

export async function getQuotationAccess() {
  const { profile } = await getAuthenticatedProfile()

  return {
    role: profile.role,
    canSubmit: canSubmitQuotations(profile.role),
    canCompare: canCompareQuotations(profile.role),
    vendorId: profile.vendor_id,
  }
}

async function logQuotationActivity(params: {
  organizationId: string
  actorId: string
  quotationId: string
  action: string
  message: string
  metadata?: Record<string, unknown>
}) {
  const supabase = await createClient()
  await supabase.from('activity_logs').insert({
    organization_id: params.organizationId,
    actor_id: params.actorId,
    entity_type: 'quotation',
    entity_id: params.quotationId,
    action: params.action,
    message: params.message,
    metadata: params.metadata || {},
  })
}

function calculateQuotationTotals(values: QuotationFormValues) {
  const subtotal = values.items.reduce(
    (total, item) => total + Number(item.quantity || 0) * Number(item.unit_price || 0),
    0
  )
  const gstPercent = Number(values.gst_percent || 0)
  const gstAmount = subtotal * (gstPercent / 100)

  return {
    subtotal,
    gstPercent,
    gstAmount,
    totalAmount: subtotal + gstAmount,
  }
}

function validateQuotationPayload(
  values: QuotationFormValues,
  nextStatus: Extract<QuotationStatus, 'draft' | 'submitted'>
) {
  if (!values.rfq_id) {
    throw new Error('RFQ is required.')
  }

  if (values.items.length === 0) {
    throw new Error('Quotation must include at least one line item.')
  }

  if (nextStatus === 'submitted') {
    if (!values.valid_until) {
      throw new Error('Quotation validity date is required.')
    }

    if (Number(values.delivery_days || 0) <= 0) {
      throw new Error('Delivery timeline is required.')
    }

    const missingPrice = values.items.some(
      (item) => Number(item.unit_price || 0) <= 0
    )

    if (missingPrice) {
      throw new Error('Enter unit price for every RFQ item before submitting.')
    }
  }
}

async function ensureVendorCanQuoteRFQ(
  rfqId: string,
  profile: AuthenticatedQuotationProfile
) {
  if (!profile.vendor_id) {
    throw new Error('Your vendor account is not linked to a vendor profile.')
  }

  const supabase = await createClient()
  const { data: invitation, error: invitationError } = await supabase
    .from('rfq_vendor_invitations')
    .select('id, rfq_id, vendor_id')
    .eq('rfq_id', rfqId)
    .eq('vendor_id', profile.vendor_id)
    .maybeSingle()

  if (invitationError) {
    throw invitationError
  }

  if (!invitation) {
    throw new Error('This RFQ is not assigned to your vendor account.')
  }

  const { data: rfq, error: rfqError } = await supabase
    .from('rfqs')
    .select('id, organization_id, rfq_number, title, status, deadline')
    .eq('id', rfqId)
    .eq('organization_id', profile.organization_id)
    .maybeSingle<RFQForSubmission>()

  if (rfqError) {
    throw rfqError
  }

  if (!rfq) {
    throw new Error('RFQ not found.')
  }

  if (rfq.status !== 'published') {
    throw new Error('Quotations can only be submitted for published RFQs.')
  }

  if (rfq.deadline < todayISODate()) {
    throw new Error('The RFQ submission deadline has passed.')
  }

  return rfq
}

async function replaceQuotationItems(
  quotationId: string,
  values: QuotationFormValues
) {
  const supabase = await createClient()

  await supabase.from('quotation_items').delete().eq('quotation_id', quotationId)

  const { error } = await supabase.from('quotation_items').insert(
    values.items.map((item) => ({
      quotation_id: quotationId,
      rfq_item_id: item.rfq_item_id,
      item_name: item.item_name.trim(),
      quantity: Number(item.quantity || 0),
      unit: item.unit.trim() || 'pcs',
      unit_price: Number(item.unit_price || 0),
      total_price: Number(item.quantity || 0) * Number(item.unit_price || 0),
      delivery_days:
        Number(item.delivery_days || 0) > 0 ? Number(item.delivery_days) : null,
      notes: normalizeText(item.notes),
    }))
  )

  if (error) {
    throw error
  }
}

async function saveQuotation(
  values: QuotationFormValues,
  nextStatus: Extract<QuotationStatus, 'draft' | 'submitted'>
) {
  const { supabase, user, profile } = await getAuthenticatedProfile()

  if (!canSubmitQuotations(profile.role)) {
    throw new Error('Only vendors can submit quotations.')
  }

  validateQuotationPayload(values, nextStatus)
  const rfq = await ensureVendorCanQuoteRFQ(values.rfq_id, profile)
  const totals = calculateQuotationTotals(values)

  const { data: existingQuotation, error: existingError } = await supabase
    .from('quotations')
    .select('*')
    .eq('rfq_id', values.rfq_id)
    .eq('vendor_id', profile.vendor_id)
    .maybeSingle<QuotationRecord>()

  if (existingError) {
    throw existingError
  }

  if (
    existingQuotation &&
    !['draft', 'submitted'].includes(existingQuotation.status)
  ) {
    throw new Error('This quotation can no longer be edited.')
  }

  const effectiveStatus =
    existingQuotation?.status === 'submitted' && nextStatus === 'draft'
      ? 'submitted'
      : nextStatus

  const payload = {
    status: effectiveStatus,
    subtotal: totals.subtotal,
    gst_percent: totals.gstPercent,
    gst_amount: totals.gstAmount,
    total_amount: totals.totalAmount,
    delivery_days:
      Number(values.delivery_days || 0) > 0 ? Number(values.delivery_days) : null,
    valid_until: normalizeText(values.valid_until),
    payment_terms: normalizeText(values.payment_terms),
    notes: normalizeText(values.notes),
    submitted_at:
      effectiveStatus === 'submitted'
        ? new Date().toISOString()
        : existingQuotation?.submitted_at || null,
  }

  const { data: quotation, error } = existingQuotation
    ? await supabase
        .from('quotations')
        .update(payload)
        .eq('id', existingQuotation.id)
        .eq('vendor_id', profile.vendor_id)
        .select('*')
        .single<QuotationRecord>()
    : await supabase
        .from('quotations')
        .insert({
          ...payload,
          organization_id: profile.organization_id,
          rfq_id: values.rfq_id,
          vendor_id: profile.vendor_id,
          quotation_number: generateQuotationNumber(),
          created_by: user.id,
        })
        .select('*')
        .single<QuotationRecord>()

  if (error) {
    throw error
  }

  await replaceQuotationItems(quotation.id, values)

  if (effectiveStatus === 'submitted') {
    await supabase
      .from('rfq_vendor_invitations')
      .update({
        status: 'quoted',
        responded_at: new Date().toISOString(),
      })
      .eq('rfq_id', values.rfq_id)
      .eq('vendor_id', profile.vendor_id)
  } else {
    await supabase
      .from('rfq_vendor_invitations')
      .update({
        status: 'viewed',
        viewed_at: new Date().toISOString(),
      })
      .eq('rfq_id', values.rfq_id)
      .eq('vendor_id', profile.vendor_id)
  }

  await logQuotationActivity({
    organizationId: profile.organization_id,
    actorId: user.id,
    quotationId: quotation.id,
    action:
      effectiveStatus === 'submitted'
        ? 'quotation.submitted'
        : 'quotation.draft_saved',
    message:
      effectiveStatus === 'submitted'
        ? `${quotation.quotation_number} was submitted for ${rfq.rfq_number}.`
        : `${quotation.quotation_number} was saved as draft for ${rfq.rfq_number}.`,
    metadata: {
      rfq_id: values.rfq_id,
      rfq_number: rfq.rfq_number,
      subtotal: totals.subtotal,
      total_amount: totals.totalAmount,
      item_count: values.items.length,
    },
  })

  revalidatePath('/dashboard/quotations')
  revalidatePath(`/dashboard/quotations/${quotation.id}`)
  return quotation
}

export async function saveQuotationDraft(values: QuotationFormValues) {
  return saveQuotation(values, 'draft')
}

export async function submitQuotation(values: QuotationFormValues) {
  return saveQuotation(values, 'submitted')
}

export async function getVendorQuotationOpportunities() {
  const { supabase, profile } = await getAuthenticatedProfile()

  if (!canSubmitQuotations(profile.role)) {
    return []
  }

  if (!profile.vendor_id) {
    throw new Error('Your vendor account is not linked to a vendor profile.')
  }

  const { data: invitations, error: invitationsError } = await supabase
    .from('rfq_vendor_invitations')
    .select(
      `
        id,
        status,
        invited_at,
        rfq_id,
        rfqs(
          id,
          organization_id,
          rfq_number,
          title,
          category,
          description,
          deadline,
          status,
          rfq_items(*),
          rfq_attachments(*)
        )
      `
    )
    .eq('vendor_id', profile.vendor_id)
    .eq('organization_id', profile.organization_id)
    .order('invited_at', { ascending: false })

  if (invitationsError) {
    throw invitationsError
  }

  const { data: quotations, error: quotationsError } = await supabase
    .from('quotations')
    .select('*, quotation_items(*)')
    .eq('vendor_id', profile.vendor_id)
    .eq('organization_id', profile.organization_id)
    .returns<QuotationWithDetails[]>()

  if (quotationsError) {
    throw quotationsError
  }

  const quotationsByRFQ = new Map(
    (quotations || []).map((quotation) => [
      quotation.rfq_id,
      {
        ...quotation,
        quotation_items: (quotation.quotation_items || []).sort(
          (a, b) => a.created_at.localeCompare(b.created_at)
        ),
      },
    ])
  )

  return (invitations || [])
    .filter((invitation) => Boolean(invitation.rfqs))
    .map((invitation) => {
      const rfq = Array.isArray(invitation.rfqs)
        ? invitation.rfqs[0]
        : invitation.rfqs

      return {
        invitation_id: invitation.id,
        invitation_status: invitation.status,
        invited_at: invitation.invited_at,
        rfq: {
          ...rfq,
          rfq_items: (rfq.rfq_items || []).sort(
            (a, b) => a.sort_order - b.sort_order
          ),
          rfq_attachments: rfq.rfq_attachments || [],
        },
        quotation: quotationsByRFQ.get(invitation.rfq_id) || null,
      }
    }) as VendorQuotationOpportunity[]
}

export async function getQuotations() {
  const { supabase, profile } = await getAuthenticatedProfile()

  if (canCompareQuotations(profile.role)) {
    const { data, error } = await supabase
      .from('quotations')
      .select(
        `
          *,
          quotation_items(*),
          rfqs(id, rfq_number, title, category, description, deadline, status),
          vendors(id, name, category, email, status, rating)
        `
      )
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })
      .returns<QuotationWithDetails[]>()

    if (error) {
      throw error
    }

    return (data || []).map((quotation) => ({
      ...quotation,
      quotation_items: (quotation.quotation_items || []).sort(
        (a, b) => a.created_at.localeCompare(b.created_at)
      ),
    }))
  }

  if (canSubmitQuotations(profile.role) && profile.vendor_id) {
    const { data, error } = await supabase
      .from('quotations')
      .select(
        `
          *,
          quotation_items(*),
          rfqs(id, rfq_number, title, category, description, deadline, status),
          vendors(id, name, category, email, status, rating)
        `
      )
      .eq('vendor_id', profile.vendor_id)
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })
      .returns<QuotationWithDetails[]>()

    if (error) {
      throw error
    }

    return data || []
  }

  return []
}

export async function getQuotationById(id: string) {
  const { supabase, profile } = await getAuthenticatedProfile()

  let request = supabase
    .from('quotations')
    .select(
      `
        *,
        quotation_items(*),
        rfqs(id, rfq_number, title, category, description, deadline, status),
        vendors(id, name, category, email, status, rating)
      `
    )
    .eq('id', id)
    .eq('organization_id', profile.organization_id)

  if (canSubmitQuotations(profile.role)) {
    request = request.eq('vendor_id', profile.vendor_id)
  } else if (!canCompareQuotations(profile.role)) {
    throw new Error('You do not have permission to view quotations.')
  }

  const { data, error } = await request.maybeSingle<QuotationWithDetails>()

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error('Quotation not found.')
  }

  return {
    ...data,
    quotation_items: (data.quotation_items || []).sort((a, b) =>
      a.created_at.localeCompare(b.created_at)
    ),
  }
}

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

  revalidateTag('quotations', { expire: 0 })
  return data[0]
}

export async function updateQuotation(
  id: string,
  quotationData: Partial<{
    status: string
    total_amount: number
    valid_until: string
    notes: string
  }>
) {
  const supabase = await createClient()
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

  revalidateTag('quotations')
  return data[0]
}

export async function addQuotationItem(quotationId: string, item: {
  item_name: string
  quantity: number
  unit_price: number
  total_price: number
}) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('quotation_items')
    .insert([
      {
        quotation_id: quotationId,
        ...item,
      },
    ])
    .select()

    if (error) {
      throw error
    }

  revalidateTag('quotations')
  return data[0]
}

export async function getQuotationItems(quotationId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('quotation_items')
    .select('*')
    .eq('quotation_id', quotationId)
    .order('created_at', { ascending: true })

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

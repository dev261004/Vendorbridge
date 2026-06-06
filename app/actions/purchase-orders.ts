'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  ApprovedQuotationForPO,
  DocumentAccess,
  PurchaseOrderStatus,
  PurchaseOrderWithDetails,
} from '@/lib/procurement-documents'

interface DocumentProfile {
  organization_id: string | null
  role: string | null
  vendor_id: string | null
}

interface AuthenticatedDocumentProfile extends DocumentProfile {
  organization_id: string
}

const purchaseOrderSelect = `
  *,
  vendors(id, name, category, gst_number, contact_person, email, phone, address, city, state, country, rating, status),
  rfqs(id, rfq_number, title, category, description, deadline, status),
  quotations(id, quotation_number, status, subtotal, gst_percent, gst_amount, total_amount, delivery_days, payment_terms, notes, submitted_at),
  approval_requests(id, status),
  purchase_order_items(*),
  invoices(id, invoice_number, status)
`

const approvedQuotationSelect = `
  *,
  quotation_items(*),
  rfqs(id, rfq_number, title, category, description, deadline, status),
  vendors(id, name, category, gst_number, contact_person, email, phone, address, city, state, country, rating, status),
  approval_requests(id, status)
`

function canGenerateDocuments(role: string | null) {
  return role === 'procurement_officer'
}

function canViewDocuments(role: string | null) {
  return role === 'procurement_officer' || role === 'vendor'
}

function todayISODate() {
  return new Date().toISOString().slice(0, 10)
}

function addDaysISODate(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
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
    .maybeSingle<DocumentProfile>()

  if (profileError) {
    throw profileError
  }

  if (!profile?.organization_id) {
    throw new Error('Your account is not linked to an organization.')
  }

  return {
    supabase,
    user,
    profile: profile as AuthenticatedDocumentProfile,
  }
}

async function logDocumentActivity(params: {
  organizationId: string
  actorId: string
  entityType: string
  entityId: string
  action: string
  message: string
  metadata?: Record<string, unknown>
}) {
  const supabase = await createClient()
  const { error } = await supabase.from('activity_logs').insert({
    organization_id: params.organizationId,
    actor_id: params.actorId,
    entity_type: params.entityType,
    entity_id: params.entityId,
    action: params.action,
    message: params.message,
    metadata: params.metadata || {},
  })

  if (error) {
    console.error('Failed to log document activity', error)
  }
}

async function generatePurchaseOrderNumber(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string
) {
  const year = new Date().getFullYear()
  const start = `${year}-01-01`
  const end = `${year + 1}-01-01`

  const { count, error } = await supabase
    .from('purchase_orders')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('created_at', start)
    .lt('created_at', end)

  if (error) {
    throw error
  }

  return `PO-${year}-${String((count || 0) + 1).padStart(4, '0')}`
}

function getApprovedRequestId(quotation: ApprovedQuotationForPO) {
  return (
    quotation.approval_requests?.find((request) => request.status === 'approved')
      ?.id || null
  )
}

export async function getPurchaseOrderAccess(): Promise<DocumentAccess> {
  const { profile } = await getAuthenticatedProfile()

  return {
    role: profile.role,
    canGenerate: canGenerateDocuments(profile.role),
    canView: canViewDocuments(profile.role),
    vendorId: profile.vendor_id,
  }
}

export async function getPurchaseOrders(): Promise<PurchaseOrderWithDetails[]> {
  const { supabase, profile } = await getAuthenticatedProfile()

  if (!canViewDocuments(profile.role)) {
    throw new Error('You do not have permission to view purchase orders.')
  }

  let request = supabase
    .from('purchase_orders')
    .select(purchaseOrderSelect)
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  if (profile.role === 'vendor') {
    if (!profile.vendor_id) return []
    request = request.eq('vendor_id', profile.vendor_id)
  }

  const { data, error } = await request

  if (error) {
    throw error
  }

  return (data || []) as PurchaseOrderWithDetails[]
}

export async function getApprovedQuotationsForPO(): Promise<
  ApprovedQuotationForPO[]
> {
  const { supabase, profile } = await getAuthenticatedProfile()

  if (!canGenerateDocuments(profile.role)) {
    return []
  }

  const { data: quotations, error: quotationsError } = await supabase
    .from('quotations')
    .select(approvedQuotationSelect)
    .eq('organization_id', profile.organization_id)
    .eq('status', 'accepted')
    .order('updated_at', { ascending: false })

  if (quotationsError) {
    throw quotationsError
  }

  const { data: purchaseOrders, error: purchaseOrdersError } = await supabase
    .from('purchase_orders')
    .select('quotation_id')
    .eq('organization_id', profile.organization_id)

  if (purchaseOrdersError) {
    throw purchaseOrdersError
  }

  const usedQuotationIds = new Set(
    (purchaseOrders || [])
      .map((order) => order.quotation_id as string | null)
      .filter(Boolean)
  )

  return ((quotations || []) as ApprovedQuotationForPO[]).filter(
    (quotation) => !usedQuotationIds.has(quotation.id)
  )
}

export async function getPurchaseOrderWorkspace() {
  const access = await getPurchaseOrderAccess()
  const purchaseOrders = access.canView ? await getPurchaseOrders() : []
  const approvedQuotations = access.canGenerate
    ? await getApprovedQuotationsForPO()
    : []

  return {
    access,
    purchaseOrders,
    approvedQuotations,
  }
}

export async function getPurchaseOrderById(
  id: string
): Promise<PurchaseOrderWithDetails | null> {
  const { supabase, profile } = await getAuthenticatedProfile()

  if (!canViewDocuments(profile.role)) {
    throw new Error('You do not have permission to view purchase orders.')
  }

  let request = supabase
    .from('purchase_orders')
    .select(purchaseOrderSelect)
    .eq('id', id)
    .eq('organization_id', profile.organization_id)

  if (profile.role === 'vendor') {
    if (!profile.vendor_id) return null
    request = request.eq('vendor_id', profile.vendor_id)
  }

  const { data, error } = await request.maybeSingle()

  if (error) {
    throw error
  }

  return (data as PurchaseOrderWithDetails | null) || null
}

export async function generatePurchaseOrderFromQuotation(quotationId: string) {
  const { supabase, user, profile } = await getAuthenticatedProfile()

  if (!canGenerateDocuments(profile.role)) {
    throw new Error('Only procurement officers can generate purchase orders.')
  }

  const { data: existingOrder, error: existingError } = await supabase
    .from('purchase_orders')
    .select('id, po_number')
    .eq('organization_id', profile.organization_id)
    .eq('quotation_id', quotationId)
    .maybeSingle()

  if (existingError) {
    throw existingError
  }

  if (existingOrder) {
    throw new Error(`PO ${existingOrder.po_number} already exists for this quotation.`)
  }

  const { data: quotation, error: quotationError } = await supabase
    .from('quotations')
    .select(approvedQuotationSelect)
    .eq('id', quotationId)
    .eq('organization_id', profile.organization_id)
    .maybeSingle<ApprovedQuotationForPO>()

  if (quotationError) {
    throw quotationError
  }

  if (!quotation) {
    throw new Error('Quotation not found.')
  }

  if (quotation.status !== 'accepted') {
    throw new Error('Only manager-approved quotations can be converted to POs.')
  }

  if (!quotation.quotation_items.length) {
    throw new Error('Quotation has no line items to convert.')
  }

  const poNumber = await generatePurchaseOrderNumber(
    supabase,
    profile.organization_id
  )
  const deliveryDays = Number(quotation.delivery_days || 0)
  const deliveryDate = deliveryDays > 0 ? addDaysISODate(deliveryDays) : null

  const { data: purchaseOrder, error: purchaseOrderError } = await supabase
    .from('purchase_orders')
    .insert({
      organization_id: profile.organization_id,
      rfq_id: quotation.rfq_id,
      quotation_id: quotation.id,
      approval_request_id: getApprovedRequestId(quotation),
      vendor_id: quotation.vendor_id,
      po_number: poNumber,
      status: 'generated',
      po_date: todayISODate(),
      delivery_date: deliveryDate,
      payment_terms: quotation.payment_terms,
      subtotal: Number(quotation.subtotal || 0),
      gst_amount: Number(quotation.gst_amount || 0),
      total_amount: Number(quotation.total_amount || 0),
      notes: quotation.notes,
      generated_by: user.id,
    })
    .select('id, po_number')
    .single()

  if (purchaseOrderError) {
    throw purchaseOrderError
  }

  const { error: itemError } = await supabase.from('purchase_order_items').insert(
    quotation.quotation_items.map((item) => ({
      purchase_order_id: purchaseOrder.id,
      quotation_item_id: item.id,
      item_name: item.item_name,
      quantity: Number(item.quantity || 0),
      unit: item.unit || 'pcs',
      unit_price: Number(item.unit_price || 0),
      total_price: Number(item.total_price || 0),
    }))
  )

  if (itemError) {
    throw itemError
  }

  await logDocumentActivity({
    organizationId: profile.organization_id,
    actorId: user.id,
    entityType: 'purchase_order',
    entityId: purchaseOrder.id,
    action: 'purchase_order.generated',
    message: `Generated ${purchaseOrder.po_number} from quotation ${quotation.quotation_number}.`,
    metadata: {
      quotation_id: quotation.id,
      vendor_id: quotation.vendor_id,
      total_amount: quotation.total_amount,
    },
  })

  revalidatePath('/dashboard/purchase-orders')
  revalidatePath('/dashboard/invoices')
  revalidatePath('/dashboard/quotations')

  return purchaseOrder
}

export async function updatePurchaseOrderStatus(
  id: string,
  status: PurchaseOrderStatus
) {
  const { supabase, user, profile } = await getAuthenticatedProfile()

  if (!canGenerateDocuments(profile.role)) {
    throw new Error('Only procurement officers can update purchase orders.')
  }

  const { data, error } = await supabase
    .from('purchase_orders')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .select('id, po_number, status')
    .single()

  if (error) {
    throw error
  }

  await logDocumentActivity({
    organizationId: profile.organization_id,
    actorId: user.id,
    entityType: 'purchase_order',
    entityId: id,
    action: 'purchase_order.status_updated',
    message: `Updated ${data.po_number} status to ${status}.`,
    metadata: { status },
  })

  revalidatePath('/dashboard/purchase-orders')
  revalidatePath(`/dashboard/purchase-orders/${id}`)

  return data
}

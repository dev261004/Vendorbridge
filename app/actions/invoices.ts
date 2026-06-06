'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  DocumentAccess,
  InvoiceEmailResult,
  InvoiceStatus,
  InvoiceWithDetails,
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

const invoiceSelect = `
  *,
  vendors(id, name, category, gst_number, contact_person, email, phone, address, city, state, country, rating, status),
  invoice_items(*),
  purchase_orders(
    *,
    vendors(id, name, category, gst_number, contact_person, email, phone, address, city, state, country, rating, status),
    rfqs(id, rfq_number, title, category, description, deadline, status),
    quotations(id, quotation_number, status, subtotal, gst_percent, gst_amount, total_amount, delivery_days, payment_terms, notes, submitted_at),
    purchase_order_items(*)
  )
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

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
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

async function generateInvoiceNumber(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string
) {
  const year = new Date().getFullYear()
  const start = `${year}-01-01`
  const end = `${year + 1}-01-01`

  const { count, error } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('created_at', start)
    .lt('created_at', end)

  if (error) {
    throw error
  }

  return `INV-${year}-${String((count || 0) + 1).padStart(4, '0')}`
}

function resolveDueDate(paymentTerms?: string | null) {
  const dayMatch = paymentTerms?.match(/(\d+)/)
  const days = dayMatch ? Number(dayMatch[1]) : 30
  return addDaysISODate(Number.isFinite(days) && days > 0 ? days : 30)
}

function calculateInvoiceTaxes(order: PurchaseOrderWithDetails) {
  const subtotal = Number(order.subtotal || 0)
  const gstAmount = Number(order.gst_amount || 0)
  const totalTaxPercent = subtotal > 0 ? (gstAmount / subtotal) * 100 : 0

  return {
    subtotal: roundMoney(subtotal),
    cgstPercent: roundMoney(totalTaxPercent / 2),
    sgstPercent: roundMoney(totalTaxPercent / 2),
    cgstAmount: roundMoney(gstAmount / 2),
    sgstAmount: roundMoney(gstAmount / 2),
    totalAmount: roundMoney(subtotal + gstAmount),
  }
}

function formatCurrency(value: number) {
  return `Rs. ${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`
}

function buildInvoiceEmail(invoice: InvoiceWithDetails) {
  const vendorName = invoice.vendors?.name || 'Vendor'
  const poNumber = invoice.purchase_orders?.po_number || invoice.purchase_order_id
  const subject = `Invoice ${invoice.invoice_number} from VendorBridge`
  const body = [
    `Hello ${vendorName},`,
    '',
    `Invoice ${invoice.invoice_number} has been generated against PO ${poNumber}.`,
    `Amount due: ${formatCurrency(Number(invoice.total_amount || 0))}`,
    `Due date: ${invoice.due_date}`,
    '',
    'Please review the invoice and process it as per agreed payment terms.',
    '',
    'Regards,',
    'VendorBridge Procurement Team',
  ].join('\n')

  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a;">
      <h2>Invoice ${invoice.invoice_number}</h2>
      <p>Hello ${vendorName},</p>
      <p>Invoice <strong>${invoice.invoice_number}</strong> has been generated against PO <strong>${poNumber}</strong>.</p>
      <table style="border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 6px 12px; border: 1px solid #cbd5e1;">Subtotal</td><td style="padding: 6px 12px; border: 1px solid #cbd5e1;">${formatCurrency(Number(invoice.subtotal || 0))}</td></tr>
        <tr><td style="padding: 6px 12px; border: 1px solid #cbd5e1;">CGST</td><td style="padding: 6px 12px; border: 1px solid #cbd5e1;">${formatCurrency(Number(invoice.cgst_amount || 0))}</td></tr>
        <tr><td style="padding: 6px 12px; border: 1px solid #cbd5e1;">SGST</td><td style="padding: 6px 12px; border: 1px solid #cbd5e1;">${formatCurrency(Number(invoice.sgst_amount || 0))}</td></tr>
        <tr><td style="padding: 6px 12px; border: 1px solid #cbd5e1;"><strong>Total</strong></td><td style="padding: 6px 12px; border: 1px solid #cbd5e1;"><strong>${formatCurrency(Number(invoice.total_amount || 0))}</strong></td></tr>
      </table>
      <p>Due date: <strong>${invoice.due_date}</strong></p>
      <p>Regards,<br/>VendorBridge Procurement Team</p>
    </div>
  `

  return { subject, body, html }
}

export async function getInvoiceAccess(): Promise<DocumentAccess> {
  const { profile } = await getAuthenticatedProfile()

  return {
    role: profile.role,
    canGenerate: canGenerateDocuments(profile.role),
    canView: canViewDocuments(profile.role),
    vendorId: profile.vendor_id,
  }
}

export async function getInvoices(): Promise<InvoiceWithDetails[]> {
  const { supabase, profile } = await getAuthenticatedProfile()

  if (!canViewDocuments(profile.role)) {
    throw new Error('You do not have permission to view invoices.')
  }

  let request = supabase
    .from('invoices')
    .select(invoiceSelect)
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

  return (data || []) as InvoiceWithDetails[]
}

export async function getPurchaseOrdersReadyForInvoice(): Promise<
  PurchaseOrderWithDetails[]
> {
  const { supabase, profile } = await getAuthenticatedProfile()

  if (!canGenerateDocuments(profile.role)) {
    return []
  }

  const { data: purchaseOrders, error: purchaseOrdersError } = await supabase
    .from('purchase_orders')
    .select(purchaseOrderSelect)
    .eq('organization_id', profile.organization_id)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })

  if (purchaseOrdersError) {
    throw purchaseOrdersError
  }

  const { data: invoices, error: invoicesError } = await supabase
    .from('invoices')
    .select('purchase_order_id')
    .eq('organization_id', profile.organization_id)

  if (invoicesError) {
    throw invoicesError
  }

  const invoicedOrderIds = new Set(
    (invoices || []).map((invoice) => invoice.purchase_order_id as string)
  )

  return ((purchaseOrders || []) as PurchaseOrderWithDetails[]).filter(
    (order) => !invoicedOrderIds.has(order.id)
  )
}

export async function getInvoiceWorkspace() {
  const access = await getInvoiceAccess()
  const invoices = access.canView ? await getInvoices() : []
  const purchaseOrdersReady = access.canGenerate
    ? await getPurchaseOrdersReadyForInvoice()
    : []

  return {
    access,
    invoices,
    purchaseOrdersReady,
  }
}

export async function getInvoiceById(
  id: string
): Promise<InvoiceWithDetails | null> {
  const { supabase, profile } = await getAuthenticatedProfile()

  if (!canViewDocuments(profile.role)) {
    throw new Error('You do not have permission to view invoices.')
  }

  let request = supabase
    .from('invoices')
    .select(invoiceSelect)
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

  return (data as InvoiceWithDetails | null) || null
}

export async function generateInvoiceFromPurchaseOrder(purchaseOrderId: string) {
  const { supabase, user, profile } = await getAuthenticatedProfile()

  if (!canGenerateDocuments(profile.role)) {
    throw new Error('Only procurement officers can generate invoices.')
  }

  const { data: existingInvoice, error: existingError } = await supabase
    .from('invoices')
    .select('id, invoice_number')
    .eq('organization_id', profile.organization_id)
    .eq('purchase_order_id', purchaseOrderId)
    .maybeSingle()

  if (existingError) {
    throw existingError
  }

  if (existingInvoice) {
    throw new Error(
      `Invoice ${existingInvoice.invoice_number} already exists for this PO.`
    )
  }

  const { data: purchaseOrder, error: purchaseOrderError } = await supabase
    .from('purchase_orders')
    .select(purchaseOrderSelect)
    .eq('id', purchaseOrderId)
    .eq('organization_id', profile.organization_id)
    .maybeSingle<PurchaseOrderWithDetails>()

  if (purchaseOrderError) {
    throw purchaseOrderError
  }

  if (!purchaseOrder) {
    throw new Error('Purchase order not found.')
  }

  if (purchaseOrder.status === 'cancelled') {
    throw new Error('Cancelled purchase orders cannot be invoiced.')
  }

  if (!purchaseOrder.purchase_order_items.length) {
    throw new Error('Purchase order has no line items to invoice.')
  }

  const invoiceNumber = await generateInvoiceNumber(
    supabase,
    profile.organization_id
  )
  const taxes = calculateInvoiceTaxes(purchaseOrder)

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      organization_id: profile.organization_id,
      purchase_order_id: purchaseOrder.id,
      vendor_id: purchaseOrder.vendor_id,
      invoice_number: invoiceNumber,
      status: 'pending_payment',
      invoice_date: todayISODate(),
      due_date: resolveDueDate(purchaseOrder.payment_terms),
      subtotal: taxes.subtotal,
      cgst_percent: taxes.cgstPercent,
      sgst_percent: taxes.sgstPercent,
      cgst_amount: taxes.cgstAmount,
      sgst_amount: taxes.sgstAmount,
      total_amount: taxes.totalAmount,
      notes: purchaseOrder.notes,
      created_by: user.id,
    })
    .select('id, invoice_number')
    .single()

  if (invoiceError) {
    throw invoiceError
  }

  const { error: itemError } = await supabase.from('invoice_items').insert(
    purchaseOrder.purchase_order_items.map((item) => ({
      invoice_id: invoice.id,
      purchase_order_item_id: item.id,
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
    entityType: 'invoice',
    entityId: invoice.id,
    action: 'invoice.generated',
    message: `Generated ${invoice.invoice_number} from PO ${purchaseOrder.po_number}.`,
    metadata: {
      purchase_order_id: purchaseOrder.id,
      vendor_id: purchaseOrder.vendor_id,
      total_amount: taxes.totalAmount,
    },
  })

  revalidatePath('/dashboard/invoices')
  revalidatePath('/dashboard/purchase-orders')

  return invoice
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus) {
  const { supabase, user, profile } = await getAuthenticatedProfile()

  if (!canGenerateDocuments(profile.role)) {
    throw new Error('Only procurement officers can update invoices.')
  }

  const { data, error } = await supabase
    .from('invoices')
    .update({
      status,
      paid_at: status === 'paid' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .select('id, invoice_number, status')
    .single()

  if (error) {
    throw error
  }

  await logDocumentActivity({
    organizationId: profile.organization_id,
    actorId: user.id,
    entityType: 'invoice',
    entityId: id,
    action: 'invoice.status_updated',
    message: `Updated ${data.invoice_number} status to ${status}.`,
    metadata: { status },
  })

  revalidatePath('/dashboard/invoices')
  revalidatePath(`/dashboard/invoices/${id}`)

  return data
}

export async function sendInvoiceEmail(
  id: string,
  recipientOverride?: string
): Promise<InvoiceEmailResult> {
  const { supabase, user, profile } = await getAuthenticatedProfile()

  if (!canGenerateDocuments(profile.role)) {
    throw new Error('Only procurement officers can send invoices.')
  }

  const invoice = await getInvoiceById(id)

  if (!invoice) {
    throw new Error('Invoice not found.')
  }

  const recipient = recipientOverride?.trim() || invoice.vendors?.email?.trim()

  if (!recipient) {
    throw new Error('Vendor email is missing for this invoice.')
  }

  const email = buildInvoiceEmail(invoice)
  const resendApiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.INVOICE_EMAIL_FROM

  if (!resendApiKey || !fromEmail) {
    return {
      sent: false,
      recipient,
      subject: email.subject,
      body: email.body,
      message:
        'Email provider is not configured. Add RESEND_API_KEY and INVOICE_EMAIL_FROM to send invoices directly.',
    }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: recipient,
      subject: email.subject,
      html: email.html,
      text: email.body,
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Invoice email failed: ${details || response.statusText}`)
  }

  const sentAt = new Date().toISOString()

  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      email_sent_to: recipient,
      email_sent_at: sentAt,
      updated_at: sentAt,
    })
    .eq('id', invoice.id)
    .eq('organization_id', profile.organization_id)

  if (updateError) {
    throw updateError
  }

  await logDocumentActivity({
    organizationId: profile.organization_id,
    actorId: user.id,
    entityType: 'invoice',
    entityId: invoice.id,
    action: 'invoice.email_sent',
    message: `Sent ${invoice.invoice_number} to ${recipient}.`,
    metadata: { recipient },
  })

  revalidatePath('/dashboard/invoices')
  revalidatePath(`/dashboard/invoices/${invoice.id}`)

  return {
    sent: true,
    recipient,
    subject: email.subject,
    body: email.body,
    message: `Invoice sent to ${recipient}.`,
  }
}

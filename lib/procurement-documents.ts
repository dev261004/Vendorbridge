import { QuotationItemRecord, QuotationRecord } from '@/lib/quotations'
import { RFQRecord } from '@/lib/rfqs'
import { VendorRecord } from '@/lib/vendors'

export type PurchaseOrderStatus =
  | 'generated'
  | 'sent'
  | 'acknowledged'
  | 'partial_delivery'
  | 'completed'
  | 'cancelled'

export type InvoiceStatus =
  | 'draft'
  | 'pending_payment'
  | 'paid'
  | 'overdue'
  | 'cancelled'

export interface PurchaseOrderRecord {
  id: string
  organization_id: string
  rfq_id: string | null
  quotation_id: string | null
  approval_request_id: string | null
  vendor_id: string
  po_number: string
  status: PurchaseOrderStatus
  po_date: string
  delivery_date: string | null
  payment_terms: string | null
  subtotal: number
  gst_amount: number
  total_amount: number
  notes: string | null
  generated_by: string | null
  created_at: string
  updated_at: string
}

export interface PurchaseOrderItemRecord {
  id: string
  purchase_order_id: string
  quotation_item_id: string | null
  item_name: string
  quantity: number
  unit: string
  unit_price: number
  total_price: number
  received_quantity: number
  created_at: string
}

export interface InvoiceRecord {
  id: string
  organization_id: string
  purchase_order_id: string
  vendor_id: string
  invoice_number: string
  status: InvoiceStatus
  invoice_date: string
  due_date: string
  subtotal: number
  cgst_percent: number
  sgst_percent: number
  cgst_amount: number
  sgst_amount: number
  total_amount: number
  pdf_bucket: string | null
  pdf_path: string | null
  email_sent_to: string | null
  email_sent_at: string | null
  paid_at: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface InvoiceItemRecord {
  id: string
  invoice_id: string
  purchase_order_item_id: string | null
  item_name: string
  quantity: number
  unit: string
  unit_price: number
  total_price: number
  created_at: string
}

export type DocumentVendorSummary = Pick<
  VendorRecord,
  | 'id'
  | 'name'
  | 'category'
  | 'gst_number'
  | 'contact_person'
  | 'email'
  | 'phone'
  | 'address'
  | 'city'
  | 'state'
  | 'country'
  | 'rating'
  | 'status'
>

export type DocumentRFQSummary = Pick<
  RFQRecord,
  'id' | 'rfq_number' | 'title' | 'category' | 'description' | 'deadline' | 'status'
>

export type DocumentQuotationSummary = Pick<
  QuotationRecord,
  | 'id'
  | 'quotation_number'
  | 'status'
  | 'subtotal'
  | 'gst_percent'
  | 'gst_amount'
  | 'total_amount'
  | 'delivery_days'
  | 'payment_terms'
  | 'notes'
  | 'submitted_at'
>

export interface ApprovalRequestSummary {
  id: string
  status: 'pending' | 'approved' | 'rejected'
}

export interface ApprovedQuotationForPO extends QuotationRecord {
  quotation_items: QuotationItemRecord[]
  rfqs?: DocumentRFQSummary | null
  vendors?: DocumentVendorSummary | null
  approval_requests?: ApprovalRequestSummary[]
}

export interface PurchaseOrderWithDetails extends PurchaseOrderRecord {
  purchase_order_items: PurchaseOrderItemRecord[]
  vendors?: DocumentVendorSummary | null
  rfqs?: DocumentRFQSummary | null
  quotations?: DocumentQuotationSummary | null
  approval_requests?: ApprovalRequestSummary | null
  invoices?: Pick<InvoiceRecord, 'id' | 'invoice_number' | 'status'>[]
}

export interface InvoiceWithDetails extends InvoiceRecord {
  invoice_items: InvoiceItemRecord[]
  vendors?: DocumentVendorSummary | null
  purchase_orders?: PurchaseOrderWithDetails | null
}

export interface DocumentAccess {
  role: string | null
  canGenerate: boolean
  canView: boolean
  vendorId: string | null
}

export interface InvoiceEmailResult {
  sent: boolean
  recipient: string
  subject: string
  body: string
  message: string
}

export const purchaseOrderStatusLabels: Record<PurchaseOrderStatus, string> = {
  generated: 'Generated',
  sent: 'Sent',
  acknowledged: 'Acknowledged',
  partial_delivery: 'Partial Delivery',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  pending_payment: 'Pending Payment',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
}

export const purchaseOrderStatuses: PurchaseOrderStatus[] = [
  'generated',
  'sent',
  'acknowledged',
  'partial_delivery',
  'completed',
  'cancelled',
]

export const invoiceStatuses: InvoiceStatus[] = [
  'draft',
  'pending_payment',
  'paid',
  'overdue',
  'cancelled',
]

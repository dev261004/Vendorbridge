import { RFQAttachmentRecord, RFQItemRecord, RFQRecord } from '@/lib/rfqs'
import { VendorRecord } from '@/lib/vendors'

export type QuotationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'selected'
  | 'accepted'
  | 'rejected'
  | 'expired'

export type QuotationStatusFilter = QuotationStatus | 'all'

export interface QuotationItemInput {
  rfq_item_id: string
  item_name: string
  quantity: number
  unit: string
  unit_price: number
  delivery_days: number
  notes: string
}

export interface QuotationFormValues {
  rfq_id: string
  valid_until: string
  delivery_days: number
  payment_terms: string
  notes: string
  gst_percent: number
  items: QuotationItemInput[]
}

export interface QuotationRecord {
  id: string
  organization_id: string
  rfq_id: string
  vendor_id: string
  quotation_number: string
  status: QuotationStatus
  subtotal: number
  gst_percent: number
  gst_amount: number
  total_amount: number
  delivery_days: number | null
  valid_until: string | null
  payment_terms: string | null
  notes: string | null
  created_by: string | null
  submitted_at: string | null
  created_at: string
  updated_at: string
}

export interface QuotationItemRecord {
  id: string
  quotation_id: string
  rfq_item_id: string | null
  item_name: string
  quantity: number
  unit: string
  unit_price: number
  total_price: number
  delivery_days: number | null
  notes: string | null
  created_at: string
}

export interface QuotationWithDetails extends QuotationRecord {
  quotation_items: QuotationItemRecord[]
  rfqs?: Pick<
    RFQRecord,
    'id' | 'rfq_number' | 'title' | 'category' | 'description' | 'deadline' | 'status'
  >
  vendors?: Pick<
    VendorRecord,
    'id' | 'name' | 'category' | 'email' | 'status' | 'rating'
  >
}

export interface QuotationRFQSummary
  extends Pick<
    RFQRecord,
    | 'id'
    | 'organization_id'
    | 'rfq_number'
    | 'title'
    | 'category'
    | 'description'
    | 'deadline'
    | 'status'
  > {
  rfq_items: RFQItemRecord[]
  rfq_attachments: RFQAttachmentRecord[]
}

export interface VendorQuotationOpportunity {
  invitation_id: string
  invitation_status: 'invited' | 'viewed' | 'quoted' | 'declined'
  invited_at: string
  rfq: QuotationRFQSummary
  quotation: QuotationWithDetails | null
}

export const quotationStatusLabels: Record<QuotationStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  selected: 'Selected',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired: 'Expired',
}

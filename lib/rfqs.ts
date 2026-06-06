import { VendorRecord } from '@/lib/vendors'

export type RFQStatus = 'draft' | 'published' | 'closed' | 'cancelled'

export type RFQStatusFilter = RFQStatus | 'all'

export interface RFQItemInput {
  item_name: string
  description: string
  quantity: number
  unit: string
  estimated_unit_price: number
  specifications: string
}

export interface RFQFormValues {
  title: string
  category: string
  description: string
  deadline: string
  status: Extract<RFQStatus, 'draft' | 'published'>
  vendor_ids: string[]
  items: RFQItemInput[]
}

export interface RFQRecord {
  id: string
  organization_id: string
  rfq_number: string
  title: string
  category: string
  description: string | null
  deadline: string
  status: RFQStatus
  created_by: string
  published_at: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
}

export interface RFQItemRecord {
  id: string
  rfq_id: string
  item_name: string
  description: string | null
  quantity: number
  unit: string
  estimated_unit_price: number | null
  specifications: string | null
  sort_order: number
  created_at: string
}

export interface RFQInvitationRecord {
  id: string
  organization_id: string
  rfq_id: string
  vendor_id: string
  status: 'invited' | 'viewed' | 'quoted' | 'declined'
  invited_at: string
  viewed_at: string | null
  responded_at: string | null
  vendors?: Pick<VendorRecord, 'id' | 'name' | 'category' | 'status' | 'rating'>
}

export interface RFQAttachmentRecord {
  id: string
  organization_id: string
  rfq_id: string
  file_name: string
  storage_bucket: string
  storage_path: string
  mime_type: string | null
  file_size: number | null
  uploaded_by: string | null
  created_at: string
}

export interface RFQWithDetails extends RFQRecord {
  rfq_items: RFQItemRecord[]
  rfq_vendor_invitations: RFQInvitationRecord[]
  rfq_attachments: RFQAttachmentRecord[]
}

export const rfqStatuses: Array<{
  value: RFQStatusFilter
  label: string
}> = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export const rfqStatusLabels: Record<RFQStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  closed: 'Closed',
  cancelled: 'Cancelled',
}

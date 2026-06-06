import { QuotationStatus } from '@/lib/quotations'

export type ApprovalRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'

export type ApprovalStepStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'skipped'

export type ApprovalDecision = Extract<
  ApprovalRequestStatus,
  'approved' | 'rejected'
>

export interface ApprovalStepRecord {
  id: string
  approval_request_id: string
  organization_id: string
  step_order: number
  approver_id: string | null
  approver_role: string | null
  status: ApprovalStepStatus
  remarks: string | null
  action_at: string | null
  due_at: string | null
  created_at: string
  updated_at: string
}

export interface ApprovalRFQSummary {
  id: string
  rfq_number: string
  title: string
  category: string
  deadline: string
  status: string
}

export interface ApprovalVendorSummary {
  id: string
  name: string
  category: string
  email: string | null
  rating: number | null
  status: string
}

export interface ApprovalQuotationSummary {
  id: string
  quotation_number: string
  status: QuotationStatus
  subtotal: number
  gst_percent: number
  gst_amount: number
  total_amount: number
  delivery_days: number | null
  valid_until: string | null
  submitted_at: string | null
  vendors?: ApprovalVendorSummary | null
}

export interface ApprovalRequestRecord {
  id: string
  organization_id: string
  rfq_id: string
  quotation_id: string
  status: ApprovalRequestStatus
  current_step: number
  requested_by: string
  requested_at: string
  completed_at: string | null
  final_remarks: string | null
  created_at: string
  updated_at: string
}

export interface ApprovalRequestWithDetails extends ApprovalRequestRecord {
  rfqs?: ApprovalRFQSummary | null
  quotations?: ApprovalQuotationSummary | null
  approval_steps: ApprovalStepRecord[]
}

export const approvalStatusLabels: Record<ApprovalRequestStatus, string> = {
  pending: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
}

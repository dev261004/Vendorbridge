'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  ApprovalDecision,
  ApprovalRequestWithDetails,
  ApprovalStepRecord,
} from '@/lib/approvals'

interface ApprovalProfile {
  organization_id: string | null
  role: string | null
}

interface AuthenticatedApprovalProfile extends ApprovalProfile {
  organization_id: string
}

interface ApprovalQuotationForRequest {
  id: string
  organization_id: string
  rfq_id: string
  quotation_number: string
  status: string
  total_amount: number
  rfqs?: {
    rfq_number: string
    title: string
  } | null
  vendors?: {
    name: string
  } | null
}

function canRequestApproval(role: string | null) {
  return role === 'procurement_officer'
}

function canResolveApproval(role: string | null) {
  return role === 'manager'
}

function normalizeRemarks(value?: string | null) {
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
    .select('organization_id, role')
    .eq('id', user.id)
    .maybeSingle<ApprovalProfile>()

  if (profileError) {
    throw profileError
  }

  if (!profile?.organization_id) {
    throw new Error('Your account is not linked to an organization.')
  }

  return {
    supabase,
    user,
    profile: profile as AuthenticatedApprovalProfile,
  }
}

async function logApprovalActivity(params: {
  organizationId: string
  actorId: string
  approvalRequestId: string
  action: string
  message: string
  metadata?: Record<string, unknown>
}) {
  const supabase = await createClient()
  await supabase.from('activity_logs').insert({
    organization_id: params.organizationId,
    actor_id: params.actorId,
    entity_type: 'approval_request',
    entity_id: params.approvalRequestId,
    action: params.action,
    message: params.message,
    metadata: params.metadata || {},
  })
}

async function createNotifications(params: {
  organizationId: string
  userIds: string[]
  title: string
  message: string
  entityType: string
  entityId: string
}) {
  const uniqueUserIds = Array.from(new Set(params.userIds)).filter(Boolean)

  if (uniqueUserIds.length === 0) {
    return
  }

  const supabase = await createClient()
  await supabase.from('notifications').insert(
    uniqueUserIds.map((userId) => ({
      organization_id: params.organizationId,
      user_id: userId,
      title: params.title,
      message: params.message,
      entity_type: params.entityType,
      entity_id: params.entityId,
    }))
  )
}

export async function getApprovalWorkflowAccess() {
  const { profile } = await getAuthenticatedProfile()

  return {
    role: profile.role,
    canApprove: canResolveApproval(profile.role),
  }
}

export async function getApprovalRequests() {
  const { supabase, profile } = await getAuthenticatedProfile()

  if (!canResolveApproval(profile.role)) {
    throw new Error('Only managers can view approval workflows.')
  }

  const { data, error } = await supabase
    .from('approval_requests')
    .select(
      `
        *,
        rfqs(id, rfq_number, title, category, deadline, status),
        quotations(
          id,
          quotation_number,
          status,
          subtotal,
          gst_percent,
          gst_amount,
          total_amount,
          delivery_days,
          valid_until,
          submitted_at,
          vendors(id, name, category, email, rating, status)
        ),
        approval_steps(*)
      `
    )
    .eq('organization_id', profile.organization_id)
    .order('requested_at', { ascending: false })
    .returns<ApprovalRequestWithDetails[]>()

  if (error) {
    throw error
  }

  return (data || []).map((request) => ({
    ...request,
    approval_steps: (request.approval_steps || []).sort(
      (a, b) => a.step_order - b.step_order
    ),
  }))
}

export async function requestQuotationApproval(quotationId: string) {
  const { supabase, user, profile } = await getAuthenticatedProfile()

  if (!canRequestApproval(profile.role)) {
    throw new Error('Only procurement officers can initiate approvals.')
  }

  const { data: quotation, error: quotationError } = await supabase
    .from('quotations')
    .select(
      `
        id,
        organization_id,
        rfq_id,
        quotation_number,
        status,
        total_amount,
        rfqs(rfq_number, title),
        vendors(name)
      `
    )
    .eq('id', quotationId)
    .eq('organization_id', profile.organization_id)
    .maybeSingle<ApprovalQuotationForRequest>()

  if (quotationError) {
    throw quotationError
  }

  if (!quotation) {
    throw new Error('Quotation not found.')
  }

  if (!['submitted', 'under_review'].includes(quotation.status)) {
    throw new Error('Only submitted quotations can be sent for approval.')
  }

  const { data: existingRequest, error: existingError } = await supabase
    .from('approval_requests')
    .select('id, status')
    .eq('quotation_id', quotation.id)
    .maybeSingle<{ id: string; status: string }>()

  if (existingError) {
    throw existingError
  }

  if (existingRequest) {
    return existingRequest
  }

  const { data: approvalRequest, error: requestError } = await supabase
    .from('approval_requests')
    .insert({
      organization_id: profile.organization_id,
      rfq_id: quotation.rfq_id,
      quotation_id: quotation.id,
      status: 'pending',
      current_step: 1,
      requested_by: user.id,
    })
    .select('id, status')
    .single<{ id: string; status: string }>()

  if (requestError) {
    throw requestError
  }

  const dueAt = new Date()
  dueAt.setDate(dueAt.getDate() + 2)

  const { error: stepError } = await supabase.from('approval_steps').insert({
    approval_request_id: approvalRequest.id,
    organization_id: profile.organization_id,
    step_order: 1,
    approver_role: 'manager',
    status: 'pending',
    due_at: dueAt.toISOString(),
  })

  if (stepError) {
    throw stepError
  }

  const { error: quotationUpdateError } = await supabase
    .from('quotations')
    .update({ status: 'under_review' })
    .eq('id', quotation.id)
    .eq('organization_id', profile.organization_id)

  if (quotationUpdateError) {
    throw quotationUpdateError
  }

  await logApprovalActivity({
    organizationId: profile.organization_id,
    actorId: user.id,
    approvalRequestId: approvalRequest.id,
    action: 'approval.requested',
    message: `${quotation.quotation_number} was sent for manager approval.`,
    metadata: {
      quotation_id: quotation.id,
      rfq_id: quotation.rfq_id,
      rfq_number: quotation.rfqs?.rfq_number,
      vendor: quotation.vendors?.name,
      total_amount: quotation.total_amount,
    },
  })

  const { data: managers } = await supabase
    .from('profiles')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .eq('role', 'manager')

  await createNotifications({
    organizationId: profile.organization_id,
    userIds: (managers || []).map((manager) => manager.id),
    title: 'Approval request pending',
    message: `${quotation.quotation_number} is waiting for manager approval.`,
    entityType: 'approval_request',
    entityId: approvalRequest.id,
  })

  revalidatePath('/dashboard/approvals')
  revalidatePath('/dashboard/quotations')
  revalidatePath(`/dashboard/quotations/${quotation.id}`)
  return approvalRequest
}

export async function submitApprovalDecision(
  approvalRequestId: string,
  decision: ApprovalDecision,
  remarks?: string
) {
  const { supabase, user, profile } = await getAuthenticatedProfile()

  if (!canResolveApproval(profile.role)) {
    throw new Error('Only managers can approve or reject procurement requests.')
  }

  const finalRemarks =
    normalizeRemarks(remarks) ||
    (decision === 'approved'
      ? 'Approved for purchase order generation.'
      : null)

  if (decision === 'rejected' && !finalRemarks) {
    throw new Error('Enter approval remarks before rejecting this request.')
  }

  const { data: approvalRequest, error: requestError } = await supabase
    .from('approval_requests')
    .select('*, approval_steps(*)')
    .eq('id', approvalRequestId)
    .eq('organization_id', profile.organization_id)
    .maybeSingle<ApprovalRequestWithDetails>()

  if (requestError) {
    throw requestError
  }

  if (!approvalRequest) {
    throw new Error('Approval request not found.')
  }

  if (approvalRequest.status !== 'pending') {
    throw new Error('This approval request has already been completed.')
  }

  const now = new Date().toISOString()
  const currentStep =
    (approvalRequest.approval_steps || []).find(
      (step) => step.step_order === approvalRequest.current_step
    ) || null

  if (currentStep) {
    const { error: stepError } = await supabase
      .from('approval_steps')
      .update({
        approver_id: user.id,
        status: decision,
        remarks: finalRemarks,
        action_at: now,
      })
      .eq('id', currentStep.id)
      .eq('organization_id', profile.organization_id)

    if (stepError) {
      throw stepError
    }
  } else {
    const { error: stepError } = await supabase.from('approval_steps').insert({
      approval_request_id: approvalRequest.id,
      organization_id: profile.organization_id,
      step_order: approvalRequest.current_step,
      approver_id: user.id,
      approver_role: 'manager',
      status: decision,
      remarks: finalRemarks,
      action_at: now,
    } satisfies Partial<ApprovalStepRecord>)

    if (stepError) {
      throw stepError
    }
  }

  const { error: requestUpdateError } = await supabase
    .from('approval_requests')
    .update({
      status: decision,
      completed_at: now,
      final_remarks: finalRemarks,
    })
    .eq('id', approvalRequest.id)
    .eq('organization_id', profile.organization_id)

  if (requestUpdateError) {
    throw requestUpdateError
  }

  const nextQuotationStatus = decision === 'approved' ? 'accepted' : 'rejected'
  const { error: quotationUpdateError } = await supabase
    .from('quotations')
    .update({ status: nextQuotationStatus })
    .eq('id', approvalRequest.quotation_id)
    .eq('organization_id', profile.organization_id)

  if (quotationUpdateError) {
    throw quotationUpdateError
  }

  await logApprovalActivity({
    organizationId: profile.organization_id,
    actorId: user.id,
    approvalRequestId: approvalRequest.id,
    action:
      decision === 'approved'
        ? 'approval.approved'
        : 'approval.rejected',
    message:
      decision === 'approved'
        ? 'Procurement request was approved by manager.'
        : 'Procurement request was rejected by manager.',
    metadata: {
      quotation_id: approvalRequest.quotation_id,
      rfq_id: approvalRequest.rfq_id,
      remarks: finalRemarks,
      quotation_status: nextQuotationStatus,
    },
  })

  await createNotifications({
    organizationId: profile.organization_id,
    userIds: [approvalRequest.requested_by],
    title:
      decision === 'approved'
        ? 'Approval request approved'
        : 'Approval request rejected',
    message:
      decision === 'approved'
        ? 'A quotation approval was approved and is ready for purchase order generation.'
        : 'A quotation approval was rejected. Review manager remarks before continuing.',
    entityType: 'approval_request',
    entityId: approvalRequest.id,
  })

  revalidatePath('/dashboard/approvals')
  revalidatePath('/dashboard/quotations')
  revalidatePath(`/dashboard/quotations/${approvalRequest.quotation_id}`)
  return {
    id: approvalRequest.id,
    status: decision,
    quotation_status: nextQuotationStatus,
  }
}

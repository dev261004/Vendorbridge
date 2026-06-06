'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquareText,
  PackageCheck,
  RefreshCw,
  Route,
  Search,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  getApprovalRequests,
  submitApprovalDecision,
} from '@/app/actions/approvals'
import {
  ApprovalDecision,
  ApprovalRequestStatus,
  ApprovalRequestWithDetails,
  approvalStatusLabels,
} from '@/lib/approvals'

type StatusFilter = ApprovalRequestStatus | 'all'

const statusFilters: Array<{ label: string; value: StatusFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<ApprovalRequestWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeDecisionId, setActiveDecisionId] = useState<string | null>(null)
  const [remarksById, setRemarksById] = useState<Record<string, string>>({})
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadApprovals()
  }, [])

  const loadApprovals = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getApprovalRequests()
      setRequests(data)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to load approval workflows.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const stats = useMemo(
    () => ({
      pending: requests.filter((request) => request.status === 'pending').length,
      approved: requests.filter((request) => request.status === 'approved').length,
      rejected: requests.filter((request) => request.status === 'rejected').length,
      totalValue: requests
        .filter((request) => request.status === 'pending')
        .reduce(
          (total, request) =>
            total + Number(request.quotations?.total_amount || 0),
          0
        ),
    }),
    [requests]
  )

  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return requests.filter((request) => {
      const matchesStatus =
        statusFilter === 'all' || request.status === statusFilter
      const matchesSearch =
        !query ||
        [
          request.rfqs?.title,
          request.rfqs?.rfq_number,
          request.quotations?.quotation_number,
          request.quotations?.vendors?.name,
          request.quotations?.vendors?.category,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query))

      return matchesStatus && matchesSearch
    })
  }, [requests, searchQuery, statusFilter])

  const handleDecision = async (
    request: ApprovalRequestWithDetails,
    decision: ApprovalDecision
  ) => {
    const remarks = remarksById[request.id] || ''

    try {
      setActiveDecisionId(request.id)
      setError(null)
      setSuccess(null)
      await submitApprovalDecision(request.id, decision, remarks)
      setRemarksById((current) => {
        const next = { ...current }
        delete next[request.id]
        return next
      })
      setSuccess(
        decision === 'approved'
          ? 'Approval recorded. The quotation is ready for purchase order generation.'
          : 'Rejection recorded with remarks.'
      )
      await loadApprovals()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to update approval workflow.'
      )
    } finally {
      setActiveDecisionId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-white">
            Approval Workflow
          </h1>
          <p className="text-slate-400">
            Review selected quotations, record manager remarks, and move
            procurement requests through approval decisions.
          </p>
        </div>
        <Button
          onClick={loadApprovals}
          className="w-fit bg-slate-700 text-white hover:bg-slate-600"
        >
          <RefreshCw className="mr-2 size-4" />
          Refresh
        </Button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <StatCard
          title="Pending Review"
          value={stats.pending}
          icon={<Clock3 className="size-5 text-yellow-400" />}
        />
        <StatCard
          title="Approved"
          value={stats.approved}
          icon={<CheckCircle2 className="size-5 text-green-400" />}
        />
        <StatCard
          title="Rejected"
          value={stats.rejected}
          icon={<XCircle className="size-5 text-red-400" />}
        />
        <StatCard
          title="Pending Value"
          value={`Rs. ${stats.totalValue.toLocaleString('en-IN')}`}
          icon={<PackageCheck className="size-5 text-blue-400" />}
        />
      </div>

      <div className="mb-6 rounded-lg border border-slate-700 bg-slate-800 p-5">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-500" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search RFQ, quotation, vendor, or category..."
              className="border-slate-600 bg-slate-700 pl-9 text-white placeholder:text-slate-500"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={
                statusFilter === filter.value
                  ? 'rounded-full border border-blue-600 bg-blue-600 px-3 py-1 text-xs font-medium text-white'
                  : 'rounded-full border border-slate-600 bg-slate-700 px-3 py-1 text-xs font-medium text-slate-300 hover:bg-slate-600'
              }
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-700 bg-red-900/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg border border-green-700 bg-green-900/30 px-4 py-3 text-sm text-green-300">
          {success}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 text-center text-slate-500">
          Loading approval workflows...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 text-center text-slate-400">
          No approval requests found for the selected filters.
        </div>
      ) : (
        <div className="space-y-5">
          {filteredRequests.map((request) => (
            <ApprovalCard
              key={request.id}
              request={request}
              remarks={remarksById[request.id] || ''}
              isUpdating={activeDecisionId === request.id}
              onRemarksChange={(value) =>
                setRemarksById((current) => ({
                  ...current,
                  [request.id]: value,
                }))
              }
              onDecision={(decision) => handleDecision(request, decision)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ApprovalCard({
  request,
  remarks,
  isUpdating,
  onRemarksChange,
  onDecision,
}: {
  request: ApprovalRequestWithDetails
  remarks: string
  isUpdating: boolean
  onRemarksChange: (value: string) => void
  onDecision: (decision: ApprovalDecision) => void
}) {
  const quotation = request.quotations
  const rfq = request.rfqs
  const vendor = quotation?.vendors
  const isPending = request.status === 'pending'

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-800 p-6">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-white">
              {rfq?.title || 'Approval Request'}
            </h2>
            <StatusBadge status={request.status} />
          </div>
          <div className="flex flex-wrap gap-5 text-sm">
            <InfoPair label="RFQ" value={rfq?.rfq_number || '-'} />
            <InfoPair
              label="Quotation"
              value={quotation?.quotation_number || '-'}
            />
            <InfoPair label="Vendor" value={vendor?.name || 'Unknown Vendor'} />
            <InfoPair
              label="Amount"
              value={`Rs. ${Number(
                quotation?.total_amount || 0
              ).toLocaleString('en-IN')}`}
            />
            <InfoPair
              label="Delivery"
              value={
                quotation?.delivery_days
                  ? `${quotation.delivery_days} days`
                  : '-'
              }
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm">
          <p className="text-slate-500">Requested</p>
          <p className="font-medium text-white">
            {formatDateTime(request.requested_at)}
          </p>
        </div>
      </div>

      <WorkflowTimeline request={request} />

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-slate-700 bg-slate-900/45 p-4">
          <div className="mb-3 flex items-center gap-2">
            <FileText className="size-4 text-blue-400" />
            <h3 className="font-semibold text-white">Decision Summary</h3>
          </div>
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <InfoPair label="Category" value={rfq?.category || '-'} />
            <InfoPair
              label="RFQ Status"
              value={rfq?.status ? titleCase(rfq.status) : '-'}
            />
            <InfoPair
              label="Quotation Status"
              value={quotation?.status ? titleCase(quotation.status) : '-'}
            />
            <InfoPair
              label="Vendor Rating"
              value={
                vendor?.rating != null
                  ? Number(vendor.rating).toFixed(1)
                  : '-'
              }
            />
            <InfoPair
              label="Valid Until"
              value={
                quotation?.valid_until
                  ? new Date(quotation.valid_until).toLocaleDateString()
                  : '-'
              }
            />
            <InfoPair
              label="Completed"
              value={
                request.completed_at ? formatDateTime(request.completed_at) : '-'
              }
            />
          </div>
          {request.final_remarks && (
            <div className="mt-4 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300">
              <span className="text-slate-500">Final remarks:</span>{' '}
              {request.final_remarks}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-900/45 p-4">
          <div className="mb-3 flex items-center gap-2">
            <MessageSquareText className="size-4 text-green-400" />
            <h3 className="font-semibold text-white">Approval Remarks</h3>
          </div>
          {isPending ? (
            <>
              <Textarea
                value={remarks}
                onChange={(event) => onRemarksChange(event.target.value)}
                placeholder="Add manager remarks for the procurement audit trail."
                className="min-h-24 resize-none border-slate-600 bg-slate-800 text-white placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
              />
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => onDecision('approved')}
                  className="flex-1 bg-green-600 text-white hover:bg-green-700"
                >
                  <CheckCircle2 className="mr-2 size-4" />
                  {isUpdating ? 'Saving...' : 'Approve'}
                </Button>
                <Button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => onDecision('rejected')}
                  className="flex-1 bg-red-600 text-white hover:bg-red-700"
                >
                  <XCircle className="mr-2 size-4" />
                  {isUpdating ? 'Saving...' : 'Reject'}
                </Button>
              </div>
            </>
          ) : (
            <p className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300">
              {request.final_remarks || 'No remarks recorded.'}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

function WorkflowTimeline({ request }: { request: ApprovalRequestWithDetails }) {
  const managerStep = request.approval_steps.find(
    (step) => step.step_order === request.current_step
  )
  const managerStatus = managerStep?.status || 'pending'

  const steps = [
    {
      label: 'Quotation Selected',
      detail: formatDateTime(request.requested_at),
      state: 'completed',
      icon: FileText,
    },
    {
      label: 'Manager Review',
      detail:
        managerStep?.action_at ||
        managerStep?.due_at ||
        'Awaiting decision',
      state:
        managerStatus === 'pending'
          ? 'current'
          : managerStatus === 'rejected'
            ? 'rejected'
            : 'completed',
      icon: Route,
    },
    {
      label: 'Approval Decision',
      detail:
        request.status === 'pending'
          ? 'Pending'
          : approvalStatusLabels[request.status],
      state:
        request.status === 'rejected'
          ? 'rejected'
          : request.status === 'approved'
            ? 'completed'
            : 'pending',
      icon: request.status === 'rejected' ? XCircle : CheckCircle2,
    },
    {
      label: 'Generate PO',
      detail:
        request.status === 'approved'
          ? 'Ready for procurement officer'
          : 'Locked until approval',
      state: request.status === 'approved' ? 'current' : 'pending',
      icon: PackageCheck,
    },
  ]

  return (
    <div className="grid gap-3 md:grid-cols-4">
      {steps.map((step) => {
        const Icon = step.icon
        const colors = getTimelineColors(step.state)

        return (
          <div
            key={step.label}
            className={`rounded-lg border p-4 ${colors.container}`}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className={`rounded-full p-2 ${colors.icon}`}>
                <Icon className="size-4" />
              </span>
              <p className="font-medium text-white">{step.label}</p>
            </div>
            <p className="text-xs text-slate-400">
              {looksLikeDate(step.detail) ? formatDateTime(step.detail) : step.detail}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string
  value: string | number
  icon: React.ReactElement
}) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">{title}</h3>
        {icon}
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: ApprovalRequestStatus }) {
  const colors: Record<ApprovalRequestStatus, string> = {
    pending: 'border-yellow-700 bg-yellow-900/30 text-yellow-400',
    approved: 'border-green-700 bg-green-900/30 text-green-400',
    rejected: 'border-red-700 bg-red-900/30 text-red-400',
    cancelled: 'border-slate-600 bg-slate-700/30 text-slate-400',
  }

  return (
    <span
      className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${colors[status]}`}
    >
      {approvalStatusLabels[status]}
    </span>
  )
}

function InfoPair({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="text-slate-300">
      <span className="text-slate-500">{label}:</span> {value}
    </span>
  )
}

function getTimelineColors(state: string) {
  switch (state) {
    case 'completed':
      return {
        container: 'border-green-700 bg-green-900/20',
        icon: 'bg-green-500/15 text-green-400',
      }
    case 'current':
      return {
        container: 'border-blue-700 bg-blue-900/20',
        icon: 'bg-blue-500/15 text-blue-400',
      }
    case 'rejected':
      return {
        container: 'border-red-700 bg-red-900/20',
        icon: 'bg-red-500/15 text-red-400',
      }
    default:
      return {
        container: 'border-slate-700 bg-slate-900/45',
        icon: 'bg-slate-700 text-slate-400',
      }
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function looksLikeDate(value: string) {
  return !Number.isNaN(Date.parse(value))
}

function titleCase(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

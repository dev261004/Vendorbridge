'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CalendarDays,
  Clock,
  Eye,
  FileText,
  Package,
  Pencil,
  Search,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import QuotationSubmissionModal from '@/components/QuotationSubmissionModal'
import {
  getQuotationAccess,
  getQuotations,
  getVendorQuotationOpportunities,
} from '@/app/actions/quotations'
import {
  QuotationStatus,
  QuotationWithDetails,
  VendorQuotationOpportunity,
  quotationStatusLabels,
} from '@/lib/quotations'

type QuotationMode = 'vendor' | 'procurement' | 'blocked'

const today = new Date().toISOString().slice(0, 10)

export default function QuotationsPage() {
  const [mode, setMode] = useState<QuotationMode>('blocked')
  const [opportunities, setOpportunities] = useState<VendorQuotationOpportunity[]>([])
  const [quotations, setQuotations] = useState<QuotationWithDetails[]>([])
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<VendorQuotationOpportunity | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadQuotationData()
  }, [])

  const loadQuotationData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const access = await getQuotationAccess()

      if (access.canSubmit) {
        const data = await getVendorQuotationOpportunities()
        setOpportunities(data)
        setQuotations([])
        setMode('vendor')
      } else if (access.canCompare) {
        const data = await getQuotations()
        setQuotations(data.filter((quotation) => quotation.status !== 'draft'))
        setOpportunities([])
        setMode('procurement')
      } else {
        setMode('blocked')
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to load quotations.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const filteredOpportunities = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) return opportunities

    return opportunities.filter((opportunity) =>
      [
        opportunity.rfq.title,
        opportunity.rfq.rfq_number,
        opportunity.rfq.category,
        opportunity.quotation?.quotation_number,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query))
    )
  }, [opportunities, searchQuery])

  const filteredQuotations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) return quotations

    return quotations.filter((quotation) =>
      [
        quotation.quotation_number,
        quotation.rfqs?.title,
        quotation.rfqs?.rfq_number,
        quotation.vendors?.name,
        quotation.vendors?.category,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query))
    )
  }, [quotations, searchQuery])

  const vendorStats = useMemo(
    () => ({
      assigned: opportunities.length,
      drafts: opportunities.filter(
        (opportunity) => opportunity.quotation?.status === 'draft'
      ).length,
      submitted: opportunities.filter(
        (opportunity) => opportunity.quotation?.status === 'submitted'
      ).length,
      pending: opportunities.filter((opportunity) => !opportunity.quotation).length,
    }),
    [opportunities]
  )

  const procurementStats = useMemo(
    () => ({
      total: quotations.length,
      submitted: quotations.filter((quotation) => quotation.status === 'submitted')
        .length,
      underReview: quotations.filter(
        (quotation) => quotation.status === 'under_review'
      ).length,
      selected: quotations.filter((quotation) =>
        ['selected', 'accepted'].includes(quotation.status)
      ).length,
    }),
    [quotations]
  )

  const handleOpenSubmission = (opportunity: VendorQuotationOpportunity) => {
    setSelectedOpportunity(opportunity)
    setIsModalOpen(true)
    setSuccess(null)
  }

  const handleCloseModal = (message?: string) => {
    setIsModalOpen(false)
    setSelectedOpportunity(null)

    if (message) {
      setSuccess(message)
    }

    loadQuotationData()
  }

  const isOpportunityClosed = (opportunity: VendorQuotationOpportunity) =>
    opportunity.rfq.status !== 'published' || opportunity.rfq.deadline < today

  const getOpportunityAction = (opportunity: VendorQuotationOpportunity) => {
    if (isOpportunityClosed(opportunity)) return 'Closed'
    if (!opportunity.quotation) return 'Submit Quotation'
    if (opportunity.quotation.status === 'draft') return 'Edit Draft'
    if (opportunity.quotation.status === 'submitted') return 'Edit Submitted'
    return 'View'
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-white">Quotations</h1>
          <p className="text-slate-400">
            {mode === 'vendor'
              ? 'Respond to assigned RFQs with pricing, delivery timelines, and comments.'
              : mode === 'procurement'
                ? 'Compare submitted vendor quotations for procurement decisions.'
                : 'This module is available to vendors and procurement officers.'}
          </p>
        </div>
        <Button
          onClick={loadQuotationData}
          className="w-fit bg-slate-700 text-white hover:bg-slate-600"
        >
          Refresh
        </Button>
      </div>

      {mode === 'vendor' ? (
        <StatsGrid
          items={[
            { label: 'Assigned RFQs', value: vendorStats.assigned, icon: FileText },
            { label: 'Pending Response', value: vendorStats.pending, icon: Clock },
            { label: 'Drafts', value: vendorStats.drafts, icon: Pencil },
            { label: 'Submitted', value: vendorStats.submitted, icon: Send },
          ]}
        />
      ) : (
        <StatsGrid
          items={[
            { label: 'Total Quotations', value: procurementStats.total, icon: Package },
            { label: 'Submitted', value: procurementStats.submitted, icon: Send },
            { label: 'Under Review', value: procurementStats.underReview, icon: Clock },
            { label: 'Selected', value: procurementStats.selected, icon: FileText },
          ]}
        />
      )}

      <div className="mb-6 rounded-lg border border-slate-700 bg-slate-800 p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={
              mode === 'vendor'
                ? 'Search assigned RFQs...'
                : 'Search by quotation, RFQ, vendor...'
            }
            className="border-slate-600 bg-slate-700 pl-9 text-white placeholder:text-slate-500"
          />
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
          Loading quotations...
        </div>
      ) : mode === 'vendor' ? (
        <VendorOpportunityList
          opportunities={filteredOpportunities}
          isOpportunityClosed={isOpportunityClosed}
          getOpportunityAction={getOpportunityAction}
          onOpenSubmission={handleOpenSubmission}
        />
      ) : mode === 'procurement' ? (
        <ProcurementQuotationList quotations={filteredQuotations} />
      ) : (
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 text-center text-slate-400">
          You do not have access to quotation workflows.
        </div>
      )}

      <QuotationSubmissionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        opportunity={selectedOpportunity}
      />
    </div>
  )
}

function VendorOpportunityList({
  opportunities,
  isOpportunityClosed,
  getOpportunityAction,
  onOpenSubmission,
}: {
  opportunities: VendorQuotationOpportunity[]
  isOpportunityClosed: (opportunity: VendorQuotationOpportunity) => boolean
  getOpportunityAction: (opportunity: VendorQuotationOpportunity) => string
  onOpenSubmission: (opportunity: VendorQuotationOpportunity) => void
}) {
  if (opportunities.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 text-center text-slate-400">
        No assigned RFQs found.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {opportunities.map((opportunity) => {
        const closed = isOpportunityClosed(opportunity)
        const quotation = opportunity.quotation

        return (
          <div
            key={opportunity.invitation_id}
            className="rounded-lg border border-slate-700 bg-slate-800 p-6 transition-colors hover:border-slate-600"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-white">
                    {opportunity.rfq.title}
                  </h3>
                  <StatusBadge status={quotation?.status || 'pending'} />
                </div>
                <p className="mb-3 text-sm text-slate-400">
                  {opportunity.rfq.description || 'No description added'}
                </p>
                <div className="flex flex-wrap gap-5 text-sm">
                  <span className="text-slate-300">
                    <span className="text-slate-500">RFQ:</span>{' '}
                    {opportunity.rfq.rfq_number}
                  </span>
                  <span className="text-slate-300">
                    <span className="text-slate-500">Category:</span>{' '}
                    {opportunity.rfq.category}
                  </span>
                  <span className="text-slate-300">
                    <span className="text-slate-500">Items:</span>{' '}
                    {opportunity.rfq.rfq_items.length}
                  </span>
                  <span className="text-slate-300">
                    <span className="text-slate-500">Deadline:</span>{' '}
                    {new Date(opportunity.rfq.deadline).toLocaleDateString()}
                  </span>
                  {quotation && (
                    <span className="text-slate-300">
                      <span className="text-slate-500">Total:</span> Rs.{' '}
                      {Number(quotation.total_amount || 0).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {quotation && (
                  <Link href={`/dashboard/quotations/${quotation.id}`}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-blue-400 hover:bg-blue-900/20 hover:text-blue-300"
                    >
                      <Eye className="mr-2 size-4" />
                      View
                    </Button>
                  </Link>
                )}
                <Button
                  size="sm"
                  disabled={closed}
                  onClick={() => onOpenSubmission(opportunity)}
                  className="bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {getOpportunityAction(opportunity)}
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ProcurementQuotationList({
  quotations,
}: {
  quotations: QuotationWithDetails[]
}) {
  if (quotations.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 text-center text-slate-400">
        No submitted quotations found.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {quotations.map((quotation) => (
        <div
          key={quotation.id}
          className="rounded-lg border border-slate-700 bg-slate-800 p-6 transition-colors hover:border-slate-600"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-semibold text-white">
                  {quotation.vendors?.name || 'Unknown Vendor'}
                </h3>
                <StatusBadge status={quotation.status} />
              </div>
              <p className="mb-3 text-sm text-slate-400">
                {quotation.rfqs?.title || 'RFQ'} - {quotation.quotation_number}
              </p>
              <div className="flex flex-wrap gap-5 text-sm">
                <span className="text-slate-300">
                  <span className="text-slate-500">RFQ:</span>{' '}
                  {quotation.rfqs?.rfq_number || '-'}
                </span>
                <span className="text-slate-300">
                  <span className="text-slate-500">Total:</span> Rs.{' '}
                  {Number(quotation.total_amount || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-slate-300">
                  <span className="text-slate-500">Delivery:</span>{' '}
                  {quotation.delivery_days || '-'} days
                </span>
                <span className="text-slate-300">
                  <span className="text-slate-500">Valid Until:</span>{' '}
                  {quotation.valid_until
                    ? new Date(quotation.valid_until).toLocaleDateString()
                    : '-'}
                </span>
              </div>
            </div>
            <Link href={`/dashboard/quotations/${quotation.id}`}>
              <Button
                size="sm"
                variant="ghost"
                className="text-blue-400 hover:bg-blue-900/20 hover:text-blue-300"
              >
                <Eye className="mr-2 size-4" />
                View
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}

function StatsGrid({
  items,
}: {
  items: Array<{
    label: string
    value: number
    icon: React.ComponentType<{ className?: string }>
  }>
}) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon

        return (
          <div
            key={item.label}
            className="rounded-lg border border-slate-700 bg-slate-800 p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-300">{item.label}</h3>
              <Icon className="size-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-white">{item.value}</p>
          </div>
        )
      })}
    </div>
  )
}

function StatusBadge({ status }: { status: QuotationStatus | 'pending' }) {
  const colors: Record<QuotationStatus | 'pending', string> = {
    pending: 'border-slate-600 bg-slate-700/30 text-slate-300',
    draft: 'border-yellow-700 bg-yellow-900/30 text-yellow-400',
    submitted: 'border-blue-700 bg-blue-900/30 text-blue-400',
    under_review: 'border-purple-700 bg-purple-900/30 text-purple-300',
    selected: 'border-green-700 bg-green-900/30 text-green-400',
    accepted: 'border-green-700 bg-green-900/30 text-green-400',
    rejected: 'border-red-700 bg-red-900/30 text-red-400',
    expired: 'border-slate-600 bg-slate-700/30 text-slate-400',
  }

  return (
    <span
      className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${colors[status]}`}
    >
      {status === 'pending' ? 'Pending' : quotationStatusLabels[status]}
    </span>
  )
}

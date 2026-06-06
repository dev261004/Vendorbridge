'use client'

import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react'
import Link from 'next/link'
import {
  ArrowDownUp,
  CalendarDays,
  Clock,
  Eye,
  FileText,
  Package,
  Pencil,
  Search,
  Send,
  SlidersHorizontal,
  Star,
  Trophy,
  Truck,
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
type QuotationSortOption =
  | 'lowest_price'
  | 'fastest_delivery'
  | 'highest_rating'
  | 'latest'
  | 'vendor_name'
type QuotationFilterStatus = QuotationStatus | 'all'
type QuotationLineItem = QuotationWithDetails['quotation_items'][number]

const today = new Date().toISOString().slice(0, 10)
const selectClassName =
  'h-10 w-full rounded-lg border border-slate-600 bg-slate-700 px-3 text-sm text-white outline-none focus-visible:border-blue-500'
const nativeOptionStyle = {
  backgroundColor: '#0f172a',
  color: '#f8fafc',
}

export default function QuotationsPage() {
  const [mode, setMode] = useState<QuotationMode>('blocked')
  const [opportunities, setOpportunities] = useState<VendorQuotationOpportunity[]>([])
  const [quotations, setQuotations] = useState<QuotationWithDetails[]>([])
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<VendorQuotationOpportunity | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRFQId, setSelectedRFQId] = useState('all')
  const [statusFilter, setStatusFilter] = useState<QuotationFilterStatus>('all')
  const [sortOption, setSortOption] =
    useState<QuotationSortOption>('lowest_price')
  const [minRating, setMinRating] = useState('0')
  const [maxDeliveryDays, setMaxDeliveryDays] = useState('')
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

  const rfqOptions = useMemo(() => {
    const options = new Map<string, { id: string; label: string }>()

    quotations.forEach((quotation) => {
      if (!quotation.rfqs?.id) return

      options.set(quotation.rfqs.id, {
        id: quotation.rfqs.id,
        label: `${quotation.rfqs.rfq_number} - ${quotation.rfqs.title}`,
      })
    })

    return Array.from(options.values()).sort((a, b) =>
      a.label.localeCompare(b.label)
    )
  }, [quotations])

  const filteredQuotations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const minRatingValue = Number(minRating || 0)
    const maxDeliveryValue = Number(maxDeliveryDays || 0)

    const filtered = quotations.filter((quotation) => {
      const matchesSearch =
        !query ||
        [
          quotation.quotation_number,
          quotation.rfqs?.title,
          quotation.rfqs?.rfq_number,
          quotation.vendors?.name,
          quotation.vendors?.category,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query))
      const matchesRFQ =
        selectedRFQId === 'all' || quotation.rfq_id === selectedRFQId
      const matchesStatus =
        statusFilter === 'all' || quotation.status === statusFilter
      const matchesRating = Number(quotation.vendors?.rating || 0) >= minRatingValue
      const matchesDelivery =
        !maxDeliveryValue ||
        (Number(quotation.delivery_days || 0) > 0 &&
          Number(quotation.delivery_days || 0) <= maxDeliveryValue)

      return (
        matchesSearch &&
        matchesRFQ &&
        matchesStatus &&
        matchesRating &&
        matchesDelivery
      )
    })

    return filtered.sort((a, b) => {
      switch (sortOption) {
        case 'fastest_delivery':
          return Number(a.delivery_days || 999999) - Number(b.delivery_days || 999999)
        case 'highest_rating':
          return Number(b.vendors?.rating || 0) - Number(a.vendors?.rating || 0)
        case 'latest':
          return b.created_at.localeCompare(a.created_at)
        case 'vendor_name':
          return (a.vendors?.name || '').localeCompare(b.vendors?.name || '')
        case 'lowest_price':
        default:
          return Number(a.total_amount || 0) - Number(b.total_amount || 0)
      }
    })
  }, [
    maxDeliveryDays,
    minRating,
    quotations,
    searchQuery,
    selectedRFQId,
    sortOption,
    statusFilter,
  ])

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
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
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

          {mode === 'procurement' && (
            <>
              <FilterField label="RFQ">
                <select
                  value={selectedRFQId}
                  onChange={(event) => setSelectedRFQId(event.target.value)}
                  className={selectClassName}
                >
                  <option value="all" style={nativeOptionStyle}>
                    All RFQs
                  </option>
                  {rfqOptions.map((rfq) => (
                    <option key={rfq.id} value={rfq.id} style={nativeOptionStyle}>
                      {rfq.label}
                    </option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Status">
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as QuotationFilterStatus)
                  }
                  className={selectClassName}
                >
                  <option value="all" style={nativeOptionStyle}>
                    All statuses
                  </option>
                  {(
                    [
                      'submitted',
                      'under_review',
                      'selected',
                      'accepted',
                      'rejected',
                      'expired',
                    ] as QuotationStatus[]
                  ).map((status) => (
                    <option key={status} value={status} style={nativeOptionStyle}>
                      {quotationStatusLabels[status]}
                    </option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Sort">
                <select
                  value={sortOption}
                  onChange={(event) =>
                    setSortOption(event.target.value as QuotationSortOption)
                  }
                  className={selectClassName}
                >
                  <option value="lowest_price" style={nativeOptionStyle}>
                    Lowest price
                  </option>
                  <option value="fastest_delivery" style={nativeOptionStyle}>
                    Fastest delivery
                  </option>
                  <option value="highest_rating" style={nativeOptionStyle}>
                    Highest rating
                  </option>
                  <option value="latest" style={nativeOptionStyle}>
                    Latest submitted
                  </option>
                  <option value="vendor_name" style={nativeOptionStyle}>
                    Vendor name
                  </option>
                </select>
              </FilterField>
            </>
          )}
        </div>

        {mode === 'procurement' && (
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <FilterField label="Minimum Rating">
              <select
                value={minRating}
                onChange={(event) => setMinRating(event.target.value)}
                className={selectClassName}
              >
                <option value="0" style={nativeOptionStyle}>
                  Any rating
                </option>
                <option value="3" style={nativeOptionStyle}>
                  3.0+
                </option>
                <option value="4" style={nativeOptionStyle}>
                  4.0+
                </option>
                <option value="4.5" style={nativeOptionStyle}>
                  4.5+
                </option>
              </select>
            </FilterField>

            <FilterField label="Max Delivery Days">
              <Input
                type="number"
                min="1"
                value={maxDeliveryDays}
                onChange={(event) => setMaxDeliveryDays(event.target.value)}
                placeholder="No limit"
                className="border-slate-600 bg-slate-700 text-white placeholder:text-slate-500"
              />
            </FilterField>

            <Button
              type="button"
              onClick={() => {
                setSelectedRFQId('all')
                setStatusFilter('all')
                setSortOption('lowest_price')
                setMinRating('0')
                setMaxDeliveryDays('')
                setSearchQuery('')
              }}
              className="self-end bg-slate-700 text-white hover:bg-slate-600"
            >
              <SlidersHorizontal className="mr-2 size-4" />
              Reset
            </Button>
          </div>
        )}
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
        <ProcurementComparisonBoard quotations={filteredQuotations} />
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

interface QuotationComparisonGroupData {
  rfqId: string
  rfq: QuotationWithDetails['rfqs']
  quotations: QuotationWithDetails[]
}

function ProcurementComparisonBoard({
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

  const groups = groupQuotationsByRFQ(quotations)

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <QuotationComparisonSection key={group.rfqId} group={group} />
      ))}
    </div>
  )
}

function QuotationComparisonSection({
  group,
}: {
  group: QuotationComparisonGroupData
}) {
  const gridTemplateColumns = `220px repeat(${group.quotations.length}, minmax(240px, 1fr))`
  const lowestTotal = getLowestValue(group.quotations, (quotation) =>
    Number(quotation.total_amount || 0)
  )
  const fastestDelivery = getLowestValue(
    group.quotations.filter((quotation) => Number(quotation.delivery_days || 0) > 0),
    (quotation) => Number(quotation.delivery_days || 0)
  )
  const highestRating = Math.max(
    ...group.quotations.map((quotation) => Number(quotation.vendors?.rating || 0))
  )
  const lineItems = getComparisonLineItems(group.quotations)

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-800">
      <div className="border-b border-slate-700 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold text-white">
                {group.rfq?.title || 'RFQ Comparison'}
              </h2>
              <span className="rounded-full border border-blue-700 bg-blue-900/30 px-3 py-1 text-xs font-medium text-blue-300">
                {group.quotations.length} quote(s)
              </span>
            </div>
            <div className="flex flex-wrap gap-5 text-sm text-slate-300">
              <span>{group.rfq?.rfq_number || 'RFQ'}</span>
              <span>{group.rfq?.category || 'Uncategorized'}</span>
              <span className="flex items-center gap-2">
                <CalendarDays className="size-4 text-slate-500" />
                Deadline: {formatDate(group.rfq?.deadline)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-green-700 bg-green-900/20 px-3 py-2 text-sm text-green-300">
            <Trophy className="size-4" />
            Lowest: {formatCurrency(lowestTotal)}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div
          className="grid min-w-[760px]"
          style={{ gridTemplateColumns }}
        >
          <MatrixLabel>Criteria</MatrixLabel>
          {group.quotations.map((quotation) => {
            const isLowest =
              Number(quotation.total_amount || 0) === lowestTotal && lowestTotal > 0
            const isFastest =
              Number(quotation.delivery_days || 0) === fastestDelivery &&
              fastestDelivery > 0

            return (
              <MatrixCell key={quotation.id} emphasis={isLowest}>
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">
                        {quotation.vendors?.name || 'Unknown Vendor'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {quotation.quotation_number}
                      </p>
                    </div>
                    <Link href={`/dashboard/quotations/${quotation.id}`}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-blue-400 hover:bg-blue-900/20 hover:text-blue-300"
                      >
                        <Eye className="size-4" />
                      </Button>
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {isLowest && (
                      <MiniBadge tone="green" label="Lowest price" />
                    )}
                    {isFastest && (
                      <MiniBadge tone="blue" label="Fastest delivery" />
                    )}
                  </div>
                </div>
              </MatrixCell>
            )
          })}

          <ComparisonRow
            label="Total Price"
            quotations={group.quotations}
            render={(quotation) => formatCurrency(Number(quotation.total_amount || 0))}
            isHighlighted={(quotation) =>
              Number(quotation.total_amount || 0) === lowestTotal && lowestTotal > 0
            }
          />
          <ComparisonRow
            label="Subtotal"
            quotations={group.quotations}
            render={(quotation) => formatCurrency(Number(quotation.subtotal || 0))}
          />
          <ComparisonRow
            label="GST"
            quotations={group.quotations}
            render={(quotation) =>
              `${Number(quotation.gst_percent || 0)}% (${formatCurrency(
                Number(quotation.gst_amount || 0)
              )})`
            }
          />
          <ComparisonRow
            label="Delivery Timeline"
            quotations={group.quotations}
            render={(quotation) => `${quotation.delivery_days || '-'} days`}
            isHighlighted={(quotation) =>
              Number(quotation.delivery_days || 0) === fastestDelivery &&
              fastestDelivery > 0
            }
            icon={<Truck className="size-4 text-slate-500" />}
          />
          <ComparisonRow
            label="Vendor Rating"
            quotations={group.quotations}
            renderNode={(quotation) => (
              <RatingIndicator rating={Number(quotation.vendors?.rating || 0)} />
            )}
            isHighlighted={(quotation) =>
              Number(quotation.vendors?.rating || 0) === highestRating &&
              highestRating > 0
            }
          />
          <ComparisonRow
            label="Valid Until"
            quotations={group.quotations}
            render={(quotation) => formatDate(quotation.valid_until)}
          />
          <ComparisonRow
            label="Status"
            quotations={group.quotations}
            renderNode={(quotation) => <StatusBadge status={quotation.status} />}
          />
          <ComparisonRow
            label="Payment Terms"
            quotations={group.quotations}
            render={(quotation) => quotation.payment_terms || '-'}
          />
          <ComparisonRow
            label="Notes"
            quotations={group.quotations}
            render={(quotation) => quotation.notes || '-'}
            wrap
          />
        </div>
      </div>

      {lineItems.length > 0 && (
        <div className="border-t border-slate-700 p-5">
          <div className="mb-4 flex items-center gap-2">
            <ArrowDownUp className="size-5 text-blue-400" />
            <h3 className="font-semibold text-white">Line Item Pricing</h3>
          </div>
          <div className="overflow-x-auto">
            <div
              className="grid min-w-[760px]"
              style={{ gridTemplateColumns }}
            >
              <MatrixLabel>Item</MatrixLabel>
              {group.quotations.map((quotation) => (
                <MatrixLabel key={quotation.id}>
                  {quotation.vendors?.name || quotation.quotation_number}
                </MatrixLabel>
              ))}

              {lineItems.map((lineItem) => {
                const lowestLineTotal = getLowestLineItemTotal(
                  group.quotations,
                  lineItem.key
                )

                return (
                  <LineItemComparisonRow
                    key={lineItem.key}
                    itemKey={lineItem.key}
                    label={lineItem.label}
                    quotations={group.quotations}
                    lowestLineTotal={lowestLineTotal}
                  />
                )
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function FilterField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-400">
        {label}
      </span>
      {children}
    </label>
  )
}

function MatrixLabel({ children }: { children: ReactNode }) {
  return (
    <div className="border-b border-r border-slate-700 bg-slate-900/60 p-4 text-sm font-semibold text-slate-300">
      {children}
    </div>
  )
}

function MatrixCell({
  children,
  emphasis = false,
  wrap = false,
}: {
  children: ReactNode
  emphasis?: boolean
  wrap?: boolean
}) {
  return (
    <div
      className={`border-b border-r border-slate-700 p-4 text-sm ${
        emphasis
          ? 'bg-green-900/20 text-green-100 ring-1 ring-inset ring-green-700/50'
          : 'bg-slate-800 text-slate-200'
      } ${wrap ? 'whitespace-normal break-words' : ''}`}
    >
      {children}
    </div>
  )
}

function MiniBadge({
  tone,
  label,
}: {
  tone: 'blue' | 'green'
  label: string
}) {
  const classes = {
    blue: 'border-blue-700 bg-blue-900/30 text-blue-300',
    green: 'border-green-700 bg-green-900/30 text-green-300',
  }

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${classes[tone]}`}
    >
      {label}
    </span>
  )
}

function ComparisonRow({
  label,
  quotations,
  render,
  renderNode,
  isHighlighted,
  icon,
  wrap = false,
}: {
  label: string
  quotations: QuotationWithDetails[]
  render?: (quotation: QuotationWithDetails) => string
  renderNode?: (quotation: QuotationWithDetails) => ReactNode
  isHighlighted?: (quotation: QuotationWithDetails) => boolean
  icon?: ReactNode
  wrap?: boolean
}) {
  return (
    <>
      <MatrixLabel>
        <span className="flex items-center gap-2">
          {icon}
          {label}
        </span>
      </MatrixLabel>
      {quotations.map((quotation) => (
        <MatrixCell
          key={`${label}-${quotation.id}`}
          emphasis={Boolean(isHighlighted?.(quotation))}
          wrap={wrap}
        >
          {renderNode ? renderNode(quotation) : render?.(quotation) || '-'}
        </MatrixCell>
      ))}
    </>
  )
}

function RatingIndicator({ rating }: { rating: number }) {
  const normalizedRating = Math.max(0, Math.min(5, rating))
  const filledStars = Math.round(normalizedRating)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={`size-4 ${
              index < filledStars
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-slate-600'
            }`}
          />
        ))}
      </div>
      <span className="text-sm text-slate-300">
        {normalizedRating > 0 ? normalizedRating.toFixed(1) : 'No rating'}
      </span>
    </div>
  )
}

function LineItemComparisonRow({
  itemKey,
  label,
  quotations,
  lowestLineTotal,
}: {
  itemKey: string
  label: string
  quotations: QuotationWithDetails[]
  lowestLineTotal: number
}) {
  return (
    <>
      <MatrixLabel>{label}</MatrixLabel>
      {quotations.map((quotation) => {
        const item = findLineItem(quotation, itemKey)

        if (!item) {
          return (
            <MatrixCell key={`${quotation.id}-${itemKey}`}>
              <span className="text-slate-500">Not quoted</span>
            </MatrixCell>
          )
        }

        const itemTotal = Number(item.total_price || 0)
        const isLowest = itemTotal === lowestLineTotal && lowestLineTotal > 0

        return (
          <MatrixCell
            key={`${quotation.id}-${itemKey}`}
            emphasis={isLowest}
            wrap
          >
            <div className="space-y-1.5">
              <p className="font-semibold">{formatCurrency(itemTotal)}</p>
              <p className="text-xs text-slate-400">
                {formatCurrency(Number(item.unit_price || 0))} / {item.unit}
              </p>
              <p className="text-xs text-slate-500">
                Qty {Number(item.quantity || 0).toLocaleString('en-IN')}{' '}
                {item.unit}
                {item.delivery_days ? `, ${item.delivery_days} days` : ''}
              </p>
              {item.notes && (
                <p className="text-xs text-slate-400">{item.notes}</p>
              )}
            </div>
          </MatrixCell>
        )
      })}
    </>
  )
}

function StatsGrid({
  items,
}: {
  items: Array<{
    label: string
    value: number
    icon: ComponentType<{ className?: string }>
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

function groupQuotationsByRFQ(
  quotations: QuotationWithDetails[]
): QuotationComparisonGroupData[] {
  const groups = new Map<string, QuotationComparisonGroupData>()

  quotations.forEach((quotation) => {
    const rfqId = quotation.rfq_id || 'unknown-rfq'

    if (!groups.has(rfqId)) {
      groups.set(rfqId, {
        rfqId,
        rfq: quotation.rfqs,
        quotations: [],
      })
    }

    groups.get(rfqId)!.quotations.push(quotation)
  })

  return Array.from(groups.values()).sort((a, b) =>
    (a.rfq?.rfq_number || '').localeCompare(b.rfq?.rfq_number || '')
  )
}

function getLowestValue(
  quotations: QuotationWithDetails[],
  getValue: (quotation: QuotationWithDetails) => number
) {
  const values = quotations
    .map(getValue)
    .filter((value) => Number.isFinite(value) && value > 0)

  return values.length > 0 ? Math.min(...values) : 0
}

function getComparisonLineItems(quotations: QuotationWithDetails[]) {
  const items = new Map<string, { key: string; label: string }>()

  quotations.forEach((quotation) => {
    quotation.quotation_items.forEach((item) => {
      const key = getLineItemKey(item)

      if (!items.has(key)) {
        items.set(key, {
          key,
          label: `${item.item_name} (${Number(item.quantity || 0).toLocaleString(
            'en-IN'
          )} ${item.unit})`,
        })
      }
    })
  })

  return Array.from(items.values()).sort((a, b) =>
    a.label.localeCompare(b.label)
  )
}

function getLowestLineItemTotal(
  quotations: QuotationWithDetails[],
  itemKey: string
) {
  const values = quotations
    .map((quotation) => findLineItem(quotation, itemKey))
    .filter((item): item is QuotationLineItem => Boolean(item))
    .map((item) => Number(item.total_price || 0))
    .filter((value) => Number.isFinite(value) && value > 0)

  return values.length > 0 ? Math.min(...values) : 0
}

function findLineItem(quotation: QuotationWithDetails, itemKey: string) {
  return quotation.quotation_items.find((item) => getLineItemKey(item) === itemKey)
}

function getLineItemKey(item: QuotationLineItem) {
  return item.rfq_item_id || item.item_name.trim().toLowerCase()
}

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) return 'Rs. 0'

  return `Rs. ${value.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`
}

function formatDate(value?: string | null) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
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

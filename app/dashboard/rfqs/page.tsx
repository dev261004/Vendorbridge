'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, Eye, FileText, Pencil, Plus, Search, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import RFQModal from '@/components/RFQModal'
import { getRFQAccess, getRFQs, updateRFQStatus } from '@/app/actions/rfqs'
import {
  RFQStatus,
  RFQStatusFilter,
  RFQWithDetails,
  rfqStatusLabels,
  rfqStatuses,
} from '@/lib/rfqs'

export default function RFQsPage() {
  const [rfqs, setRFQs] = useState<RFQWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRFQ, setSelectedRFQ] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<RFQStatusFilter>('all')
  const [error, setError] = useState<string | null>(null)
  const [canManageRFQs, setCanManageRFQs] = useState(false)

  useEffect(() => {
    loadRFQData()
  }, [])

  const loadRFQData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const [rfqData, access] = await Promise.all([
        getRFQs(),
        getRFQAccess(),
      ])
      setRFQs(rfqData)
      setCanManageRFQs(access.canManage)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load RFQs.')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredRFQs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return rfqs.filter((rfq) => {
      const matchesStatus = statusFilter === 'all' || rfq.status === statusFilter
      const matchesSearch =
        !query ||
        [rfq.title, rfq.category, rfq.rfq_number, rfq.description]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query))

      return matchesStatus && matchesSearch
    })
  }, [rfqs, searchQuery, statusFilter])

  const stats = useMemo(
    () => ({
      total: rfqs.length,
      published: rfqs.filter((rfq) => rfq.status === 'published').length,
      draft: rfqs.filter((rfq) => rfq.status === 'draft').length,
      closed: rfqs.filter((rfq) => rfq.status === 'closed').length,
    }),
    [rfqs]
  )

  const getStatusCount = (status: RFQStatusFilter) => {
    if (status === 'all') return rfqs.length
    return rfqs.filter((rfq) => rfq.status === status).length
  }

  const handleAddRFQ = () => {
    if (!canManageRFQs) {
      setError('Only procurement officers can create RFQs.')
      return
    }

    setSelectedRFQ(null)
    setIsModalOpen(true)
  }

  const handleEditRFQ = (rfqId: string) => {
    if (!canManageRFQs) {
      setError('Only procurement officers can edit RFQs.')
      return
    }

    setSelectedRFQ(rfqId)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedRFQ(null)
    loadRFQData()
  }

  const handleStatusChange = async (rfqId: string, status: RFQStatus) => {
    if (!canManageRFQs) {
      setError('Only procurement officers can update RFQ status.')
      return
    }

    if (!window.confirm(`Change this RFQ status to ${rfqStatusLabels[status]}?`)) {
      return
    }

    try {
      const updatedRFQ = await updateRFQStatus(rfqId, status)
      setRFQs((current) =>
        current.map((rfq) =>
          rfq.id === updatedRFQ.id ? { ...rfq, ...updatedRFQ } : rfq
        )
      )
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to update RFQ status.'
      )
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'border-green-700 bg-green-900/30 text-green-400'
      case 'draft':
        return 'border-yellow-700 bg-yellow-900/30 text-yellow-400'
      case 'closed':
        return 'border-red-700 bg-red-900/30 text-red-400'
      case 'cancelled':
        return 'border-slate-600 bg-slate-700/30 text-slate-400'
      default:
        return 'border-slate-600 bg-slate-700/30 text-slate-400'
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-white">
            Requests for Quotation
          </h1>
          <p className="text-slate-400">
            {canManageRFQs
              ? 'Create RFQs, manage line items, assign vendors, and send procurement requests.'
              : 'View RFQs and track procurement request status.'}
          </p>
        </div>
        {canManageRFQs && (
          <Button
            onClick={handleAddRFQ}
            className="w-fit bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="mr-2 size-4" />
            New RFQ
          </Button>
        )}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <StatCard
          title="Total RFQs"
          value={stats.total}
          icon={<FileText className="size-5 text-blue-500" />}
        />
        <StatCard
          title="Published"
          value={stats.published}
          icon={<Users className="size-5 text-green-500" />}
        />
        <StatCard
          title="Drafts"
          value={stats.draft}
          icon={<Pencil className="size-5 text-yellow-500" />}
        />
        <StatCard
          title="Closed"
          value={stats.closed}
          icon={<CalendarDays className="size-5 text-red-500" />}
        />
      </div>

      <div className="mb-6 rounded-lg border border-slate-700 bg-slate-800 p-5">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-500" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by RFQ number, title, category..."
              className="border-slate-600 bg-slate-700 pl-9 text-white placeholder:text-slate-500"
            />
          </div>
          <Button
            onClick={loadRFQData}
            className="bg-slate-700 text-white hover:bg-slate-600"
          >
            Refresh
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {rfqStatuses.map((status) => (
            <button
              key={status.value}
              onClick={() => setStatusFilter(status.value)}
              className={
                statusFilter === status.value
                  ? 'rounded-full border border-blue-600 bg-blue-600 px-3 py-1 text-xs font-medium text-white'
                  : 'rounded-full border border-slate-600 bg-slate-700 px-3 py-1 text-xs font-medium text-slate-300 hover:bg-slate-600'
              }
            >
              {status.label} ({getStatusCount(status.value)})
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-700 bg-red-900/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 text-center text-slate-500">
            Loading RFQs...
          </div>
        ) : filteredRFQs.length === 0 ? (
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 text-center">
            <p className="mb-4 text-slate-400">No RFQs found</p>
            {canManageRFQs && (
              <Button
                onClick={handleAddRFQ}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Create First RFQ
              </Button>
            )}
          </div>
        ) : (
          filteredRFQs.map((rfq) => (
            <div
              key={rfq.id}
              className="rounded-lg border border-slate-700 bg-slate-800 p-6 transition-colors hover:border-slate-600"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">
                      {rfq.title}
                    </h3>
                    <span
                      className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${getStatusColor(
                        rfq.status
                      )}`}
                    >
                      {rfqStatusLabels[rfq.status]}
                    </span>
                  </div>
                  <p className="mb-3 text-sm text-slate-400">
                    {rfq.description || 'No description added'}
                  </p>
                  <div className="flex flex-wrap gap-5 text-sm">
                    <span className="text-slate-300">
                      <span className="text-slate-500">Number:</span>{' '}
                      {rfq.rfq_number}
                    </span>
                    <span className="text-slate-300">
                      <span className="text-slate-500">Category:</span>{' '}
                      {rfq.category}
                    </span>
                    <span className="text-slate-300">
                      <span className="text-slate-500">Items:</span>{' '}
                      {rfq.rfq_items?.length || 0}
                    </span>
                    <span className="text-slate-300">
                      <span className="text-slate-500">Vendors:</span>{' '}
                      {rfq.rfq_vendor_invitations?.length || 0}
                    </span>
                    <span className="text-slate-300">
                      <span className="text-slate-500">Deadline:</span>{' '}
                      {new Date(rfq.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/dashboard/rfqs/${rfq.id}`}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-blue-400 hover:bg-blue-900/20 hover:text-blue-300"
                    >
                      <Eye className="mr-2 size-4" />
                      View
                    </Button>
                  </Link>
                  {canManageRFQs && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-blue-400 hover:bg-blue-900/20 hover:text-blue-300"
                      onClick={() => handleEditRFQ(rfq.id)}
                    >
                      <Pencil className="mr-2 size-4" />
                      Edit
                    </Button>
                  )}
                  {canManageRFQs && rfq.status !== 'closed' && (
                    <Button
                      size="sm"
                      className="bg-red-600 text-white hover:bg-red-700"
                      onClick={() => handleStatusChange(rfq.id, 'closed')}
                    >
                      Close
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <RFQModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        rfqId={selectedRFQ}
      />
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string
  value: number | string
  icon: React.ReactNode
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

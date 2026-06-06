'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays, ChevronLeft, FileText, Paperclip, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getRFQById, updateRFQStatus } from '@/app/actions/rfqs'
import { RFQStatus, RFQWithDetails, rfqStatusLabels } from '@/lib/rfqs'

export default function RFQDetailPage() {
  const params = useParams()
  const rfqId = params.id as string
  const [rfq, setRFQ] = useState<RFQWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRFQ()
  }, [rfqId])

  const loadRFQ = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getRFQById(rfqId)
      setRFQ(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load RFQ.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (status: RFQStatus) => {
    if (!rfq) return

    if (!window.confirm(`Change RFQ status to ${rfqStatusLabels[status]}?`)) {
      return
    }

    try {
      const updated = await updateRFQStatus(rfq.id, status)
      setRFQ((current) => (current ? { ...current, ...updated } : current))
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to update RFQ status.'
      )
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-900/30 text-green-400'
      case 'draft':
        return 'bg-yellow-900/30 text-yellow-400'
      case 'closed':
        return 'bg-red-900/30 text-red-400'
      case 'cancelled':
        return 'bg-slate-700/30 text-slate-400'
      default:
        return 'bg-slate-700/30 text-slate-400'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 p-8 text-slate-400">
        Loading RFQ...
      </div>
    )
  }

  if (error || !rfq) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="text-center">
          <p className="mb-4 text-slate-400">{error || 'RFQ not found'}</p>
          <Link href="/dashboard/rfqs">
            <Button className="bg-blue-600 text-white hover:bg-blue-700">
              Back to RFQs
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/dashboard/rfqs">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white"
          >
            <ChevronLeft className="mr-2 size-4" />
            Back
          </Button>
        </Link>
      </div>

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-white">{rfq.title}</h1>
            <span
              className={`rounded-lg px-4 py-2 text-sm font-medium ${getStatusColor(
                rfq.status
              )}`}
            >
              {rfqStatusLabels[rfq.status]}
            </span>
          </div>
          <p className="text-slate-400">{rfq.description}</p>
        </div>

        <div className="flex gap-2">
          {rfq.status === 'draft' && (
            <Button
              onClick={() => handleStatusChange('published')}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Publish
            </Button>
          )}
          {rfq.status !== 'closed' && (
            <Button
              onClick={() => handleStatusChange('closed')}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Close RFQ
            </Button>
          )}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <InfoCard label="RFQ Number" value={rfq.rfq_number} icon={<FileText />} />
        <InfoCard label="Category" value={rfq.category} icon={<FileText />} />
        <InfoCard
          label="Deadline"
          value={new Date(rfq.deadline).toLocaleDateString()}
          icon={<CalendarDays />}
        />
        <InfoCard
          label="Assigned Vendors"
          value={rfq.rfq_vendor_invitations.length}
          icon={<Users />}
        />
      </div>

      <section className="mb-8 rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h2 className="mb-4 text-xl font-bold text-white">Line Items</h2>
        <div className="space-y-3">
          {rfq.rfq_items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-slate-600 bg-slate-700/50 p-4"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-medium text-white">{item.item_name}</p>
                  {item.description && (
                    <p className="mt-1 text-sm text-slate-400">
                      {item.description}
                    </p>
                  )}
                  {item.specifications && (
                    <p className="mt-1 text-xs text-slate-500">
                      Specs: {item.specifications}
                    </p>
                  )}
                </div>
                <p className="text-sm text-slate-300">
                  {item.quantity} {item.unit}
                  {item.estimated_unit_price
                    ? ` @ Rs. ${item.estimated_unit_price}`
                    : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h2 className="mb-4 text-xl font-bold text-white">Assigned Vendors</h2>
        {rfq.rfq_vendor_invitations.length === 0 ? (
          <p className="text-slate-400">No vendors assigned yet.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {rfq.rfq_vendor_invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="rounded-lg border border-slate-600 bg-slate-700/50 p-4"
              >
                <p className="font-medium text-white">
                  {invitation.vendors?.name || invitation.vendor_id}
                </p>
                <p className="text-sm text-slate-400">
                  Status: {invitation.status}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Paperclip className="size-5 text-slate-400" />
          <h2 className="text-xl font-bold text-white">Attachments</h2>
        </div>
        {rfq.rfq_attachments.length === 0 ? (
          <p className="text-slate-400">No attachments uploaded.</p>
        ) : (
          <div className="space-y-2">
            {rfq.rfq_attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-sm text-slate-300"
              >
                {attachment.file_name}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function InfoCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string | number
  icon: React.ReactElement
}) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        <span className="text-blue-400 [&_svg]:size-5">{icon}</span>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  )
}

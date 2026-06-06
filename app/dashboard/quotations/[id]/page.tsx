'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays, ChevronLeft, FileText, Package, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getQuotationById } from '@/app/actions/quotations'
import {
  QuotationStatus,
  QuotationWithDetails,
  quotationStatusLabels,
} from '@/lib/quotations'

export default function QuotationDetailPage() {
  const params = useParams()
  const quotationId = params.id as string
  const [quotation, setQuotation] = useState<QuotationWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadQuotation()
  }, [quotationId])

  const loadQuotation = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getQuotationById(quotationId)
      setQuotation(data)
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to load quotation.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 p-8 text-slate-400">
        Loading quotation...
      </div>
    )
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="text-center">
          <p className="mb-4 text-slate-400">
            {error || 'Quotation not found'}
          </p>
          <Link href="/dashboard/quotations">
            <Button className="bg-blue-600 text-white hover:bg-blue-700">
              Back to Quotations
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/dashboard/quotations">
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
            <h1 className="text-3xl font-bold text-white">
              {quotation.quotation_number}
            </h1>
            <StatusBadge status={quotation.status} />
          </div>
          <p className="text-slate-400">
            {quotation.rfqs?.title || 'RFQ'} from{' '}
            {quotation.vendors?.name || 'Vendor'}
          </p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <InfoCard
          label="Total Amount"
          value={`Rs. ${Number(quotation.total_amount || 0).toLocaleString('en-IN')}`}
          icon={<Package />}
        />
        <InfoCard
          label="Delivery Timeline"
          value={`${quotation.delivery_days || '-'} days`}
          icon={<Truck />}
        />
        <InfoCard
          label="Valid Until"
          value={
            quotation.valid_until
              ? new Date(quotation.valid_until).toLocaleDateString()
              : '-'
          }
          icon={<CalendarDays />}
        />
        <InfoCard
          label="RFQ Reference"
          value={quotation.rfqs?.rfq_number || '-'}
          icon={<FileText />}
        />
      </div>

      <section className="mb-8 rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h2 className="mb-4 text-xl font-bold text-white">Quotation Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="p-3 text-left font-medium text-slate-300">Item</th>
                <th className="p-3 text-right font-medium text-slate-300">
                  Quantity
                </th>
                <th className="p-3 text-right font-medium text-slate-300">
                  Unit Price
                </th>
                <th className="p-3 text-right font-medium text-slate-300">
                  Delivery
                </th>
                <th className="p-3 text-right font-medium text-slate-300">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {quotation.quotation_items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-700 hover:bg-slate-700/50"
                >
                  <td className="p-3">
                    <p className="font-medium text-white">{item.item_name}</p>
                    {item.notes && (
                      <p className="mt-1 text-xs text-slate-500">{item.notes}</p>
                    )}
                  </td>
                  <td className="p-3 text-right text-slate-300">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="p-3 text-right text-slate-300">
                    Rs. {Number(item.unit_price || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-right text-slate-300">
                    {item.delivery_days || '-'} days
                  </td>
                  <td className="p-3 text-right font-medium text-white">
                    Rs. {Number(item.total_price || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-600 bg-slate-700/30">
                <td colSpan={4} className="p-3 text-right font-semibold text-white">
                  Subtotal
                </td>
                <td className="p-3 text-right font-bold text-white">
                  Rs. {Number(quotation.subtotal || 0).toLocaleString('en-IN')}
                </td>
              </tr>
              <tr className="bg-slate-700/30">
                <td colSpan={4} className="p-3 text-right font-semibold text-white">
                  GST ({Number(quotation.gst_percent || 0)}%)
                </td>
                <td className="p-3 text-right font-bold text-white">
                  Rs. {Number(quotation.gst_amount || 0).toLocaleString('en-IN')}
                </td>
              </tr>
              <tr className="bg-slate-700/50">
                <td colSpan={4} className="p-3 text-right text-lg font-bold text-white">
                  Total
                </td>
                <td className="p-3 text-right text-lg font-bold text-white">
                  Rs. {Number(quotation.total_amount || 0).toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h2 className="mb-3 text-lg font-bold text-white">Commercial Terms</h2>
          <p className="text-sm text-slate-400">Payment Terms</p>
          <p className="mb-4 text-white">{quotation.payment_terms || '-'}</p>
          <p className="text-sm text-slate-400">Vendor</p>
          <p className="text-white">{quotation.vendors?.name || '-'}</p>
          {quotation.vendors?.email && (
            <p className="text-sm text-slate-500">{quotation.vendors.email}</p>
          )}
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h2 className="mb-3 text-lg font-bold text-white">Notes / Comments</h2>
          <p className="whitespace-pre-wrap text-slate-300">
            {quotation.notes || 'No notes added.'}
          </p>
        </div>
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

function StatusBadge({ status }: { status: QuotationStatus }) {
  const colors: Record<QuotationStatus, string> = {
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
      {quotationStatusLabels[status]}
    </span>
  )
}

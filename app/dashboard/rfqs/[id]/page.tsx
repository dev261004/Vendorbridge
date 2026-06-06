'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { ChevronLeft, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export default function RFQDetailPage() {
  const params = useParams()
  const router = useRouter()
  const rfqId = params.id as string
  const { getRFQ, getQuotationsByRFQ, getVendor, updateRFQ } = useAppStore()

  const rfq = getRFQ(rfqId)
  const quotations = getQuotationsByRFQ(rfqId)

  if (!rfq) {
    return (
      <div className="p-8 bg-slate-900 min-h-screen">
        <div className="text-center">
          <p className="text-slate-400 mb-4">RFQ not found</p>
          <Link href="/dashboard/rfqs">
            <Button className="bg-blue-600 hover:bg-blue-700">Back to RFQs</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handlePublish = () => {
    if (rfq.status === 'draft') {
      updateRFQ(rfqId, { status: 'published' })
    }
  }

  const handleClose = () => {
    if (rfq.status !== 'closed') {
      updateRFQ(rfqId, { status: 'closed' })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'text-green-400 bg-green-900/30'
      case 'draft':
        return 'text-yellow-400 bg-yellow-900/30'
      case 'closed':
        return 'text-red-400 bg-red-900/30'
      default:
        return 'text-slate-400 bg-slate-700/30'
    }
  }

  const getQuotationStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-900/30 text-green-400 border-green-700'
      case 'submitted':
        return 'bg-blue-900/30 text-blue-400 border-blue-700'
      case 'rejected':
        return 'bg-red-900/30 text-red-400 border-red-700'
      case 'under_review':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-700'
      default:
        return 'bg-slate-700/30 text-slate-400 border-slate-600'
    }
  }

  return (
    <div className="p-8 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/rfqs">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{rfq.title}</h1>
          <p className="text-slate-400">{rfq.description}</p>
        </div>
        <div className="flex gap-2">
          {rfq.status === 'draft' && (
            <Button
              onClick={handlePublish}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Publish
            </Button>
          )}
          {rfq.status !== 'closed' && (
            <Button
              onClick={handleClose}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Close RFQ
            </Button>
          )}
        </div>
      </div>

      {/* RFQ Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <p className="text-slate-400 text-sm mb-2">RFQ Number</p>
          <p className="text-xl font-bold text-white">{rfq.number}</p>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <p className="text-slate-400 text-sm mb-2">Status</p>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(rfq.status)}`}>
            {rfq.status.toUpperCase()}
          </span>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <p className="text-slate-400 text-sm mb-2">Budget</p>
          <p className="text-xl font-bold text-white">${rfq.estimatedBudget.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <p className="text-slate-400 text-sm mb-2">Due Date</p>
          <p className="text-xl font-bold text-white">{new Date(rfq.dueDate).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Line Items</h2>
        <div className="space-y-3">
          {rfq.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="flex-1">
                <p className="font-medium text-white">{item.description}</p>
                <p className="text-sm text-slate-400">
                  Quantity: {item.quantity} {item.unit}
                  {item.estimatedPrice && ` • Est. Price: $${item.estimatedPrice}/unit`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quotations */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h2 className="text-xl font-bold text-white mb-4">
          Quotations ({quotations.length})
        </h2>

        {quotations.length === 0 ? (
          <p className="text-slate-400">No quotations received yet</p>
        ) : (
          <div className="space-y-4">
            {quotations.map((quotation) => {
              const vendor = getVendor(quotation.vendorId)
              return (
                <div
                  key={quotation.id}
                  className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{vendor?.name}</h3>
                      <p className="text-sm text-slate-400">{quotation.quotationNumber}</p>
                    </div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getQuotationStatusColor(quotation.status)}`}
                    >
                      {quotation.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-slate-500">Total Amount</p>
                      <p className="font-semibold text-white">${quotation.totalAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Valid Until</p>
                      <p className="font-semibold text-white">
                        {new Date(quotation.validUntil).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Delivery</p>
                      <p className="font-semibold text-white">
                        {new Date(quotation.deliveryDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Terms</p>
                      <p className="font-semibold text-white">{quotation.paymentTerms}</p>
                    </div>
                  </div>

                  {quotation.notes && (
                    <p className="text-sm text-slate-400 mb-3">{quotation.notes}</p>
                  )}

                  <Link href={`/dashboard/quotations/${quotation.id}`}>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                      View Details
                    </Button>
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

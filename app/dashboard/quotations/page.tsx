'use client'

import { useAppStore } from '@/lib/store'
import { Eye, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function QuotationsPage() {
  const { quotations, getVendor, getRFQ, updateQuotation } = useAppStore()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-900/30 text-green-400 border-green-700'
      case 'submitted':
        return 'bg-blue-900/30 text-blue-400 border-blue-700'
      case 'rejected':
        return 'bg-red-900/30 text-red-400 border-red-700'
      case 'under_review':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-700'
      case 'expired':
        return 'bg-gray-700/30 text-gray-400 border-gray-600'
      default:
        return 'bg-slate-700/30 text-slate-400 border-slate-600'
    }
  }

  const handleAccept = (quotationId: string) => {
    updateQuotation(quotationId, { status: 'accepted' })
  }

  const handleReject = (quotationId: string) => {
    updateQuotation(quotationId, { status: 'rejected' })
  }

  return (
    <div className="p-8 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Quotations</h1>
        <p className="text-slate-400">Review and manage vendor quotations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h3 className="text-slate-300 font-medium text-sm mb-2">Total</h3>
          <p className="text-3xl font-bold text-white">{quotations.length}</p>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h3 className="text-slate-300 font-medium text-sm mb-2">Submitted</h3>
          <p className="text-3xl font-bold text-blue-400">
            {quotations.filter((q) => q.status === 'submitted').length}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h3 className="text-slate-300 font-medium text-sm mb-2">Under Review</h3>
          <p className="text-3xl font-bold text-yellow-400">
            {quotations.filter((q) => q.status === 'under_review').length}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h3 className="text-slate-300 font-medium text-sm mb-2">Accepted</h3>
          <p className="text-3xl font-bold text-green-400">
            {quotations.filter((q) => q.status === 'accepted').length}
          </p>
        </div>
      </div>

      {/* Quotations List */}
      <div className="space-y-4">
        {quotations.length === 0 ? (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center">
            <p className="text-slate-400">No quotations found</p>
          </div>
        ) : (
          quotations.map((quotation) => {
            const vendor = getVendor(quotation.vendorId)
            const rfq = getRFQ(quotation.rfqId)

            return (
              <div
                key={quotation.id}
                className="bg-slate-800 rounded-lg border border-slate-700 p-6 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {vendor?.name || 'Unknown Vendor'}
                      </h3>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(quotation.status)}`}
                      >
                        {quotation.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-3">
                      {rfq?.title || 'RFQ'} • {quotation.quotationNumber}
                    </p>

                    <div className="flex items-center gap-6 text-sm">
                      <span className="text-slate-300">
                        <span className="text-slate-500">Total:</span> $
                        {quotation.totalAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-slate-300">
                        <span className="text-slate-500">Valid Until:</span>{' '}
                        {new Date(quotation.validUntil).toLocaleDateString()}
                      </span>
                      <span className="text-slate-300">
                        <span className="text-slate-500">Delivery:</span>{' '}
                        {new Date(quotation.deliveryDate).toLocaleDateString()}
                      </span>
                      <span className="text-slate-300">
                        <span className="text-slate-500">Terms:</span> {quotation.paymentTerms}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/quotations/${quotation.id}`}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    {quotation.status === 'submitted' && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleAccept(quotation.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => handleReject(quotation.id)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

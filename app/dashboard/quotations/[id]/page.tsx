'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { ChevronLeft, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

export default function QuotationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const quotationId = params.id as string
  const { getQuotation, getVendor, getRFQ, addPO, updateQuotation } = useAppStore()

  const quotation = getQuotation(quotationId)
  const vendor = quotation ? getVendor(quotation.vendorId) : null
  const rfq = quotation ? getRFQ(quotation.rfqId) : null

  if (!quotation) {
    return (
      <div className="p-8 bg-slate-900 min-h-screen">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Quotation not found</p>
          <Link href="/dashboard/quotations">
            <Button className="bg-blue-600 hover:bg-blue-700">Back to Quotations</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleAccept = () => {
    updateQuotation(quotationId, { status: 'accepted' })
    // Create PO from quotation
    addPO({
      id: String(Date.now()),
      poNumber: `PO-${Date.now()}`,
      vendorId: quotation.vendorId,
      rfqId: quotation.rfqId,
      quotationId: quotationId,
      items: quotation.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
      totalAmount: quotation.totalAmount,
      orderDate: new Date(),
      deliveryDate: quotation.deliveryDate,
      paymentTerms: quotation.paymentTerms,
      status: 'sent',
      createdBy: 'current-user',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    alert('Purchase Order created successfully!')
    router.push('/dashboard/purchase-orders')
  }

  const handleReject = () => {
    updateQuotation(quotationId, { status: 'rejected' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'text-green-400 bg-green-900/30'
      case 'submitted':
        return 'text-blue-400 bg-blue-900/30'
      case 'rejected':
        return 'text-red-400 bg-red-900/30'
      case 'under_review':
        return 'text-yellow-400 bg-yellow-900/30'
      default:
        return 'text-slate-400 bg-slate-700/30'
    }
  }

  return (
    <div className="p-8 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/quotations">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Quotation from {vendor?.name}
          </h1>
          <p className="text-slate-400">{quotation.quotationNumber}</p>
        </div>
        <div className="flex gap-2">
          {quotation.status === 'submitted' && (
            <>
              <Button
                onClick={handleAccept}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Accept & Create PO
              </Button>
              <Button
                onClick={handleReject}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-8">
        <span
          className={`inline-block px-4 py-2 rounded-lg text-sm font-medium ${getStatusColor(quotation.status)}`}
        >
          {quotation.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <p className="text-slate-400 text-sm mb-2">Vendor</p>
          <p className="text-xl font-bold text-white">{vendor?.name}</p>
          <p className="text-sm text-slate-500 mt-2">{vendor?.email}</p>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <p className="text-slate-400 text-sm mb-2">Total Amount</p>
          <p className="text-3xl font-bold text-white">
            ${quotation.totalAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <p className="text-slate-400 text-sm mb-2">Valid Until</p>
          <p className="text-xl font-bold text-white">
            {new Date(quotation.validUntil).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Quotation Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <p className="text-slate-400 text-sm mb-2">Delivery Date</p>
          <p className="text-lg font-bold text-white">
            {new Date(quotation.deliveryDate).toLocaleDateString()}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <p className="text-slate-400 text-sm mb-2">Payment Terms</p>
          <p className="text-lg font-bold text-white">{quotation.paymentTerms}</p>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <p className="text-slate-400 text-sm mb-2">RFQ Reference</p>
          <p className="text-lg font-bold text-white">{rfq?.number || 'N/A'}</p>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Line Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-3 text-slate-300 font-medium">Description</th>
                <th className="text-right p-3 text-slate-300 font-medium">Quantity</th>
                <th className="text-right p-3 text-slate-300 font-medium">Unit Price</th>
                <th className="text-right p-3 text-slate-300 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items.map((item) => (
                <tr key={item.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                  <td className="p-3 text-white">{item.description}</td>
                  <td className="text-right p-3 text-slate-300">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="text-right p-3 text-slate-300">
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td className="text-right p-3 text-white font-medium">
                    ${item.totalPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-700/30 border-t-2 border-slate-600">
                <td colSpan={3} className="p-3 text-right font-semibold text-white">
                  Total:
                </td>
                <td className="text-right p-3 text-lg font-bold text-white">
                  ${quotation.totalAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      {quotation.notes && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-lg font-bold text-white mb-3">Notes</h2>
          <p className="text-slate-300">{quotation.notes}</p>
        </div>
      )}
    </div>
  )
}

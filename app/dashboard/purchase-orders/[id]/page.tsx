'use client'

import { useParams } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Download } from 'lucide-react'
import Link from 'next/link'

export default function PODetailPage() {
  const params = useParams()
  const poId = params.id as string
  const { getPO, getVendor, getRFQ } = useAppStore()

  const po = getPO(poId)
  const vendor = po ? getVendor(po.vendorId) : null
  const rfq = po ? getRFQ(po.rfqId) : null

  if (!po) {
    return (
      <div className="p-8 bg-slate-900 min-h-screen">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Purchase Order not found</p>
          <Link href="/dashboard/purchase-orders">
            <Button className="bg-blue-600 hover:bg-blue-700">Back to POs</Button>
          </Link>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-900/30'
      case 'sent':
        return 'text-blue-400 bg-blue-900/30'
      case 'acknowledged':
        return 'text-purple-400 bg-purple-900/30'
      case 'partial_delivery':
        return 'text-yellow-400 bg-yellow-900/30'
      case 'cancelled':
        return 'text-red-400 bg-red-900/30'
      default:
        return 'text-slate-400 bg-slate-700/30'
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="p-8 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/purchase-orders">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Purchase Order {po.poNumber}
          </h1>
          <p className="text-slate-400">Vendor: {vendor?.name}</p>
        </div>
        <Button
          onClick={handlePrint}
          className="bg-slate-700 hover:bg-slate-600 text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Print / Save as PDF
        </Button>
      </div>

      {/* Status Badge */}
      <div className="mb-8">
        <span
          className={`inline-block px-4 py-2 rounded-lg text-sm font-medium ${getStatusColor(po.status)}`}
        >
          {po.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {/* PO Document */}
      <div className="bg-white text-black p-8 rounded-lg shadow-lg mb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b-2 border-gray-300 pb-6">
          <div>
            <h2 className="text-2xl font-bold">PURCHASE ORDER</h2>
            <p className="text-gray-600 text-sm">{po.poNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              Order Date: {new Date(po.orderDate).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600">
              Delivery Date: {new Date(po.deliveryDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Vendor Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-bold mb-2">VENDOR DETAILS</h3>
            <p className="font-semibold">{vendor?.name}</p>
            <p className="text-sm text-gray-600">{vendor?.address}</p>
            <p className="text-sm text-gray-600">
              {vendor?.city}, {vendor?.country}
            </p>
            <p className="text-sm text-gray-600">{vendor?.email}</p>
            <p className="text-sm text-gray-600">{vendor?.phoneNumber}</p>
          </div>
          <div>
            <h3 className="font-bold mb-2">PAYMENT TERMS</h3>
            <p className="text-sm">{po.paymentTerms}</p>
            {po.notes && (
              <>
                <h3 className="font-bold mt-4 mb-2">NOTES</h3>
                <p className="text-sm text-gray-700">{po.notes}</p>
              </>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-400 px-4 py-2 text-left">Description</th>
                <th className="border border-gray-400 px-4 py-2 text-right">Quantity</th>
                <th className="border border-gray-400 px-4 py-2 text-right">Unit Price</th>
                <th className="border border-gray-400 px-4 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {po.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-300">
                  <td className="border border-gray-400 px-4 py-2">{item.description}</td>
                  <td className="border border-gray-400 px-4 py-2 text-right">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="border border-gray-400 px-4 py-2 text-right">
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td className="border border-gray-400 px-4 py-2 text-right font-semibold">
                    ${item.totalPrice.toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-100">
                <td colSpan={3} className="border border-gray-400 px-4 py-2 text-right font-bold">
                  TOTAL:
                </td>
                <td className="border border-gray-400 px-4 py-2 text-right font-bold text-lg">
                  ${po.totalAmount.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Delivery Status */}
        {po.items.some((item) => item.receivedQuantity !== undefined) && (
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-bold mb-3">DELIVERY STATUS</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-2 py-1 text-left">Item</th>
                  <th className="px-2 py-1 text-right">Ordered</th>
                  <th className="px-2 py-1 text-right">Received</th>
                  <th className="px-2 py-1 text-right">Pending</th>
                </tr>
              </thead>
              <tbody>
                {po.items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-300">
                    <td className="px-2 py-1">{item.description}</td>
                    <td className="px-2 py-1 text-right">{item.quantity}</td>
                    <td className="px-2 py-1 text-right text-green-600 font-semibold">
                      {item.receivedQuantity || 0}
                    </td>
                    <td className="px-2 py-1 text-right text-orange-600">
                      {item.quantity - (item.receivedQuantity || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-8 border-t-2 border-gray-400 text-xs text-gray-600">
          <p>This is an official Purchase Order. Please confirm receipt and keep for your records.</p>
        </div>
      </div>
    </div>
  )
}

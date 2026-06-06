'use client'

import { useAppStore } from '@/lib/store'
import { Eye, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function PurchaseOrdersPage() {
  const { pos, getVendor, updatePO } = useAppStore()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-900/30 text-green-400 border-green-700'
      case 'sent':
        return 'bg-blue-900/30 text-blue-400 border-blue-700'
      case 'acknowledged':
        return 'bg-purple-900/30 text-purple-400 border-purple-700'
      case 'partial_delivery':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-700'
      case 'cancelled':
        return 'bg-red-900/30 text-red-400 border-red-700'
      default:
        return 'bg-slate-700/30 text-slate-400 border-slate-600'
    }
  }

  const handleMarkDelivered = (poId: string, po: any) => {
    const hasPartial = po.items.some((item: any) => item.receivedQuantity !== undefined)
    if (hasPartial) {
      updatePO(poId, { status: 'completed' })
    }
  }

  return (
    <div className="p-8 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Purchase Orders</h1>
        <p className="text-slate-400">Track and manage all purchase orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h3 className="text-slate-300 font-medium text-sm mb-2">Total</h3>
          <p className="text-3xl font-bold text-white">{pos.length}</p>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h3 className="text-slate-300 font-medium text-sm mb-2">Sent</h3>
          <p className="text-3xl font-bold text-blue-400">
            {pos.filter((p) => p.status === 'sent').length}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h3 className="text-slate-300 font-medium text-sm mb-2">Acknowledged</h3>
          <p className="text-3xl font-bold text-purple-400">
            {pos.filter((p) => p.status === 'acknowledged').length}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h3 className="text-slate-300 font-medium text-sm mb-2">In Delivery</h3>
          <p className="text-3xl font-bold text-yellow-400">
            {pos.filter((p) => p.status === 'partial_delivery').length}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h3 className="text-slate-300 font-medium text-sm mb-2">Completed</h3>
          <p className="text-3xl font-bold text-green-400">
            {pos.filter((p) => p.status === 'completed').length}
          </p>
        </div>
      </div>

      {/* POs List */}
      <div className="space-y-4">
        {pos.length === 0 ? (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center">
            <p className="text-slate-400">No purchase orders found</p>
          </div>
        ) : (
          pos.map((po) => {
            const vendor = getVendor(po.vendorId)
            const totalDelivered = po.items.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0)
            const totalOrdered = po.items.reduce((sum, item) => sum + item.quantity, 0)

            return (
              <div
                key={po.id}
                className="bg-slate-800 rounded-lg border border-slate-700 p-6 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {vendor?.name || 'Unknown Vendor'}
                      </h3>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(po.status)}`}
                      >
                        {po.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-3">{po.poNumber}</p>

                    <div className="flex items-center gap-6 text-sm mb-3">
                      <span className="text-slate-300">
                        <span className="text-slate-500">Total:</span> $
                        {po.totalAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-slate-300">
                        <span className="text-slate-500">Order Date:</span>{' '}
                        {new Date(po.orderDate).toLocaleDateString()}
                      </span>
                      <span className="text-slate-300">
                        <span className="text-slate-500">Delivery:</span>{' '}
                        {new Date(po.deliveryDate).toLocaleDateString()}
                      </span>
                      <span className="text-slate-300">
                        <span className="text-slate-500">Terms:</span> {po.paymentTerms}
                      </span>
                    </div>

                    {po.status === 'partial_delivery' && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-900/30 rounded-full border border-yellow-700">
                        <Truck className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs text-yellow-300">
                          {totalDelivered} of {totalOrdered} items delivered
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/purchase-orders/${po.id}`}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    {po.status === 'partial_delivery' && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleMarkDelivered(po.id, po)}
                      >
                        Mark Complete
                      </Button>
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

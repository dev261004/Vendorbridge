'use client'

import { useAppStore } from '@/lib/store'
import { Eye, Download, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function InvoicesPage() {
  const { invoices, getVendor, updateInvoice } = useAppStore()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-900/30 text-green-400 border-green-700'
      case 'pending':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-700'
      case 'partial':
        return 'bg-orange-900/30 text-orange-400 border-orange-700'
      case 'overdue':
        return 'bg-red-900/30 text-red-400 border-red-700'
      default:
        return 'bg-slate-700/30 text-slate-400 border-slate-600'
    }
  }

  const handleMarkPaid = (invoiceId: string) => {
    updateInvoice(invoiceId, { paymentStatus: 'paid' })
  }

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  const paidAmount = invoices
    .filter((inv) => inv.paymentStatus === 'paid')
    .reduce((sum, inv) => sum + inv.totalAmount, 0)
  const pendingAmount = invoices
    .filter((inv) => inv.paymentStatus === 'pending' || inv.paymentStatus === 'overdue')
    .reduce((sum, inv) => sum + inv.totalAmount, 0)

  return (
    <div className="p-8 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Invoices</h1>
        <p className="text-slate-400">Manage and track vendor invoices and payments</p>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h3 className="text-slate-300 font-medium text-sm mb-2">Total Amount</h3>
          <p className="text-3xl font-bold text-white">
            ${totalAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h3 className="text-slate-300 font-medium text-sm mb-2">Paid</h3>
          <p className="text-3xl font-bold text-green-400">
            ${paidAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h3 className="text-slate-300 font-medium text-sm mb-2">Pending</h3>
          <p className="text-3xl font-bold text-yellow-400">
            ${pendingAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h3 className="text-slate-300 font-medium text-sm mb-2">Total Invoices</h3>
          <p className="text-3xl font-bold text-white">{invoices.length}</p>
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        {invoices.length === 0 ? (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center">
            <p className="text-slate-400">No invoices found</p>
          </div>
        ) : (
          invoices.map((invoice) => {
            const vendor = getVendor(invoice.vendorId)
            const isOverdue =
              invoice.paymentStatus !== 'paid' &&
              new Date(invoice.dueDate) < new Date()

            return (
              <div
                key={invoice.id}
                className={`bg-slate-800 rounded-lg border p-6 hover:border-slate-600 transition-colors ${
                  isOverdue ? 'border-red-700' : 'border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {vendor?.name || 'Unknown Vendor'}
                      </h3>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          isOverdue ? 'overdue' : invoice.paymentStatus
                        )}`}
                      >
                        {isOverdue
                          ? 'OVERDUE'
                          : invoice.paymentStatus.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-3">
                      {invoice.invoiceNumber}
                    </p>

                    <div className="flex items-center gap-6 text-sm">
                      <span className="text-slate-300">
                        <span className="text-slate-500">Amount:</span> $
                        {invoice.totalAmount.toLocaleString('en-US', {
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span className="text-slate-300">
                        <span className="text-slate-500">Date:</span>{' '}
                        {new Date(invoice.invoiceDate).toLocaleDateString()}
                      </span>
                      <span className="text-slate-300">
                        <span className="text-slate-500">Due:</span>{' '}
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/invoices/${invoice.id}`}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-400 hover:text-white hover:bg-slate-700"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {invoice.paymentStatus !== 'paid' && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleMarkPaid(invoice.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark Paid
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

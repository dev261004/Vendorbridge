'use client'

import { useParams } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Download } from 'lucide-react'
import Link from 'next/link'

export default function InvoiceDetailPage() {
  const params = useParams()
  const invoiceId = params.id as string
  const { getInvoice, getVendor } = useAppStore()

  const invoice = getInvoice(invoiceId)
  const vendor = invoice ? getVendor(invoice.vendorId) : null

  if (!invoice) {
    return (
      <div className="p-8 bg-slate-900 min-h-screen">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Invoice not found</p>
          <Link href="/dashboard/invoices">
            <Button className="bg-blue-600 hover:bg-blue-700">Back to Invoices</Button>
          </Link>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-400 bg-green-900/30'
      case 'pending':
        return 'text-yellow-400 bg-yellow-900/30'
      case 'partial':
        return 'text-orange-400 bg-orange-900/30'
      case 'overdue':
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
        <Link href="/dashboard/invoices">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Invoice {invoice.invoiceNumber}
          </h1>
          <p className="text-slate-400">From: {vendor?.name}</p>
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
          className={`inline-block px-4 py-2 rounded-lg text-sm font-medium ${getStatusColor(invoice.paymentStatus)}`}
        >
          {invoice.paymentStatus.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {/* Invoice Document */}
      <div className="bg-white text-black p-8 rounded-lg shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b-2 border-gray-300 pb-6">
          <div>
            <h2 className="text-2xl font-bold">INVOICE</h2>
            <p className="text-gray-600 text-sm">{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              Invoice Date: {new Date(invoice.invoiceDate).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600">
              Due Date: {new Date(invoice.dueDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Vendor Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-bold mb-2">BILLED FROM</h3>
            <p className="font-semibold">{vendor?.name}</p>
            <p className="text-sm text-gray-600">{vendor?.address}</p>
            <p className="text-sm text-gray-600">
              {vendor?.city}, {vendor?.country}
            </p>
            <p className="text-sm text-gray-600">{vendor?.email}</p>
            <p className="text-sm text-gray-600">{vendor?.phoneNumber}</p>
          </div>
          <div>
            <h3 className="font-bold mb-2">PAYMENT INFORMATION</h3>
            <p className="text-sm">
              <span className="font-semibold">Status:</span>{' '}
              {invoice.paymentStatus.toUpperCase()}
            </p>
            {invoice.paymentMethod && (
              <p className="text-sm">
                <span className="font-semibold">Method:</span> {invoice.paymentMethod}
              </p>
            )}
            <p className="text-sm mt-4">
              <span className="font-semibold">Reference PO:</span>
            </p>
            <p className="text-sm text-gray-600">{invoice.poId}</p>
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
              {invoice.items.map((item) => (
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
                  TOTAL AMOUNT DUE:
                </td>
                <td className="border border-gray-400 px-4 py-2 text-right font-bold text-lg">
                  ${invoice.totalAmount.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="bg-gray-100 p-4 rounded mb-8">
            <h3 className="font-bold mb-2">NOTES</h3>
            <p className="text-sm text-gray-700">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-8 border-t-2 border-gray-400 text-xs text-gray-600">
          <p>Please process payment by the due date. Thank you for your business!</p>
        </div>
      </div>
    </div>
  )
}

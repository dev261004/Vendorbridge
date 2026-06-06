'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronLeft, Download, Printer, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  getPurchaseOrderById,
  updatePurchaseOrderStatus,
} from '@/app/actions/purchase-orders'
import {
  PurchaseOrderStatus,
  PurchaseOrderWithDetails,
  purchaseOrderStatusLabels,
  purchaseOrderStatuses,
} from '@/lib/procurement-documents'

const selectClassName =
  'h-10 rounded-lg border border-slate-600 bg-slate-700 px-3 text-sm text-white outline-none focus-visible:border-blue-500 print:hidden'
const nativeOptionStyle = {
  backgroundColor: '#0f172a',
  color: '#f8fafc',
}

export default function PurchaseOrderDetailPage() {
  const params = useParams()
  const purchaseOrderId = params.id as string
  const [purchaseOrder, setPurchaseOrder] =
    useState<PurchaseOrderWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadPurchaseOrder()
  }, [purchaseOrderId])

  const loadPurchaseOrder = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getPurchaseOrderById(purchaseOrderId)
      setPurchaseOrder(data)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to load purchase order.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (status: PurchaseOrderStatus) => {
    if (!purchaseOrder) return

    try {
      setIsUpdating(true)
      setError(null)
      setSuccess(null)
      await updatePurchaseOrderStatus(purchaseOrder.id, status)
      setSuccess('Purchase order status updated.')
      await loadPurchaseOrder()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to update purchase order status.'
      )
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 text-center text-slate-400">
          Loading purchase order...
        </div>
      </div>
    )
  }

  if (!purchaseOrder) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 text-center">
          <p className="mb-4 text-slate-400">
            {error || 'Purchase order not found.'}
          </p>
          <Link href="/dashboard/purchase-orders">
            <Button className="bg-blue-600 text-white hover:bg-blue-700">
              Back to Purchase Orders
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const invoice = purchaseOrder.invoices?.[0]

  return (
    <div className="min-h-screen bg-slate-900 p-8 print:bg-white print:p-0">
      <div className="mb-8 flex flex-col gap-4 print:hidden lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/purchase-orders">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
            >
              <ChevronLeft className="mr-2 size-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Purchase Order {purchaseOrder.po_number}
            </h1>
            <p className="text-slate-400">
              {purchaseOrder.vendors?.name || 'Unknown vendor'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={purchaseOrder.status}
            disabled={isUpdating}
            onChange={(event) =>
              handleStatusChange(event.target.value as PurchaseOrderStatus)
            }
            className={selectClassName}
          >
            {purchaseOrderStatuses.map((status) => (
              <option key={status} value={status} style={nativeOptionStyle}>
                {purchaseOrderStatusLabels[status]}
              </option>
            ))}
          </select>
          {invoice && (
            <Link href={`/dashboard/invoices/${invoice.id}`}>
              <Button className="bg-green-600 text-white hover:bg-green-700">
                View Invoice
              </Button>
            </Link>
          )}
          <Button
            onClick={handlePrint}
            className="bg-slate-700 text-white hover:bg-slate-600"
          >
            <Download className="mr-2 size-4" />
            Download PDF
          </Button>
          <Button
            onClick={handlePrint}
            className="bg-slate-700 text-white hover:bg-slate-600"
          >
            <Printer className="mr-2 size-4" />
            Print
          </Button>
          <Button
            onClick={loadPurchaseOrder}
            className="bg-slate-700 text-white hover:bg-slate-600"
          >
            <RefreshCw className="mr-2 size-4" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-700 bg-red-900/30 px-4 py-3 text-sm text-red-300 print:hidden">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg border border-green-700 bg-green-900/30 px-4 py-3 text-sm text-green-300 print:hidden">
          {success}
        </div>
      )}

      <div className="mx-auto max-w-5xl rounded-lg bg-white p-8 text-black shadow-lg print:max-w-none print:rounded-none print:p-8 print:shadow-none">
        <div className="mb-8 flex items-start justify-between border-b-2 border-slate-300 pb-6">
          <div>
            <h2 className="text-3xl font-bold">PURCHASE ORDER</h2>
            <p className="text-sm text-slate-600">{purchaseOrder.po_number}</p>
          </div>
          <div className="text-right text-sm text-slate-600">
            <p>PO Date: {formatDate(purchaseOrder.po_date)}</p>
            <p>Delivery Date: {formatDate(purchaseOrder.delivery_date)}</p>
            <p>Status: {purchaseOrderStatusLabels[purchaseOrder.status]}</p>
          </div>
        </div>

        <div className="mb-8 grid gap-8 md:grid-cols-2">
          <DocumentBlock title="Vendor Details">
            <p className="font-semibold">
              {purchaseOrder.vendors?.name || 'Unknown vendor'}
            </p>
            <p>{purchaseOrder.vendors?.contact_person || ''}</p>
            <p>{purchaseOrder.vendors?.email || ''}</p>
            <p>{purchaseOrder.vendors?.phone || ''}</p>
            <p>{purchaseOrder.vendors?.address || ''}</p>
            <p>
              {[purchaseOrder.vendors?.city, purchaseOrder.vendors?.state]
                .filter(Boolean)
                .join(', ')}
            </p>
            <p>{purchaseOrder.vendors?.gst_number || ''}</p>
          </DocumentBlock>

          <DocumentBlock title="Procurement Reference">
            <p>RFQ: {purchaseOrder.rfqs?.rfq_number || '-'}</p>
            <p>RFQ Title: {purchaseOrder.rfqs?.title || '-'}</p>
            <p>Quotation: {purchaseOrder.quotations?.quotation_number || '-'}</p>
            <p>Payment Terms: {purchaseOrder.payment_terms || '-'}</p>
          </DocumentBlock>
        </div>

        <table className="mb-8 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-200">
              <th className="border border-slate-400 px-4 py-2 text-left">
                Description
              </th>
              <th className="border border-slate-400 px-4 py-2 text-right">
                Quantity
              </th>
              <th className="border border-slate-400 px-4 py-2 text-right">
                Unit Price
              </th>
              <th className="border border-slate-400 px-4 py-2 text-right">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrder.purchase_order_items.map((item) => (
              <tr key={item.id}>
                <td className="border border-slate-400 px-4 py-2">
                  {item.item_name}
                </td>
                <td className="border border-slate-400 px-4 py-2 text-right">
                  {Number(item.quantity || 0).toLocaleString('en-IN')}{' '}
                  {item.unit}
                </td>
                <td className="border border-slate-400 px-4 py-2 text-right">
                  {formatCurrency(Number(item.unit_price || 0))}
                </td>
                <td className="border border-slate-400 px-4 py-2 text-right font-semibold">
                  {formatCurrency(Number(item.total_price || 0))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto w-full max-w-sm space-y-2 text-sm">
          <TotalLine
            label="Subtotal"
            value={formatCurrency(Number(purchaseOrder.subtotal || 0))}
          />
          <TotalLine
            label="GST"
            value={formatCurrency(Number(purchaseOrder.gst_amount || 0))}
          />
          <TotalLine
            label="Total"
            value={formatCurrency(Number(purchaseOrder.total_amount || 0))}
            strong
          />
        </div>

        {purchaseOrder.notes && (
          <div className="mt-8 rounded border border-slate-300 bg-slate-100 p-4">
            <h3 className="mb-2 font-bold">Notes</h3>
            <p className="text-sm text-slate-700">{purchaseOrder.notes}</p>
          </div>
        )}

        <div className="mt-8 border-t-2 border-slate-300 pt-6 text-xs text-slate-600">
          This is an official purchase order generated by VendorBridge.
        </div>
      </div>
    </div>
  )
}

function DocumentBlock({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h3 className="mb-2 font-bold uppercase">{title}</h3>
      <div className="space-y-1 text-sm text-slate-700">{children}</div>
    </div>
  )
}

function TotalLine({
  label,
  value,
  strong = false,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div
      className={`flex justify-between border-b border-slate-300 pb-2 ${
        strong ? 'text-lg font-bold' : ''
      }`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

function formatCurrency(value: number) {
  return `Rs. ${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`
}

function formatDate(value?: string | null) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle,
  Eye,
  FileText,
  Package,
  RefreshCw,
  Send,
  Truck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  generatePurchaseOrderFromQuotation,
  getPurchaseOrderWorkspace,
  updatePurchaseOrderStatus,
} from '@/app/actions/purchase-orders'
import {
  ApprovedQuotationForPO,
  DocumentAccess,
  PurchaseOrderStatus,
  PurchaseOrderWithDetails,
  purchaseOrderStatusLabels,
  purchaseOrderStatuses,
} from '@/lib/procurement-documents'

const selectClassName =
  'h-9 rounded-lg border border-slate-600 bg-slate-700 px-3 text-sm text-white outline-none focus-visible:border-blue-500'
const nativeOptionStyle = {
  backgroundColor: '#0f172a',
  color: '#f8fafc',
}

export default function PurchaseOrdersPage() {
  const [access, setAccess] = useState<DocumentAccess | null>(null)
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderWithDetails[]>(
    []
  )
  const [approvedQuotations, setApprovedQuotations] = useState<
    ApprovedQuotationForPO[]
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadWorkspace()
  }, [])

  const loadWorkspace = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const workspace = await getPurchaseOrderWorkspace()
      setAccess(workspace.access)
      setPurchaseOrders(workspace.purchaseOrders)
      setApprovedQuotations(workspace.approvedQuotations)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to load purchase orders.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const stats = useMemo(
    () => ({
      total: purchaseOrders.length,
      generated: purchaseOrders.filter((order) => order.status === 'generated')
        .length,
      sent: purchaseOrders.filter((order) => order.status === 'sent').length,
      completed: purchaseOrders.filter((order) => order.status === 'completed')
        .length,
      totalAmount: purchaseOrders.reduce(
        (total, order) => total + Number(order.total_amount || 0),
        0
      ),
    }),
    [purchaseOrders]
  )

  const handleGeneratePO = async (quotationId: string) => {
    try {
      setBusyId(quotationId)
      setError(null)
      setSuccess(null)
      const order = await generatePurchaseOrderFromQuotation(quotationId)
      setSuccess(`${order.po_number} generated successfully.`)
      await loadWorkspace()
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to generate purchase order.'
      )
    } finally {
      setBusyId(null)
    }
  }

  const handleStatusChange = async (
    orderId: string,
    status: PurchaseOrderStatus
  ) => {
    try {
      setBusyId(orderId)
      setError(null)
      setSuccess(null)
      await updatePurchaseOrderStatus(orderId, status)
      setSuccess('Purchase order status updated.')
      await loadWorkspace()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to update purchase order status.'
      )
    } finally {
      setBusyId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 text-center text-slate-400">
          Loading purchase orders...
        </div>
      </div>
    )
  }

  if (!access?.canView) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 text-center text-slate-400">
          You do not have access to purchase orders.
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-white">Purchase Orders</h1>
          <p className="text-slate-400">
            Convert manager-approved quotations into official purchase orders.
          </p>
        </div>
        <Button
          onClick={loadWorkspace}
          className="w-fit bg-slate-700 text-white hover:bg-slate-600"
        >
          <RefreshCw className="mr-2 size-4" />
          Refresh
        </Button>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-5">
        <StatCard label="Total POs" value={stats.total} icon={Package} />
        <StatCard label="Generated" value={stats.generated} icon={FileText} />
        <StatCard label="Sent" value={stats.sent} icon={Send} />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle} />
        <StatCard
          label="PO Value"
          value={formatCurrency(stats.totalAmount)}
          icon={Truck}
        />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-700 bg-red-900/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg border border-green-700 bg-green-900/30 px-4 py-3 text-sm text-green-300">
          {success}
        </div>
      )}

      {access.canGenerate && (
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Ready for PO Generation
              </h2>
              <p className="text-sm text-slate-400">
                Accepted quotations without an existing PO.
              </p>
            </div>
          </div>

          {approvedQuotations.length === 0 ? (
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 text-center text-slate-400">
              No approved quotations are waiting for purchase order generation.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {approvedQuotations.map((quotation) => (
                <div
                  key={quotation.id}
                  className="rounded-lg border border-slate-700 bg-slate-800 p-5"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-white">
                        {quotation.rfqs?.title || quotation.quotation_number}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {quotation.quotation_number} by{' '}
                        {quotation.vendors?.name || 'Unknown vendor'}
                      </p>
                    </div>
                    <StatusBadge status="generated" label="Approved" />
                  </div>

                  <div className="mb-4 grid gap-3 text-sm sm:grid-cols-2">
                    <InfoLine label="RFQ" value={quotation.rfqs?.rfq_number || '-'} />
                    <InfoLine
                      label="Delivery"
                      value={
                        quotation.delivery_days
                          ? `${quotation.delivery_days} days`
                          : '-'
                      }
                    />
                    <InfoLine
                      label="GST"
                      value={formatCurrency(Number(quotation.gst_amount || 0))}
                    />
                    <InfoLine
                      label="Total"
                      value={formatCurrency(Number(quotation.total_amount || 0))}
                    />
                  </div>

                  <Button
                    disabled={busyId === quotation.id}
                    onClick={() => handleGeneratePO(quotation.id)}
                    className="w-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    <FileText className="mr-2 size-4" />
                    {busyId === quotation.id ? 'Generating...' : 'Generate PO'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xl font-semibold text-white">Purchase Orders</h2>
        {purchaseOrders.length === 0 ? (
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 text-center text-slate-400">
            No purchase orders found.
          </div>
        ) : (
          <div className="space-y-4">
            {purchaseOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-lg border border-slate-700 bg-slate-800 p-6 transition-colors hover:border-slate-600"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-white">
                        {order.po_number}
                      </h3>
                      <StatusBadge status={order.status} />
                      {order.invoices?.[0] && (
                        <span className="rounded-full border border-green-700 bg-green-900/30 px-3 py-1 text-xs font-medium text-green-300">
                          Invoiced
                        </span>
                      )}
                    </div>
                    <p className="mb-3 text-sm text-slate-400">
                      {order.rfqs?.title || 'Purchase order'} for{' '}
                      {order.vendors?.name || 'Unknown vendor'}
                    </p>
                    <div className="flex flex-wrap gap-5 text-sm">
                      <InfoPill label="PO Date" value={formatDate(order.po_date)} />
                      <InfoPill
                        label="Delivery"
                        value={formatDate(order.delivery_date)}
                      />
                      <InfoPill
                        label="GST"
                        value={formatCurrency(Number(order.gst_amount || 0))}
                      />
                      <InfoPill
                        label="Total"
                        value={formatCurrency(Number(order.total_amount || 0))}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {access.canGenerate && (
                      <select
                        value={order.status}
                        disabled={busyId === order.id}
                        onChange={(event) =>
                          handleStatusChange(
                            order.id,
                            event.target.value as PurchaseOrderStatus
                          )
                        }
                        className={selectClassName}
                      >
                        {purchaseOrderStatuses.map((status) => (
                          <option
                            key={status}
                            value={status}
                            style={nativeOptionStyle}
                          >
                            {purchaseOrderStatusLabels[status]}
                          </option>
                        ))}
                      </select>
                    )}

                    {order.invoices?.[0] ? (
                      <Link href={`/dashboard/invoices/${order.invoices[0].id}`}>
                        <Button
                          size="sm"
                          className="bg-green-600 text-white hover:bg-green-700"
                        >
                          View Invoice
                        </Button>
                      </Link>
                    ) : (
                      access.canGenerate && (
                        <Link href="/dashboard/invoices">
                          <Button
                            size="sm"
                            className="bg-slate-700 text-white hover:bg-slate-600"
                          >
                            Generate Invoice
                          </Button>
                        </Link>
                      )
                    )}

                    <Link href={`/dashboard/purchase-orders/${order.id}`}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-blue-400 hover:bg-blue-900/20 hover:text-blue-300"
                      >
                        <Eye className="mr-2 size-4" />
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">{label}</h3>
        <Icon className="size-5 text-blue-500" />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium text-slate-200">{value}</p>
    </div>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-slate-300">
      <span className="text-slate-500">{label}:</span> {value}
    </span>
  )
}

function StatusBadge({
  status,
  label,
}: {
  status: PurchaseOrderStatus
  label?: string
}) {
  const colors: Record<PurchaseOrderStatus, string> = {
    generated: 'border-slate-600 bg-slate-700/30 text-slate-300',
    sent: 'border-blue-700 bg-blue-900/30 text-blue-400',
    acknowledged: 'border-purple-700 bg-purple-900/30 text-purple-300',
    partial_delivery: 'border-yellow-700 bg-yellow-900/30 text-yellow-400',
    completed: 'border-green-700 bg-green-900/30 text-green-400',
    cancelled: 'border-red-700 bg-red-900/30 text-red-400',
  }

  return (
    <span
      className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${colors[status]}`}
    >
      {label || purchaseOrderStatusLabels[status]}
    </span>
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

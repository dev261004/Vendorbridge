'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle,
  Download,
  Eye,
  FileText,
  Mail,
  Receipt,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  generateInvoiceFromPurchaseOrder,
  getInvoiceWorkspace,
  sendInvoiceEmail,
  updateInvoiceStatus,
} from '@/app/actions/invoices'
import {
  DocumentAccess,
  InvoiceStatus,
  InvoiceWithDetails,
  PurchaseOrderWithDetails,
  invoiceStatusLabels,
  invoiceStatuses,
} from '@/lib/procurement-documents'

const selectClassName =
  'h-9 rounded-lg border border-slate-600 bg-slate-700 px-3 text-sm text-white outline-none focus-visible:border-blue-500'
const nativeOptionStyle = {
  backgroundColor: '#0f172a',
  color: '#f8fafc',
}

export default function InvoicesPage() {
  const [access, setAccess] = useState<DocumentAccess | null>(null)
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([])
  const [purchaseOrdersReady, setPurchaseOrdersReady] = useState<
    PurchaseOrderWithDetails[]
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
      const workspace = await getInvoiceWorkspace()
      setAccess(workspace.access)
      setInvoices(workspace.invoices)
      setPurchaseOrdersReady(workspace.purchaseOrdersReady)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load invoices.')
    } finally {
      setIsLoading(false)
    }
  }

  const stats = useMemo(
    () => ({
      total: invoices.length,
      pending: invoices.filter((invoice) => invoice.status === 'pending_payment')
        .length,
      paid: invoices.filter((invoice) => invoice.status === 'paid').length,
      emailed: invoices.filter((invoice) => invoice.email_sent_at).length,
      totalAmount: invoices.reduce(
        (total, invoice) => total + Number(invoice.total_amount || 0),
        0
      ),
    }),
    [invoices]
  )

  const handleGenerateInvoice = async (purchaseOrderId: string) => {
    try {
      setBusyId(purchaseOrderId)
      setError(null)
      setSuccess(null)
      const invoice = await generateInvoiceFromPurchaseOrder(purchaseOrderId)
      setSuccess(`${invoice.invoice_number} generated successfully.`)
      await loadWorkspace()
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to generate invoice.'
      )
    } finally {
      setBusyId(null)
    }
  }

  const handleStatusChange = async (invoiceId: string, status: InvoiceStatus) => {
    try {
      setBusyId(invoiceId)
      setError(null)
      setSuccess(null)
      await updateInvoiceStatus(invoiceId, status)
      setSuccess('Invoice status updated.')
      await loadWorkspace()
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to update invoice status.'
      )
    } finally {
      setBusyId(null)
    }
  }

  const handleSendEmail = async (invoice: InvoiceWithDetails) => {
    try {
      setBusyId(invoice.id)
      setError(null)
      setSuccess(null)
      const result = await sendInvoiceEmail(invoice.id)

      if (!result.sent) {
        window.location.href = `mailto:${encodeURIComponent(
          result.recipient
        )}?subject=${encodeURIComponent(result.subject)}&body=${encodeURIComponent(
          result.body
        )}`
      }

      setSuccess(result.message)
      await loadWorkspace()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send invoice.')
    } finally {
      setBusyId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 text-center text-slate-400">
          Loading invoices...
        </div>
      </div>
    )
  }

  if (!access?.canView) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 text-center text-slate-400">
          You do not have access to invoices.
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-white">Invoices</h1>
          <p className="text-slate-400">
            Generate invoices from purchase orders, send them, and track payment
            status.
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
        <StatCard label="Invoices" value={stats.total} icon={Receipt} />
        <StatCard label="Pending" value={stats.pending} icon={FileText} />
        <StatCard label="Paid" value={stats.paid} icon={CheckCircle} />
        <StatCard label="Emailed" value={stats.emailed} icon={Mail} />
        <StatCard
          label="Invoice Value"
          value={formatCurrency(stats.totalAmount)}
          icon={Download}
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
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white">
              Ready for Invoice Generation
            </h2>
            <p className="text-sm text-slate-400">
              Purchase orders without an existing invoice.
            </p>
          </div>

          {purchaseOrdersReady.length === 0 ? (
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 text-center text-slate-400">
              No purchase orders are waiting for invoice generation.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {purchaseOrdersReady.map((order) => (
                <div
                  key={order.id}
                  className="rounded-lg border border-slate-700 bg-slate-800 p-5"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-white">{order.po_number}</h3>
                      <p className="text-sm text-slate-500">
                        {order.vendors?.name || 'Unknown vendor'} -{' '}
                        {order.rfqs?.title || 'Purchase order'}
                      </p>
                    </div>
                    <span className="rounded-full border border-blue-700 bg-blue-900/30 px-3 py-1 text-xs font-medium text-blue-300">
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mb-4 grid gap-3 text-sm sm:grid-cols-2">
                    <InfoLine
                      label="Subtotal"
                      value={formatCurrency(Number(order.subtotal || 0))}
                    />
                    <InfoLine
                      label="GST"
                      value={formatCurrency(Number(order.gst_amount || 0))}
                    />
                    <InfoLine
                      label="Total"
                      value={formatCurrency(Number(order.total_amount || 0))}
                    />
                    <InfoLine
                      label="Payment Terms"
                      value={order.payment_terms || 'Net 30'}
                    />
                  </div>

                  <Button
                    disabled={busyId === order.id}
                    onClick={() => handleGenerateInvoice(order.id)}
                    className="w-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    <Receipt className="mr-2 size-4" />
                    {busyId === order.id ? 'Generating...' : 'Generate Invoice'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xl font-semibold text-white">Generated Invoices</h2>
        {invoices.length === 0 ? (
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 text-center text-slate-400">
            No invoices found.
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => {
              const isOverdue =
                invoice.status !== 'paid' &&
                invoice.status !== 'cancelled' &&
                new Date(invoice.due_date) < new Date()

              return (
                <div
                  key={invoice.id}
                  className={`rounded-lg border bg-slate-800 p-6 transition-colors hover:border-slate-600 ${
                    isOverdue ? 'border-red-700' : 'border-slate-700'
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-white">
                          {invoice.invoice_number}
                        </h3>
                        <StatusBadge
                          status={isOverdue ? 'overdue' : invoice.status}
                        />
                        {invoice.email_sent_at && (
                          <span className="rounded-full border border-green-700 bg-green-900/30 px-3 py-1 text-xs font-medium text-green-300">
                            Emailed
                          </span>
                        )}
                      </div>
                      <p className="mb-3 text-sm text-slate-400">
                        {invoice.vendors?.name || 'Unknown vendor'} - PO{' '}
                        {invoice.purchase_orders?.po_number ||
                          invoice.purchase_order_id}
                      </p>
                      <div className="flex flex-wrap gap-5 text-sm">
                        <InfoPill
                          label="Invoice Date"
                          value={formatDate(invoice.invoice_date)}
                        />
                        <InfoPill label="Due" value={formatDate(invoice.due_date)} />
                        <InfoPill
                          label="Tax"
                          value={formatCurrency(
                            Number(invoice.cgst_amount || 0) +
                              Number(invoice.sgst_amount || 0)
                          )}
                        />
                        <InfoPill
                          label="Total"
                          value={formatCurrency(Number(invoice.total_amount || 0))}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {access.canGenerate && (
                        <select
                          value={invoice.status}
                          disabled={busyId === invoice.id}
                          onChange={(event) =>
                            handleStatusChange(
                              invoice.id,
                              event.target.value as InvoiceStatus
                            )
                          }
                          className={selectClassName}
                        >
                          {invoiceStatuses.map((status) => (
                            <option
                              key={status}
                              value={status}
                              style={nativeOptionStyle}
                            >
                              {invoiceStatusLabels[status]}
                            </option>
                          ))}
                        </select>
                      )}

                      {access.canGenerate && invoice.status !== 'paid' && (
                        <Button
                          size="sm"
                          disabled={busyId === invoice.id}
                          onClick={() => handleStatusChange(invoice.id, 'paid')}
                          className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                        >
                          <CheckCircle className="mr-2 size-4" />
                          Mark Paid
                        </Button>
                      )}

                      {access.canGenerate && (
                        <Button
                          size="sm"
                          disabled={busyId === invoice.id}
                          onClick={() => handleSendEmail(invoice)}
                          className="bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-60"
                        >
                          <Mail className="mr-2 size-4" />
                          Send
                        </Button>
                      )}

                      <Link href={`/dashboard/invoices/${invoice.id}`}>
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
              )
            })}
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

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const colors: Record<InvoiceStatus, string> = {
    draft: 'border-slate-600 bg-slate-700/30 text-slate-300',
    pending_payment: 'border-yellow-700 bg-yellow-900/30 text-yellow-400',
    paid: 'border-green-700 bg-green-900/30 text-green-400',
    overdue: 'border-red-700 bg-red-900/30 text-red-400',
    cancelled: 'border-red-700 bg-red-900/30 text-red-400',
  }

  return (
    <span
      className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${colors[status]}`}
    >
      {invoiceStatusLabels[status]}
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

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  CheckCircle,
  ChevronLeft,
  Download,
  Mail,
  Printer,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  getInvoiceById,
  sendInvoiceEmail,
  updateInvoiceStatus,
} from '@/app/actions/invoices'
import {
  InvoiceStatus,
  InvoiceWithDetails,
  invoiceStatusLabels,
  invoiceStatuses,
} from '@/lib/procurement-documents'

const selectClassName =
  'h-10 rounded-lg border border-slate-600 bg-slate-700 px-3 text-sm text-white outline-none focus-visible:border-blue-500 print:hidden'
const nativeOptionStyle = {
  backgroundColor: '#0f172a',
  color: '#f8fafc',
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const invoiceId = params.id as string
  const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadInvoice()
  }, [invoiceId])

  const loadInvoice = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getInvoiceById(invoiceId)
      setInvoice(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load invoice.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (status: InvoiceStatus) => {
    if (!invoice) return

    try {
      setIsUpdating(true)
      setError(null)
      setSuccess(null)
      await updateInvoiceStatus(invoice.id, status)
      setSuccess('Invoice status updated.')
      await loadInvoice()
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to update invoice status.'
      )
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSendEmail = async () => {
    if (!invoice) return

    try {
      setIsUpdating(true)
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
      await loadInvoice()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send invoice.')
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
          Loading invoice...
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 text-center">
          <p className="mb-4 text-slate-400">{error || 'Invoice not found.'}</p>
          <Link href="/dashboard/invoices">
            <Button className="bg-blue-600 text-white hover:bg-blue-700">
              Back to Invoices
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const taxAmount =
    Number(invoice.cgst_amount || 0) + Number(invoice.sgst_amount || 0)

  return (
    <div className="min-h-screen bg-slate-900 p-8 print:bg-white print:p-0">
      <div className="mb-8 flex flex-col gap-4 print:hidden lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/invoices">
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
              Invoice {invoice.invoice_number}
            </h1>
            <p className="text-slate-400">
              {invoice.vendors?.name || 'Unknown vendor'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={invoice.status}
            disabled={isUpdating}
            onChange={(event) =>
              handleStatusChange(event.target.value as InvoiceStatus)
            }
            className={selectClassName}
          >
            {invoiceStatuses.map((status) => (
              <option key={status} value={status} style={nativeOptionStyle}>
                {invoiceStatusLabels[status]}
              </option>
            ))}
          </select>
          {invoice.status !== 'paid' && (
            <Button
              disabled={isUpdating}
              onClick={() => handleStatusChange('paid')}
              className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
            >
              <CheckCircle className="mr-2 size-4" />
              Mark Paid
            </Button>
          )}
          <Button
            disabled={isUpdating}
            onClick={handleSendEmail}
            className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <Mail className="mr-2 size-4" />
            Send Email
          </Button>
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
            onClick={loadInvoice}
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
            <h2 className="text-3xl font-bold">INVOICE</h2>
            <p className="text-sm text-slate-600">{invoice.invoice_number}</p>
          </div>
          <div className="text-right text-sm text-slate-600">
            <p>Invoice Date: {formatDate(invoice.invoice_date)}</p>
            <p>Due Date: {formatDate(invoice.due_date)}</p>
            <p>Status: {invoiceStatusLabels[invoice.status]}</p>
          </div>
        </div>

        <div className="mb-8 grid gap-8 md:grid-cols-2">
          <DocumentBlock title="Vendor Details">
            <p className="font-semibold">{invoice.vendors?.name || '-'}</p>
            <p>{invoice.vendors?.contact_person || ''}</p>
            <p>{invoice.vendors?.email || ''}</p>
            <p>{invoice.vendors?.phone || ''}</p>
            <p>{invoice.vendors?.address || ''}</p>
            <p>
              {[invoice.vendors?.city, invoice.vendors?.state]
                .filter(Boolean)
                .join(', ')}
            </p>
            <p>{invoice.vendors?.gst_number || ''}</p>
          </DocumentBlock>

          <DocumentBlock title="Procurement Reference">
            <p>PO: {invoice.purchase_orders?.po_number || '-'}</p>
            <p>RFQ: {invoice.purchase_orders?.rfqs?.rfq_number || '-'}</p>
            <p>
              Quotation:{' '}
              {invoice.purchase_orders?.quotations?.quotation_number || '-'}
            </p>
            <p>Payment Terms: {invoice.purchase_orders?.payment_terms || '-'}</p>
            {invoice.email_sent_at && (
              <p>
                Sent to {invoice.email_sent_to} on{' '}
                {formatDate(invoice.email_sent_at)}
              </p>
            )}
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
            {invoice.invoice_items.map((item) => (
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
            value={formatCurrency(Number(invoice.subtotal || 0))}
          />
          <TotalLine
            label={`CGST (${Number(invoice.cgst_percent || 0)}%)`}
            value={formatCurrency(Number(invoice.cgst_amount || 0))}
          />
          <TotalLine
            label={`SGST (${Number(invoice.sgst_percent || 0)}%)`}
            value={formatCurrency(Number(invoice.sgst_amount || 0))}
          />
          <TotalLine label="Tax Total" value={formatCurrency(taxAmount)} />
          <TotalLine
            label="Total Amount Due"
            value={formatCurrency(Number(invoice.total_amount || 0))}
            strong
          />
        </div>

        {invoice.notes && (
          <div className="mt-8 rounded border border-slate-300 bg-slate-100 p-4">
            <h3 className="mb-2 font-bold">Notes</h3>
            <p className="text-sm text-slate-700">{invoice.notes}</p>
          </div>
        )}

        <div className="mt-8 border-t-2 border-slate-300 pt-6 text-xs text-slate-600">
          Please process payment by the due date. This invoice was generated by
          VendorBridge.
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

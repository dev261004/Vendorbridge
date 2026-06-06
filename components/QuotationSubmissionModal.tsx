'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, FileText, Send, Save } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  saveQuotationDraft,
  submitQuotation,
} from '@/app/actions/quotations'
import {
  QuotationFormValues,
  QuotationItemInput,
  VendorQuotationOpportunity,
} from '@/lib/quotations'

interface QuotationSubmissionModalProps {
  isOpen: boolean
  onClose: (message?: string) => void
  opportunity: VendorQuotationOpportunity | null
}

const inputClassName =
  'border-slate-600 bg-slate-700 text-white placeholder:text-slate-500'

function getDefaultValidUntil(deadline?: string) {
  return deadline || new Date().toISOString().slice(0, 10)
}

function buildItems(opportunity: VendorQuotationOpportunity): QuotationItemInput[] {
  const existingItems = opportunity.quotation?.quotation_items || []

  return opportunity.rfq.rfq_items.map((rfqItem) => {
    const existing = existingItems.find(
      (item) => item.rfq_item_id === rfqItem.id
    )

    return {
      rfq_item_id: rfqItem.id,
      item_name: rfqItem.item_name,
      quantity: Number(rfqItem.quantity || 0),
      unit: rfqItem.unit,
      unit_price: Number(existing?.unit_price || 0),
      delivery_days: Number(existing?.delivery_days || 0),
      notes: existing?.notes || '',
    }
  })
}

export default function QuotationSubmissionModal({
  isOpen,
  onClose,
  opportunity,
}: QuotationSubmissionModalProps) {
  const [form, setForm] = useState<QuotationFormValues | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [submitMode, setSubmitMode] = useState<'draft' | 'submitted' | null>(null)

  useEffect(() => {
    if (!isOpen || !opportunity) {
      setForm(null)
      setFormError(null)
      setSubmitMode(null)
      return
    }

    setForm({
      rfq_id: opportunity.rfq.id,
      valid_until:
        opportunity.quotation?.valid_until ||
        getDefaultValidUntil(opportunity.rfq.deadline),
      delivery_days: Number(opportunity.quotation?.delivery_days || 0),
      payment_terms: opportunity.quotation?.payment_terms || 'Net 30',
      notes: opportunity.quotation?.notes || '',
      gst_percent: Number(opportunity.quotation?.gst_percent || 18),
      items: buildItems(opportunity),
    })
    setFormError(null)
    setSubmitMode(null)
  }, [isOpen, opportunity])

  const totals = useMemo(() => {
    const subtotal =
      form?.items.reduce(
        (total, item) =>
          total + Number(item.quantity || 0) * Number(item.unit_price || 0),
        0
      ) || 0
    const gstAmount = subtotal * (Number(form?.gst_percent || 0) / 100)

    return {
      subtotal,
      gstAmount,
      totalAmount: subtotal + gstAmount,
    }
  }, [form])

  const isSubmitted = opportunity?.quotation?.status === 'submitted'

  const updateField = <K extends keyof QuotationFormValues>(
    key: K,
    value: QuotationFormValues[K]
  ) => {
    setForm((current) => (current ? { ...current, [key]: value } : current))
  }

  const updateItem = <K extends keyof QuotationItemInput>(
    index: number,
    key: K,
    value: QuotationItemInput[K]
  ) => {
    setForm((current) => {
      if (!current) return current

      return {
        ...current,
        items: current.items.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [key]: value } : item
        ),
      }
    })
  }

  const validateBeforeSubmit = () => {
    if (!form) return 'Quotation form is not ready.'
    if (!form.valid_until) return 'Select quotation validity date.'
    if (Number(form.delivery_days || 0) <= 0) {
      return 'Enter overall delivery timeline.'
    }
    if (form.items.some((item) => Number(item.unit_price || 0) <= 0)) {
      return 'Enter unit price for every RFQ item.'
    }

    return null
  }

  const handleSave = async (mode: 'draft' | 'submitted') => {
    if (!form) return

    if (mode === 'submitted') {
      const validationError = validateBeforeSubmit()

      if (validationError) {
        setFormError(validationError)
        return
      }
    }

    try {
      setIsSaving(true)
      setSubmitMode(mode)
      setFormError(null)

      if (mode === 'submitted') {
        await submitQuotation(form)
        onClose('Quotation submitted successfully.')
      } else {
        await saveQuotationDraft(form)
        onClose('Quotation draft saved.')
      }
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Failed to save quotation.'
      )
    } finally {
      setIsSaving(false)
      setSubmitMode(null)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent className="max-h-[94vh] max-w-6xl overflow-y-auto border-slate-700 bg-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>
            {isSubmitted ? 'Edit Submitted Quotation' : 'Submit Quotation'}
          </DialogTitle>
        </DialogHeader>

        {!opportunity || !form ? (
          <div className="py-10 text-center text-slate-400">Loading quotation...</div>
        ) : (
          <div className="space-y-6">
            <section className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
              <div className="mb-3 flex items-center gap-2">
                <FileText className="size-5 text-blue-400" />
                <h3 className="font-semibold text-white">
                  {opportunity.rfq.title}
                </h3>
              </div>
              <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-3">
                <span>{opportunity.rfq.rfq_number}</span>
                <span>{opportunity.rfq.category}</span>
                <span className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-slate-500" />
                  Deadline: {new Date(opportunity.rfq.deadline).toLocaleDateString()}
                </span>
              </div>
              {opportunity.rfq.description && (
                <p className="mt-3 text-sm text-slate-400">
                  {opportunity.rfq.description}
                </p>
              )}
            </section>

            <section className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
              <h3 className="mb-4 font-semibold text-white">Pricing Details</h3>
              <div className="space-y-3">
                {form.items.map((item, index) => {
                  const rfqItem = opportunity.rfq.rfq_items.find(
                    (sourceItem) => sourceItem.id === item.rfq_item_id
                  )
                  const total =
                    Number(item.quantity || 0) * Number(item.unit_price || 0)

                  return (
                    <div
                      key={item.rfq_item_id}
                      className="rounded-lg border border-slate-700 bg-slate-800 p-4"
                    >
                      <div className="mb-3 grid gap-3 lg:grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr]">
                        <div>
                          <p className="font-medium text-white">{item.item_name}</p>
                          <p className="text-xs text-slate-500">
                            {item.quantity} {item.unit}
                          </p>
                          {rfqItem?.specifications && (
                            <p className="mt-1 text-xs text-slate-500">
                              Specs: {rfqItem.specifications}
                            </p>
                          )}
                        </div>
                        <Field label="Unit Price">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(event) =>
                              updateItem(
                                index,
                                'unit_price',
                                Number(event.target.value || 0)
                              )
                            }
                            className={inputClassName}
                          />
                        </Field>
                        <Field label="Delivery Days">
                          <Input
                            type="number"
                            min="0"
                            value={item.delivery_days}
                            onChange={(event) =>
                              updateItem(
                                index,
                                'delivery_days',
                                Number(event.target.value || 0)
                              )
                            }
                            className={inputClassName}
                          />
                        </Field>
                        <div>
                          <p className="mb-2 text-sm font-medium text-slate-300">
                            Line Total
                          </p>
                          <p className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-semibold text-white">
                            Rs. {total.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                      <Textarea
                        value={item.notes}
                        onChange={(event) =>
                          updateItem(index, 'notes', event.target.value)
                        }
                        placeholder="Item notes, alternates, warranty, or comments"
                        className={inputClassName}
                        rows={2}
                      />
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="grid gap-4 rounded-lg border border-slate-700 bg-slate-900/40 p-4 md:grid-cols-2">
              <Field label="Overall Delivery Timeline">
                <Input
                  type="number"
                  min="0"
                  value={form.delivery_days}
                  onChange={(event) =>
                    updateField('delivery_days', Number(event.target.value || 0))
                  }
                  className={inputClassName}
                />
              </Field>
              <Field label="Quotation Valid Until">
                <Input
                  type="date"
                  value={form.valid_until}
                  onChange={(event) => updateField('valid_until', event.target.value)}
                  className={inputClassName}
                />
              </Field>
              <Field label="Payment Terms">
                <Input
                  value={form.payment_terms}
                  onChange={(event) =>
                    updateField('payment_terms', event.target.value)
                  }
                  placeholder="Net 30"
                  className={inputClassName}
                />
              </Field>
              <Field label="GST Percent">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.gst_percent}
                  onChange={(event) =>
                    updateField('gst_percent', Number(event.target.value || 0))
                  }
                  className={inputClassName}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Notes / Comments">
                  <Textarea
                    value={form.notes}
                    onChange={(event) => updateField('notes', event.target.value)}
                    placeholder="Commercial terms, delivery assumptions, warranty, or exclusions"
                    className={inputClassName}
                    rows={3}
                  />
                </Field>
              </div>
            </section>

            <section className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
              <div className="grid gap-3 text-sm md:grid-cols-3">
                <SummaryValue label="Subtotal" value={totals.subtotal} />
                <SummaryValue label="GST" value={totals.gstAmount} />
                <SummaryValue label="Total" value={totals.totalAmount} strong />
              </div>
            </section>

            {formError && (
              <div className="rounded-lg border border-red-700 bg-red-900/30 px-3 py-2 text-sm text-red-300">
                {formError}
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-slate-700 pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                onClick={() => onClose()}
                className="bg-slate-700 text-white hover:bg-slate-600"
              >
                Cancel
              </Button>
              {!isSubmitted && (
                <Button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSave('draft')}
                  className="bg-slate-600 text-white hover:bg-slate-500"
                >
                  <Save className="mr-2 size-4" />
                  {isSaving && submitMode === 'draft' ? 'Saving...' : 'Save Draft'}
                </Button>
              )}
              <Button
                type="button"
                disabled={isSaving}
                onClick={() => handleSave('submitted')}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <Send className="mr-2 size-4" />
                {isSaving && submitMode === 'submitted'
                  ? 'Submitting...'
                  : isSubmitted
                    ? 'Update Submitted Quotation'
                    : 'Submit Quotation'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>
      {children}
    </label>
  )
}

function SummaryValue({
  label,
  value,
  strong,
}: {
  label: string
  value: number
  strong?: boolean
}) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3">
      <p className="text-slate-400">{label}</p>
      <p className={strong ? 'text-2xl font-bold text-white' : 'text-lg font-semibold text-white'}>
        Rs. {value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
      </p>
    </div>
  )
}

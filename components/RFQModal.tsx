'use client'

import { useEffect, useMemo, useState } from 'react'
import { FileText, Paperclip, Plus, Trash2, Users } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import {
  addRFQAttachment,
  createRFQ,
  getRFQById,
  updateRFQ,
} from '@/app/actions/rfqs'
import { RFQFormValues, RFQItemInput, RFQStatus } from '@/lib/rfqs'
import { VendorRecord } from '@/lib/vendors'

const emptyItem: RFQItemInput = {
  item_name: '',
  description: '',
  quantity: 1,
  unit: 'nos',
  estimated_unit_price: 0,
  specifications: '',
}

const defaultForm: RFQFormValues = {
  title: '',
  category: '',
  description: '',
  deadline: '',
  status: 'draft',
  vendor_ids: [],
  items: [],
}

const fieldControlClass =
  'h-10 border-slate-600 bg-slate-900/70 text-white placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-blue-500/20'
const textAreaClass =
  'min-h-20 resize-none border-slate-600 bg-slate-900/70 text-white placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-blue-500/20'
const panelClass = 'rounded-lg border border-slate-700 bg-slate-900/45 p-4'

interface RFQModalProps {
  isOpen: boolean
  onClose: () => void
  rfqId: string | null
  vendors: VendorRecord[]
}

export default function RFQModal({
  isOpen,
  onClose,
  rfqId,
  vendors,
}: RFQModalProps) {
  const [form, setForm] = useState<RFQFormValues>(defaultForm)
  const [draftItem, setDraftItem] = useState<RFQItemInput>(emptyItem)
  const [attachments, setAttachments] = useState<File[]>([])
  const [existingAttachments, setExistingAttachments] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const activeVendors = useMemo(
    () => vendors.filter((vendor) => vendor.status === 'active'),
    [vendors]
  )

  useEffect(() => {
    const loadRFQ = async () => {
      if (!isOpen) {
        resetForm()
        return
      }

      if (!rfqId) {
        resetForm()
        return
      }

      try {
        setIsFetching(true)
        setFormError(null)
        const rfq = await getRFQById(rfqId)
        setForm({
          title: rfq.title,
          category: rfq.category,
          description: rfq.description || '',
          deadline: rfq.deadline,
          status: rfq.status === 'published' ? 'published' : 'draft',
          vendor_ids: rfq.rfq_vendor_invitations.map(
            (invitation) => invitation.vendor_id
          ),
          items: rfq.rfq_items.map((item) => ({
            item_name: item.item_name,
            description: item.description || '',
            quantity: Number(item.quantity),
            unit: item.unit,
            estimated_unit_price: Number(item.estimated_unit_price || 0),
            specifications: item.specifications || '',
          })),
        })
        setExistingAttachments(
          rfq.rfq_attachments.map((attachment) => attachment.file_name)
        )
      } catch (error) {
        setFormError(error instanceof Error ? error.message : 'Failed to load RFQ.')
      } finally {
        setIsFetching(false)
      }
    }

    loadRFQ()
  }, [isOpen, rfqId])

  const resetForm = () => {
    setForm(defaultForm)
    setDraftItem(emptyItem)
    setAttachments([])
    setExistingAttachments([])
    setFormError(null)
  }

  const updateForm = <K extends keyof RFQFormValues>(
    key: K,
    value: RFQFormValues[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleAddItem = () => {
    if (!draftItem.item_name.trim()) {
      setFormError('Enter a product or service name before adding the line item.')
      return
    }

    if (Number(draftItem.quantity) <= 0) {
      setFormError('Quantity must be greater than zero.')
      return
    }

    setForm((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          ...draftItem,
          item_name: draftItem.item_name.trim(),
          description: draftItem.description.trim(),
          unit: draftItem.unit.trim() || 'nos',
          quantity: Number(draftItem.quantity),
          estimated_unit_price: Number(draftItem.estimated_unit_price || 0),
          specifications: draftItem.specifications.trim(),
        },
      ],
    }))
    setDraftItem(emptyItem)
    setFormError(null)
  }

  const handleRemoveItem = (index: number) => {
    setForm((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const toggleVendor = (vendorId: string) => {
    setForm((current) => ({
      ...current,
      vendor_ids: current.vendor_ids.includes(vendorId)
        ? current.vendor_ids.filter((id) => id !== vendorId)
        : [...current.vendor_ids, vendorId],
    }))
  }

  const handleAttachmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter((file) => file.size <= 10 * 1024 * 1024)

    if (validFiles.length !== files.length) {
      setFormError('Each attachment must be 10MB or smaller.')
    }

    setAttachments(validFiles)
  }

  const validateForm = (status: Extract<RFQStatus, 'draft' | 'published'>) => {
    if (!form.title.trim()) return 'RFQ title is required.'
    if (!form.category.trim()) return 'Category is required.'
    if (!form.deadline) return 'Deadline is required.'
    if (form.items.length === 0) return 'Add at least one product or service.'
    if (status === 'published' && form.vendor_ids.length === 0) {
      return 'Assign at least one active vendor before sending the RFQ.'
    }

    return null
  }

  const uploadAttachments = async (rfqId: string, organizationId: string) => {
    if (attachments.length === 0) {
      return
    }

    const supabase = createClient()

    for (const file of attachments) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
      const storagePath = `${organizationId}/${rfqId}/${Date.now()}-${safeName}`

      const { error } = await supabase.storage
        .from('rfq-attachments')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) {
        throw error
      }

      await addRFQAttachment(rfqId, {
        file_name: file.name,
        storage_path: storagePath,
        mime_type: file.type,
        file_size: file.size,
      })
    }
  }

  const handleSubmit = async (
    status: Extract<RFQStatus, 'draft' | 'published'>
  ) => {
    const validationError = validateForm(status)

    if (validationError) {
      setFormError(validationError)
      return
    }

    try {
      setIsLoading(true)
      setFormError(null)

      const payload: RFQFormValues = {
        ...form,
        status,
        title: form.title.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
      }

      const rfq = rfqId ? await updateRFQ(rfqId, payload) : await createRFQ(payload)
      await uploadAttachments(rfq.id, rfq.organization_id)
      resetForm()
      onClose()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save RFQ.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-none overflow-hidden border-slate-700 bg-slate-800 p-0 text-white shadow-2xl sm:max-w-none xl:h-auto xl:max-h-[calc(100vh-2rem)] xl:w-[min(1180px,calc(100vw-4rem))]">
        <div className="flex max-h-[calc(100vh-2rem)] min-h-0 flex-col">
          <DialogHeader className="border-b border-slate-700 px-6 py-5 pr-14">
            <DialogTitle className="text-xl font-semibold text-white">
              {rfqId ? 'Edit RFQ' : 'Create RFQ'}
            </DialogTitle>
          </DialogHeader>

          {isFetching ? (
            <div className="flex min-h-96 items-center justify-center text-slate-400">
              Loading RFQ...
            </div>
          ) : (
            <>
              <div className="grid min-h-0 flex-1 gap-5 p-5 md:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
                <div className="min-w-0 space-y-5">
                  <section className={panelClass}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="RFQ Title">
                        <Input
                          value={form.title}
                          onChange={(event) =>
                            updateForm('title', event.target.value)
                          }
                          placeholder="Office furniture procurement Q2"
                          className={fieldControlClass}
                        />
                      </Field>
                      <Field label="Category">
                        <Input
                          value={form.category}
                          onChange={(event) =>
                            updateForm('category', event.target.value)
                          }
                          placeholder="Furniture, IT Hardware, Logistics"
                          className={fieldControlClass}
                        />
                      </Field>
                      <Field label="Deadline">
                        <Input
                          value={form.deadline}
                          onChange={(event) =>
                            updateForm('deadline', event.target.value)
                          }
                          type="date"
                          className={fieldControlClass}
                        />
                      </Field>
                      <Field label="Attachments">
                        <label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-600 bg-slate-900/70 px-3 text-sm text-slate-300 transition-colors hover:border-blue-400 hover:bg-slate-900">
                          <Paperclip className="size-4 text-blue-400" />
                          <span className="truncate">
                            {attachments.length > 0
                              ? `${attachments.length} file(s) selected`
                              : 'Choose files'}
                          </span>
                          <input
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleAttachmentChange}
                          />
                        </label>
                      </Field>
                    </div>

                    <div className="mt-4">
                      <Field label="Product / Service Details">
                        <Textarea
                          value={form.description}
                          onChange={(event) =>
                            updateForm('description', event.target.value)
                          }
                          placeholder="Describe the purchase requirement, delivery expectations, and quality conditions."
                          className={textAreaClass}
                          rows={3}
                        />
                      </Field>
                    </div>
                  </section>

                  <section className={panelClass}>
                    <div className="mb-4 flex items-center gap-2">
                      <FileText className="size-5 text-blue-400" />
                      <h3 className="font-semibold text-white">Line Item Entry</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                      <Input
                        value={draftItem.item_name}
                        onChange={(event) =>
                          setDraftItem((current) => ({
                            ...current,
                            item_name: event.target.value,
                          }))
                        }
                        placeholder="Item/service"
                        className={`${fieldControlClass} col-span-2 lg:col-span-2`}
                      />
                      <Input
                        value={draftItem.quantity}
                        onChange={(event) =>
                          setDraftItem((current) => ({
                            ...current,
                            quantity: Number(event.target.value || 1),
                          }))
                        }
                        type="number"
                        min="1"
                        className={fieldControlClass}
                      />
                      <Input
                        value={draftItem.unit}
                        onChange={(event) =>
                          setDraftItem((current) => ({
                            ...current,
                            unit: event.target.value,
                          }))
                        }
                        placeholder="Unit"
                        className={fieldControlClass}
                      />
                      <Input
                        value={draftItem.estimated_unit_price}
                        onChange={(event) =>
                          setDraftItem((current) => ({
                            ...current,
                            estimated_unit_price: Number(event.target.value || 0),
                          }))
                        }
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Est. price"
                        className={fieldControlClass}
                      />
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <Textarea
                        value={draftItem.description}
                        onChange={(event) =>
                          setDraftItem((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        placeholder="Short item description"
                        className={textAreaClass}
                        rows={2}
                      />
                      <Textarea
                        value={draftItem.specifications}
                        onChange={(event) =>
                          setDraftItem((current) => ({
                            ...current,
                            specifications: event.target.value,
                          }))
                        }
                        placeholder="Specifications or conditions"
                        className={textAreaClass}
                        rows={2}
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={handleAddItem}
                      className="mt-3 bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Plus className="mr-2 size-4" />
                      Add Line Item
                    </Button>
                  </section>
                </div>

                <div className="min-w-0 space-y-5">
                  <section className={panelClass}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <FileText className="size-5 text-blue-400" />
                        <h3 className="font-semibold text-white">Line Items</h3>
                      </div>
                      <span className="rounded-full border border-slate-600 px-2.5 py-1 text-xs text-slate-300">
                        {form.items.length} added
                      </span>
                    </div>

                    {form.items.length > 0 ? (
                      <div className="space-y-2">
                        {form.items.map((item, index) => (
                          <div
                            key={`${item.item_name}-${index}`}
                            className="flex items-start justify-between gap-3 rounded-lg border border-slate-700 bg-slate-800/80 p-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-medium text-white">
                                {item.item_name}
                              </p>
                              <p className="text-sm text-slate-400">
                                {item.quantity} {item.unit}
                                {item.estimated_unit_price > 0 &&
                                  ` @ Rs. ${item.estimated_unit_price}`}
                              </p>
                              {item.description && (
                                <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              className="text-red-400 hover:bg-red-900/20 hover:text-red-300"
                              onClick={() => handleRemoveItem(index)}
                              aria-label={`Remove ${item.item_name}`}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-700 bg-slate-800/50 p-4 text-sm text-slate-500">
                        No line items added yet.
                      </div>
                    )}
                  </section>

                  <section className={panelClass}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Users className="size-5 text-green-400" />
                        <h3 className="font-semibold text-white">Assign Vendors</h3>
                      </div>
                      <span className="rounded-full border border-slate-600 px-2.5 py-1 text-xs text-slate-300">
                        {form.vendor_ids.length} selected
                      </span>
                    </div>

                    {activeVendors.length === 0 ? (
                      <p className="rounded-lg border border-slate-700 bg-slate-800/50 p-3 text-sm text-slate-500">
                        No active vendors found. Add and activate vendors before
                        sending RFQs.
                      </p>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {activeVendors.map((vendor) => (
                          <label
                            key={vendor.id}
                            className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-700 bg-slate-800/80 p-3 transition-colors hover:border-green-500/70"
                          >
                            <input
                              type="checkbox"
                              checked={form.vendor_ids.includes(vendor.id)}
                              onChange={() => toggleVendor(vendor.id)}
                              className="mt-1 size-4 accent-green-500"
                            />
                            <span className="min-w-0">
                              <span className="block truncate font-medium text-white">
                                {vendor.name}
                              </span>
                              <span className="block truncate text-xs text-slate-500">
                                {vendor.category} - Rating{' '}
                                {Number(vendor.rating || 0).toFixed(1)}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </section>

                  {(existingAttachments.length > 0 || attachments.length > 0) && (
                    <section className={panelClass}>
                      <h3 className="mb-3 font-semibold text-white">Attachments</h3>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                        {existingAttachments.map((fileName) => (
                          <span
                            key={fileName}
                            className="max-w-full truncate rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5"
                          >
                            {fileName}
                          </span>
                        ))}
                        {attachments.map((file) => (
                          <span
                            key={file.name}
                            className="max-w-full truncate rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-blue-200"
                          >
                            {file.name}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  {formError && (
                    <div className="rounded-lg border border-red-700 bg-red-900/30 px-3 py-2 text-sm text-red-300">
                      {formError}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-3 border-t border-slate-700 bg-slate-900/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
                <Button
                  type="button"
                  onClick={onClose}
                  className="bg-slate-700 text-white hover:bg-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSubmit('draft')}
                  className="bg-slate-600 text-white hover:bg-slate-500"
                >
                  {isLoading ? 'Saving...' : 'Save as Draft'}
                </Button>
                <Button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSubmit('published')}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  {isLoading ? 'Sending...' : 'Save & Send to Vendors'}
                </Button>
              </div>
            </>
          )}
        </div>
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
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </label>
      {children}
    </div>
  )
}

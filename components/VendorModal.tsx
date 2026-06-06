'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  createVendor,
  getVendorById,
  updateVendor as updateVendorAction,
} from '@/app/actions/vendors'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatEmail, formatName, formatPhone } from '@/lib/formUtils'
import { VendorFormValues, VendorStatus } from '@/lib/vendors'

const vendorSchema = z.object({
  name: z
    .string()
    .min(2, 'Vendor name must be at least 2 characters')
    .regex(/^[a-zA-Z0-9\s.&()-]+$/, 'Unsupported characters in vendor name'),
  category: z
    .string()
    .min(2, 'Category is required')
    .regex(/^[a-zA-Z\s/&-]+$/, 'Special characters and numbers not allowed'),
  gst_number: z.string(),
  contact_person: z
    .string()
    .min(2, 'Contact person is required')
    .regex(/^[a-zA-Z\s.]+$/, 'Numbers and special characters not allowed'),
  email: z
    .string()
    .min(1, 'Email is required for vendor invite')
    .email('Invalid email'),
  phone: z
    .string()
    .min(10, 'Contact number must be at least 10 digits')
    .regex(/^[0-9+\-\s()]+$/, 'Only phone number characters allowed'),
  address: z.string().min(5, 'Address is required'),
  city: z
    .string()
    .min(2, 'City is required')
    .regex(/^[a-zA-Z\s]+$/, 'Numbers and special characters not allowed'),
  state: z
    .string()
    .min(2, 'State is required')
    .regex(/^[a-zA-Z\s]+$/, 'Numbers and special characters not allowed'),
  country: z.string().min(2, 'Country is required'),
  rating: z.number().min(0).max(5),
  status: z.enum(['pending', 'active', 'blocked', 'inactive']),
})

const defaultValues: VendorFormValues = {
  name: '',
  category: '',
  gst_number: '',
  contact_person: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  country: 'India',
  rating: 0,
  status: 'pending',
}

const selectClassName =
  'h-8 w-full rounded-lg border border-slate-600 bg-slate-700 px-2.5 text-sm text-white outline-none focus-visible:border-blue-500'

const nativeOptionStyle = {
  backgroundColor: '#0f172a',
  color: '#f8fafc',
}

interface VendorModalProps {
  isOpen: boolean
  onClose: (message?: string) => void
  vendorId: string | null
  readOnly?: boolean
}

export default function VendorModal({
  isOpen,
  onClose,
  vendorId,
  readOnly = false,
}: VendorModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues,
  })

  useEffect(() => {
    const loadVendor = async () => {
      if (!isOpen) {
        reset(defaultValues)
        setFormError(null)
        return
      }

      if (!vendorId) {
        reset(defaultValues)
        setFormError(null)
        return
      }

      try {
        setIsFetching(true)
        setFormError(null)
        const vendor = await getVendorById(vendorId)
        reset({
          name: vendor.name,
          category: vendor.category,
          gst_number: vendor.gst_number || '',
          contact_person: vendor.contact_person || '',
          email: vendor.email || '',
          phone: vendor.phone || '',
          address: vendor.address || '',
          city: vendor.city || '',
          state: vendor.state || '',
          country: vendor.country || 'India',
          rating: vendor.rating || 0,
          status: vendor.status,
        })
      } catch (error) {
        setFormError(error instanceof Error ? error.message : 'Failed to load vendor.')
      } finally {
        setIsFetching(false)
      }
    }

    loadVendor()
  }, [isOpen, reset, vendorId])

  const onSubmit = async (data: VendorFormValues) => {
    if (readOnly) {
      return
    }

    try {
      setIsLoading(true)
      setFormError(null)

      const payload: VendorFormValues = {
        name: formatName(data.name),
        category: formatName(data.category),
        gst_number: data.gst_number.trim().toUpperCase(),
        contact_person: formatName(data.contact_person),
        email: formatEmail(data.email),
        phone: formatPhone(data.phone),
        address: data.address.trim(),
        city: formatName(data.city),
        state: formatName(data.state),
        country: formatName(data.country),
        rating: Number(data.rating || 0),
        status: data.status,
      }

      if (vendorId) {
        await updateVendorAction(vendorId, payload)
        reset(defaultValues)
        onClose('Vendor details updated.')
      } else {
        const result = await createVendor(payload)
        reset(defaultValues)
        onClose(result.invite.message)
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save vendor.')
    } finally {
      setIsLoading(false)
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
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto border-slate-700 bg-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>
            {readOnly ? 'Vendor Details' : vendorId ? 'Edit Vendor' : 'Add New Vendor'}
          </DialogTitle>
        </DialogHeader>

        {isFetching ? (
          <div className="py-10 text-center text-slate-400">Loading vendor details...</div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <fieldset disabled={readOnly || isLoading} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Vendor Name" error={errors.name?.message}>
                  <Input
                    {...register('name')}
                    placeholder="Infra Supplies Pvt Ltd"
                    className="border-slate-600 bg-slate-700 text-white"
                  />
                </Field>

                <Field label="Category" error={errors.category?.message}>
                  <Input
                    {...register('category')}
                    placeholder="Furniture, IT, Logistics"
                    className="border-slate-600 bg-slate-700 text-white"
                  />
                </Field>

                <Field label="GST Number" error={errors.gst_number?.message}>
                  <Input
                    {...register('gst_number')}
                    placeholder="27AABCS1429B2Z0"
                    className="border-slate-600 bg-slate-700 text-white uppercase"
                  />
                </Field>

                <Field label="Contact Person" error={errors.contact_person?.message}>
                  <Input
                    {...register('contact_person')}
                    placeholder="Rahul Mehta"
                    className="border-slate-600 bg-slate-700 text-white"
                  />
                </Field>

                <Field label="Email" error={errors.email?.message}>
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="vendor@example.com"
                    className="border-slate-600 bg-slate-700 text-white"
                  />
                </Field>

                <Field label="Contact Number" error={errors.phone?.message}>
                  <Input
                    {...register('phone')}
                    placeholder="+91 98765 43210"
                    className="border-slate-600 bg-slate-700 text-white"
                  />
                </Field>

                <Field label="City" error={errors.city?.message}>
                  <Input
                    {...register('city')}
                    placeholder="Ahmedabad"
                    className="border-slate-600 bg-slate-700 text-white"
                  />
                </Field>

                <Field label="State" error={errors.state?.message}>
                  <Input
                    {...register('state')}
                    placeholder="Gujarat"
                    className="border-slate-600 bg-slate-700 text-white"
                  />
                </Field>

                <Field label="Country" error={errors.country?.message}>
                  <Input
                    {...register('country')}
                    placeholder="India"
                    className="border-slate-600 bg-slate-700 text-white"
                  />
                </Field>

                <Field label="Rating" error={errors.rating?.message}>
                  <Input
                    {...register('rating', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    className="border-slate-600 bg-slate-700 text-white"
                  />
                </Field>

                <Field label="Status" error={errors.status?.message}>
                  <select {...register('status')} className={selectClassName}>
                    {(['pending', 'active', 'blocked', 'inactive'] as VendorStatus[]).map(
                      (status) => (
                        <option key={status} value={status} style={nativeOptionStyle}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      )
                    )}
                  </select>
                </Field>
              </div>

              <Field label="Address" error={errors.address?.message}>
                <Textarea
                  {...register('address')}
                  placeholder="Full registered address"
                  className="border-slate-600 bg-slate-700 text-white"
                  rows={3}
                />
              </Field>
            </fieldset>

            {formError && (
              <div className="rounded-lg border border-red-700 bg-red-900/30 px-3 py-2 text-sm text-red-300">
                {formError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {!readOnly && (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                >
                  {isLoading ? 'Saving...' : vendorId ? 'Update Vendor' : 'Add Vendor'}
                </Button>
              )}
              <Button
                type="button"
                onClick={() => onClose()}
                className="flex-1 bg-slate-700 text-white hover:bg-slate-600"
              >
                {readOnly ? 'Close' : 'Cancel'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  )
}

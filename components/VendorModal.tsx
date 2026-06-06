'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createVendor, updateVendor as updateVendorAction } from '@/app/actions/vendors'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatName, formatEmail, formatPhone } from '@/lib/formUtils'

const vendorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Phone number must be 10 digits').max(10, 'Phone number must be 10 digits'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  country: z.string().min(2, 'Country is required'),
})

type VendorFormData = z.infer<typeof vendorSchema>

interface VendorModalProps {
  isOpen: boolean
  onClose: () => void
  vendorId: string | null
}

export default function VendorModal({ isOpen, onClose, vendorId }: VendorModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: '',
    },
  })

  useEffect(() => {
    if (!isOpen) {
      reset()
    }
  }, [isOpen, reset])

  const onSubmit = async (data: VendorFormData) => {
    try {
      setIsLoading(true)
      const formattedData = {
        name: formatName(data.name),
        email: formatEmail(data.email),
        phone: formatPhone(data.phone),
        address: data.address,
        city: data.city,
        country: data.country,
      }
      if (vendorId) {
        await updateVendorAction(vendorId, formattedData)
      } else {
        await createVendor(formattedData)
      }
      reset()
      onClose()
    } catch (error) {
      console.error('Failed to save vendor:', error)
      alert('Failed to save vendor. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>{vendorId ? 'Edit Vendor' : 'Add New Vendor'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Name
              </label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Vendor Name"
                    className="bg-slate-700 border-slate-600 text-white"
                    value={formatName(field.value)}
                    onChange={(e) => field.onChange(formatName(e.target.value))}
                  />
                )}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="email"
                    placeholder="vendor@example.com"
                    className="bg-slate-700 border-slate-600 text-white"
                    value={formatEmail(field.value)}
                    onChange={(e) => field.onChange(formatEmail(e.target.value))}
                  />
                )}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Phone
              </label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="9876543210"
                    className="bg-slate-700 border-slate-600 text-white"
                    value={formatPhone(field.value)}
                    onChange={(e) => field.onChange(formatPhone(e.target.value))}
                  />
                )}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                City
              </label>
              <Input
                {...register('city')}
                placeholder="City"
                className="bg-slate-700 border-slate-600 text-white"
              />
              {errors.city && (
                <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Country
              </label>
              <Input
                {...register('country')}
                placeholder="Country"
                className="bg-slate-700 border-slate-600 text-white"
              />
              {errors.country && (
                <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Address
            </label>
            <Input
              {...register('address')}
              placeholder="Full Address"
              className="bg-slate-700 border-slate-600 text-white"
            />
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
            >
              {isLoading ? 'Saving...' : vendorId ? 'Update Vendor' : 'Add Vendor'}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              className="bg-slate-700 hover:bg-slate-600 text-white flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

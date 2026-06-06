'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createVendor, updateVendor as updateVendorAction } from '@/app/actions/vendors'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const vendorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(5, 'Phone number is required'),
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
      if (vendorId) {
        await updateVendorAction(vendorId, data)
      } else {
        await createVendor(data)
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
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>{vendorId ? 'Edit Vendor' : 'Add New Vendor'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Name
              </label>
              <Input
                {...register('name')}
                placeholder="Vendor Name"
                className="bg-slate-700 border-slate-600 text-white"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <Input
                {...register('email')}
                type="email"
                placeholder="vendor@example.com"
                className="bg-slate-700 border-slate-600 text-white"
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
              <Input
                {...register('phone')}
                placeholder="Phone Number"
                className="bg-slate-700 border-slate-600 text-white"
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

'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppStore } from '@/lib/store'
import { RFQ, RFQItem } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'

const rfqSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  estimatedBudget: z.number().positive('Budget must be positive'),
  dueDate: z.string(),
})

type RFQFormData = z.infer<typeof rfqSchema>

interface RFQModalProps {
  isOpen: boolean
  onClose: () => void
  rfqId: string | null
}

export default function RFQModal({ isOpen, onClose, rfqId }: RFQModalProps) {
  const { getRFQ, addRFQ, updateRFQ } = useAppStore()
  const rfq = rfqId ? getRFQ(rfqId) : null
  const [items, setItems] = useState<RFQItem[]>([])
  const [newItem, setNewItem] = useState({
    description: '',
    quantity: 1,
    unit: 'pieces',
    estimatedPrice: 0,
  })

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<RFQFormData>({
    resolver: zodResolver(rfqSchema),
  })

  useEffect(() => {
    if (rfq) {
      reset({
        title: rfq.title,
        description: rfq.description,
        estimatedBudget: rfq.estimatedBudget,
        dueDate: rfq.dueDate.toISOString().split('T')[0],
      })
      setItems(rfq.items)
    } else {
      reset({
        title: '',
        description: '',
        estimatedBudget: 0,
        dueDate: '',
      })
      setItems([])
    }
  }, [rfq, reset])

  const handleAddItem = () => {
    if (newItem.description.trim()) {
      setItems([
        ...items,
        {
          id: String(Date.now()),
          ...newItem,
          specifications: '',
        },
      ])
      setNewItem({
        description: '',
        quantity: 1,
        unit: 'pieces',
        estimatedPrice: 0,
      })
    }
  }

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter((item) => item.id !== itemId))
  }

  const onSubmit = (data: RFQFormData) => {
    if (items.length === 0) {
      alert('Please add at least one item to the RFQ')
      return
    }

    const rfqData = {
      ...data,
      dueDate: new Date(data.dueDate),
      items,
      status: rfq?.status || 'draft',
      createdBy: 'current-user',
      vendors: rfq?.vendors || [],
    }

    if (rfq) {
      updateRFQ(rfq.id, rfqData)
    } else {
      addRFQ({
        id: String(Date.now()),
        number: `RFQ-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...rfqData,
      } as RFQ)
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rfq ? 'Edit RFQ' : 'Create New RFQ'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                RFQ Title
              </label>
              <Input
                {...register('title')}
                placeholder="e.g., Electronic Components Supply"
                className="bg-slate-700 border-slate-600 text-white"
              />
              {errors.title && (
                <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                placeholder="Detailed description of what you need..."
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md focus:outline-none focus:border-blue-500 text-sm"
                rows={3}
              />
              {errors.description && (
                <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Estimated Budget
                </label>
                <Input
                  {...register('estimatedBudget', { valueAsNumber: true })}
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  className="bg-slate-700 border-slate-600 text-white"
                />
                {errors.estimatedBudget && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.estimatedBudget.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Due Date
                </label>
                <Input
                  {...register('dueDate')}
                  type="date"
                  className="bg-slate-700 border-slate-600 text-white"
                />
                {errors.dueDate && (
                  <p className="text-red-400 text-xs mt-1">{errors.dueDate.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="border-t border-slate-700 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Line Items</h3>

            {items.length > 0 && (
              <div className="space-y-2 mb-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg border border-slate-600"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium">{item.description}</p>
                      <p className="text-slate-400 text-sm">
                        {item.quantity} {item.unit}
                        {item.estimatedPrice && ` @ $${item.estimatedPrice}`}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Item Description
                </label>
                <Input
                  value={newItem.description}
                  onChange={(e) =>
                    setNewItem({ ...newItem, description: e.target.value })
                  }
                  placeholder="What do you need?"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Quantity
                  </label>
                  <Input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) =>
                      setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })
                    }
                    min="1"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Unit
                  </label>
                  <Input
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    placeholder="pieces, units, etc"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Est. Unit Price
                  </label>
                  <Input
                    type="number"
                    value={newItem.estimatedPrice}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        estimatedPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                    step="0.01"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={handleAddItem}
                className="w-full bg-slate-600 hover:bg-slate-500 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {rfq ? 'Update RFQ' : 'Create RFQ'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

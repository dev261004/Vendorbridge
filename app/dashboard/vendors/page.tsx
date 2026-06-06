'use client'

import { useState, useEffect } from 'react'
import { Plus, Star, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import VendorModal from '@/components/VendorModal'
import VendorTable from '@/components/VendorTable'
import { getVendors } from '@/app/actions/vendors'

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null)

  useEffect(() => {
    loadVendors()
  }, [])

  const loadVendors = async () => {
    try {
      setIsLoading(true)
      const data = await getVendors()
      setVendors(data)
    } catch (error) {
      console.error('Failed to load vendors:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddVendor = () => {
    setSelectedVendor(null)
    setIsModalOpen(true)
  }

  const handleEditVendor = (vendorId: string) => {
    setSelectedVendor(vendorId)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedVendor(null)
    loadVendors()
  }

  return (
    <div className="p-8 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Vendor Management</h1>
          <p className="text-slate-400">Manage and track all suppliers and vendors</p>
        </div>
        <Button
          onClick={handleAddVendor}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-300 font-medium">Total Vendors</h3>
            <Building2 className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-white">{vendors.length}</p>
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-300 font-medium">Active Vendors</h3>
            <Building2 className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-white">
            {vendors.filter((v) => v.status === 'active').length}
          </p>
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-300 font-medium">Avg Rating</h3>
            <Star className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-white">
            {(vendors.reduce((sum, v) => sum + v.rating, 0) / vendors.length).toFixed(1)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <VendorTable vendors={vendors} onEdit={handleEditVendor} />
      </div>

      {/* Modal */}
      <VendorModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        vendorId={selectedVendor}
      />
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import { Building2, Plus, Search, ShieldBan, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import VendorModal from '@/components/VendorModal'
import VendorTable from '@/components/VendorTable'
import {
  getVendorAccess,
  getVendors,
  updateVendorStatus,
} from '@/app/actions/vendors'
import {
  VendorRecord,
  VendorStatus,
  VendorStatusFilter,
  vendorStatuses,
} from '@/lib/vendors'

export default function VendorsPage() {
  const [vendors, setVendors] = useState<VendorRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<VendorStatusFilter>('all')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [canManageVendors, setCanManageVendors] = useState(false)

  useEffect(() => {
    loadVendors()
  }, [])

  const loadVendors = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const [data, access] = await Promise.all([
        getVendors(),
        getVendorAccess(),
      ])
      setVendors(data)
      setCanManageVendors(access.canManage)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load vendors.')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredVendors = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return vendors.filter((vendor) => {
      const matchesStatus =
        statusFilter === 'all' || vendor.status === statusFilter
      const matchesSearch =
        !query ||
        [
          vendor.name,
          vendor.category,
          vendor.gst_number,
          vendor.contact_person,
          vendor.email,
          vendor.phone,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query))

      return matchesStatus && matchesSearch
    })
  }, [searchQuery, statusFilter, vendors])

  const stats = useMemo(() => {
    const active = vendors.filter((vendor) => vendor.status === 'active').length
    const pending = vendors.filter((vendor) => vendor.status === 'pending').length
    const blocked = vendors.filter((vendor) => vendor.status === 'blocked').length
    const averageRating =
      vendors.length === 0
        ? '0.0'
        : (
            vendors.reduce(
              (sum, vendor) => sum + Number(vendor.rating || 0),
              0
            ) / vendors.length
          ).toFixed(1)

    return {
      total: vendors.length,
      active,
      pending,
      blocked,
      averageRating,
    }
  }, [vendors])

  const getStatusCount = (status: VendorStatusFilter) => {
    if (status === 'all') {
      return vendors.length
    }

    return vendors.filter((vendor) => vendor.status === status).length
  }

  const handleAddVendor = () => {
    if (!canManageVendors) {
      setError('Only admins can add vendors.')
      return
    }

    setSuccess(null)
    setSelectedVendor(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const handleViewVendor = (vendorId: string) => {
    setSuccess(null)
    setSelectedVendor(vendorId)
    setModalMode('view')
    setIsModalOpen(true)
  }

  const handleEditVendor = (vendorId: string) => {
    if (!canManageVendors) {
      handleViewVendor(vendorId)
      return
    }

    setSuccess(null)
    setSelectedVendor(vendorId)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleCloseModal = (message?: string) => {
    setIsModalOpen(false)
    setSelectedVendor(null)
    setModalMode('create')
    if (typeof message === 'string' && message.length > 0) {
      setSuccess(message)
    }
    loadVendors()
  }

  const handleStatusChange = async (
    vendorId: string,
    status: VendorStatus
  ) => {
    const vendor = vendors.find((item) => item.id === vendorId)
    const statusText = status.charAt(0).toUpperCase() + status.slice(1)

    if (
      status !== 'active' &&
      !window.confirm(`Change ${vendor?.name || 'this vendor'} to ${statusText}?`)
    ) {
      return
    }

    try {
      setError(null)
      setSuccess(null)
      const updatedVendor = await updateVendorStatus(vendorId, status)
      setVendors((currentVendors) =>
        currentVendors.map((item) =>
          item.id === updatedVendor.id ? updatedVendor : item
        )
      )
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to update vendor status.'
      )
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-white">
            Vendor Management
          </h1>
          <p className="text-slate-400">
            {canManageVendors
              ? 'Manage supplier profiles, GST details, categories, and status.'
              : 'View supplier profiles for RFQ assignment and procurement workflows.'}
          </p>
        </div>
        {canManageVendors && (
          <Button
            onClick={handleAddVendor}
            className="w-fit bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="mr-2 size-4" />
            Add Vendor
          </Button>
        )}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <StatCard
          title="Total Vendors"
          value={stats.total}
          icon={<Building2 className="size-5 text-blue-500" />}
        />
        <StatCard
          title="Active Vendors"
          value={stats.active}
          icon={<Building2 className="size-5 text-green-500" />}
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={<Star className="size-5 text-yellow-500" />}
        />
        <StatCard
          title="Blocked"
          value={stats.blocked}
          icon={<ShieldBan className="size-5 text-red-500" />}
          helper={`Avg rating: ${stats.averageRating}`}
        />
      </div>

      <div className="mb-6 rounded-lg border border-slate-700 bg-slate-800 p-5">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-500" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name, GST number, category, contact..."
              className="border-slate-600 bg-slate-700 pl-9 text-white placeholder:text-slate-500"
            />
          </div>
          <Button
            onClick={loadVendors}
            className="bg-slate-700 text-white hover:bg-slate-600"
          >
            Refresh
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {vendorStatuses.map((status) => (
            <button
              key={status.value}
              onClick={() => setStatusFilter(status.value)}
              className={
                statusFilter === status.value
                  ? 'rounded-full border border-blue-600 bg-blue-600 px-3 py-1 text-xs font-medium text-white'
                  : 'rounded-full border border-slate-600 bg-slate-700 px-3 py-1 text-xs font-medium text-slate-300 hover:bg-slate-600'
              }
            >
              {status.label} ({getStatusCount(status.value)})
            </button>
          ))}
        </div>
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

      <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
        <VendorTable
          vendors={filteredVendors}
          isLoading={isLoading}
          canManage={canManageVendors}
          onView={handleViewVendor}
          onEdit={handleEditVendor}
          onStatusChange={handleStatusChange}
        />
      </div>

      <VendorModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        vendorId={selectedVendor}
        readOnly={modalMode === 'view'}
      />
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  helper,
}: {
  title: string
  value: number | string
  icon: React.ReactNode
  helper?: string
}) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-medium text-slate-300">{title}</h3>
        {icon}
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {helper && <p className="mt-2 text-xs text-slate-500">{helper}</p>}
    </div>
  )
}

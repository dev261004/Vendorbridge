'use client'

import { Vendor } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Edit, Eye, Trash2 } from 'lucide-react'
import { useAppStore } from '@/lib/store'

interface VendorTableProps {
  vendors: Vendor[]
  onEdit: (vendorId: string) => void
}

export default function VendorTable({ vendors, onEdit }: VendorTableProps) {
  const { updateVendor } = useAppStore()

  const handleDelete = (vendorId: string) => {
    if (confirm('Are you sure you want to delete this vendor?')) {
      updateVendor(vendmakeorId, { status: 'inactive' })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-900/30 text-green-400 border-green-700'
      case 'inactive':
        return 'bg-slate-700/30 text-slate-400 border-slate-600'
      case 'suspended':
        return 'bg-red-900/30 text-red-400 border-red-700'
      default:
        return 'bg-slate-700/30 text-slate-400 border-slate-600'
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-400'
    if (rating >= 4) return 'text-yellow-400'
    if (rating >= 3.5) return 'text-orange-400'
    return 'text-red-400'
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-700 hover:bg-slate-700/50">
            <TableHead className="text-slate-300">Name</TableHead>
            <TableHead className="text-slate-300">Email</TableHead>
            <TableHead className="text-slate-300">Contact</TableHead>
            <TableHead className="text-slate-300">Rating</TableHead>
            <TableHead className="text-slate-300">Status</TableHead>
            <TableHead className="text-slate-300 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendors.length === 0 ? (
            <TableRow className="border-slate-700 hover:bg-slate-700/50">
              <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                No vendors found
              </TableCell>
            </TableRow>
          ) : (
            vendors.map((vendor) => (
              <TableRow key={vendor.id} className="border-slate-700 hover:bg-slate-700/50">
                <TableCell className="text-white font-medium">{vendor.name}</TableCell>
                <TableCell className="text-slate-400 text-sm">{vendor.email}</TableCell>
                <TableCell className="text-slate-400 text-sm">{vendor.contactPerson}</TableCell>
                <TableCell>
                  <span className={`font-medium ${getRatingColor(vendor.rating)}`}>
                    ★ {vendor.rating.toFixed(1)}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(vendor.status)}`}
                  >
                    {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                      onClick={() => onEdit(vendor.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                      onClick={() => onEdit(vendor.id)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      onClick={() => handleDelete(vendor.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

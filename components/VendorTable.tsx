'use client'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Edit, Eye, ShieldBan, UserCheck, UserMinus } from 'lucide-react'
import {
  VendorRecord,
  VendorStatus,
  vendorStatusLabels,
} from '@/lib/vendors'

interface VendorTableProps {
  vendors: VendorRecord[]
  isLoading?: boolean
  onEdit: (vendorId: string) => void
  onStatusChange: (vendorId: string, status: VendorStatus) => void
}

export default function VendorTable({
  vendors,
  isLoading = false,
  onEdit,
  onStatusChange,
}: VendorTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'border-green-700 bg-green-900/30 text-green-400'
      case 'pending':
        return 'border-yellow-700 bg-yellow-900/30 text-yellow-400'
      case 'blocked':
        return 'border-red-700 bg-red-900/30 text-red-400'
      case 'inactive':
        return 'border-slate-600 bg-slate-700/30 text-slate-400'
      default:
        return 'border-slate-600 bg-slate-700/30 text-slate-400'
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-400'
    if (rating >= 4) return 'text-yellow-400'
    if (rating >= 3) return 'text-orange-400'
    return 'text-slate-400'
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-slate-700 hover:bg-slate-700/50">
          <TableHead className="text-slate-300">Vendor</TableHead>
          <TableHead className="text-slate-300">Category</TableHead>
          <TableHead className="text-slate-300">GST No.</TableHead>
          <TableHead className="text-slate-300">Contact</TableHead>
          <TableHead className="text-slate-300">Rating</TableHead>
          <TableHead className="text-slate-300">Status</TableHead>
          <TableHead className="text-right text-slate-300">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow className="border-slate-700 hover:bg-slate-700/50">
            <TableCell colSpan={7} className="py-8 text-center text-slate-500">
              Loading vendors...
            </TableCell>
          </TableRow>
        ) : vendors.length === 0 ? (
          <TableRow className="border-slate-700 hover:bg-slate-700/50">
            <TableCell colSpan={7} className="py-8 text-center text-slate-500">
              No vendors found
            </TableCell>
          </TableRow>
        ) : (
          vendors.map((vendor) => (
            <TableRow
              key={vendor.id}
              className="border-slate-700 hover:bg-slate-700/50"
            >
              <TableCell>
                <div>
                  <p className="font-medium text-white">{vendor.name}</p>
                  <p className="text-xs text-slate-500">{vendor.email || 'No email'}</p>
                </div>
              </TableCell>
              <TableCell className="text-sm text-slate-300">
                {vendor.category}
              </TableCell>
              <TableCell className="text-sm text-slate-400">
                {vendor.gst_number || '-'}
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <p className="text-slate-300">{vendor.contact_person || '-'}</p>
                  <p className="text-xs text-slate-500">{vendor.phone || '-'}</p>
                </div>
              </TableCell>
              <TableCell>
                <span className={`font-medium ${getRatingColor(vendor.rating)}`}>
                  {Number(vendor.rating || 0).toFixed(1)}
                </span>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${getStatusColor(
                    vendor.status
                  )}`}
                >
                  {vendorStatusLabels[vendor.status]}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-blue-400 hover:bg-blue-900/20 hover:text-blue-300"
                    onClick={() => onEdit(vendor.id)}
                    title="View vendor"
                  >
                    <Eye className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-blue-400 hover:bg-blue-900/20 hover:text-blue-300"
                    onClick={() => onEdit(vendor.id)}
                    title="Edit vendor"
                  >
                    <Edit className="size-4" />
                  </Button>
                  {vendor.status !== 'active' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-green-400 hover:bg-green-900/20 hover:text-green-300"
                      onClick={() => onStatusChange(vendor.id, 'active')}
                      title="Activate vendor"
                    >
                      <UserCheck className="size-4" />
                    </Button>
                  )}
                  {vendor.status !== 'blocked' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:bg-red-900/20 hover:text-red-300"
                      onClick={() => onStatusChange(vendor.id, 'blocked')}
                      title="Block vendor"
                    >
                      <ShieldBan className="size-4" />
                    </Button>
                  )}
                  {vendor.status !== 'inactive' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-400 hover:bg-slate-700 hover:text-white"
                      onClick={() => onStatusChange(vendor.id, 'inactive')}
                      title="Mark inactive"
                    >
                      <UserMinus className="size-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

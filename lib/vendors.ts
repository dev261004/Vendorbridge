export type VendorStatus = 'pending' | 'active' | 'blocked' | 'inactive'

export type VendorStatusFilter = VendorStatus | 'all'

export interface VendorRecord {
  id: string
  organization_id: string
  name: string
  category: string
  gst_number: string | null
  contact_person: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  rating: number
  status: VendorStatus
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface VendorFormValues {
  name: string
  category: string
  gst_number: string
  contact_person: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  country: string
  rating: number
  status: VendorStatus
}

export const vendorStatuses: Array<{
  value: VendorStatusFilter
  label: string
}> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'inactive', label: 'Inactive' },
]

export const vendorStatusLabels: Record<VendorStatus, string> = {
  pending: 'Pending',
  active: 'Active',
  blocked: 'Blocked',
  inactive: 'Inactive',
}

export type AppRole =
  | 'admin'
  | 'procurement_officer'
  | 'manager'
  | 'vendor'
  | 'finance'

export const publicSignupRoleOptions = [
  {
    value: 'procurement_officer',
    label: 'Procurement Officer',
    description: 'Create and manage RFQs, POs, and vendor evaluations.',
  },
  {
    value: 'manager',
    label: 'Manager',
    description: 'Approve RFQs, review quotations, and oversee procurement workflows.',
  },
  {
    value: 'finance',
    label: 'Finance',
    description: 'Process invoices, validate POs, and manage payment workflows.',
  },
  {
    value: 'vendor',
    label: 'Vendor',
    description: 'Respond to RFQs, submit quotations, and track POs and invoices.',
  },
] as const

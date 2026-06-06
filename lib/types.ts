// User roles
export type UserRole = 'admin' | 'procurement_manager' | 'vendor' | 'finance'

// User
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  company?: string
  createdAt: Date
}

// Vendor
export interface Vendor {
  id: string
  name: string
  email: string
  contactPerson: string
  address: string
  city: string
  country: string
  phoneNumber: string
  website?: string
  rating: number
  status: 'active' | 'inactive' | 'suspended'
  categories: string[]
  createdAt: Date
  updatedAt: Date
}

// RFQ (Request for Quotation)
export interface RFQ {
  id: string
  number: string
  title: string
  description: string
  items: RFQItem[]
  estimatedBudget: number
  dueDate: Date
  status: 'draft' | 'published' | 'closed' | 'cancelled'
  createdBy: string
  createdAt: Date
  updatedAt: Date
  vendors: string[] // vendor IDs
}

export interface RFQItem {
  id: string
  description: string
  quantity: number
  unit: string
  estimatedPrice?: number
  specifications?: string
}

// Quotation
export interface Quotation {
  id: string
  rfqId: string
  vendorId: string
  quotationNumber: string
  items: QuotationItem[]
  totalAmount: number
  validUntil: Date
  deliveryDate: Date
  paymentTerms: string
  status: 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'expired'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface QuotationItem {
  id: string
  rfqItemId: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
}

// Purchase Order
export interface PurchaseOrder {
  id: string
  poNumber: string
  vendorId: string
  rfqId: string
  quotationId: string
  items: POItem[]
  totalAmount: number
  orderDate: Date
  deliveryDate: Date
  paymentTerms: string
  status: 'draft' | 'sent' | 'acknowledged' | 'partial_delivery' | 'completed' | 'cancelled'
  notes?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface POItem {
  id: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  receivedQuantity?: number
}

// Invoice
export interface Invoice {
  id: string
  invoiceNumber: string
  poId: string
  vendorId: string
  items: InvoiceItem[]
  totalAmount: number
  dueDate: Date
  invoiceDate: Date
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue'
  paymentMethod?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
}

// Audit Log
export interface AuditLog {
  id: string
  userId: string
  action: string
  entityType: string
  entityId: string
  changes?: Record<string, unknown>
  timestamp: Date
}

// Dashboard Statistics
export interface DashboardStats {
  totalVendors: number
  activeRFQs: number
  pendingQuotations: number
  totalPOs: number
  pendingInvoices: number
  totalSpent: number
}

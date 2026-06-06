import { create } from 'zustand'
import { User, Vendor, RFQ, Quotation, PurchaseOrder, Invoice, AuditLog } from './types'
import {
  mockUsers,
  mockVendors,
  mockRFQs,
  mockQuotations,
  mockPOs,
  mockInvoices,
  mockAuditLogs,
} from './mockData'

interface AppState {
  // Auth
  currentUser: User | null
  isLoggedIn: boolean
  login: (email: string, password: string) => boolean
  logout: () => void

  // Data
  vendors: Vendor[]
  rfqs: RFQ[]
  quotations: Quotation[]
  pos: PurchaseOrder[]
  invoices: Invoice[]
  auditLogs: AuditLog[]

  // Vendor operations
  addVendor: (vendor: Vendor) => void
  updateVendor: (id: string, updates: Partial<Vendor>) => void
  getVendor: (id: string) => Vendor | undefined

  // RFQ operations
  addRFQ: (rfq: RFQ) => void
  updateRFQ: (id: string, updates: Partial<RFQ>) => void
  getRFQ: (id: string) => RFQ | undefined

  // Quotation operations
  addQuotation: (quotation: Quotation) => void
  updateQuotation: (id: string, updates: Partial<Quotation>) => void
  getQuotation: (id: string) => Quotation | undefined
  getQuotationsByRFQ: (rfqId: string) => Quotation[]

  // PO operations
  addPO: (po: PurchaseOrder) => void
  updatePO: (id: string, updates: Partial<PurchaseOrder>) => void
  getPO: (id: string) => PurchaseOrder | undefined

  // Invoice operations
  addInvoice: (invoice: Invoice) => void
  updateInvoice: (id: string, updates: Partial<Invoice>) => void
  getInvoice: (id: string) => Invoice | undefined

  // Audit
  addAuditLog: (log: AuditLog) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Auth
  currentUser: null,
  isLoggedIn: false,

  login: (email: string, password: string) => {
    // Mock authentication - any email/password works for demo
    const user = mockUsers.find((u) => u.email === email) || mockUsers[1] // Default to manager
    if (user) {
      set({ currentUser: user, isLoggedIn: true })
      return true
    }
    return false
  },

  logout: () => {
    set({ currentUser: null, isLoggedIn: false })
  },

  // Initial data
  vendors: mockVendors,
  rfqs: mockRFQs,
  quotations: mockQuotations,
  pos: mockPOs,
  invoices: mockInvoices,
  auditLogs: mockAuditLogs,

  // Vendor operations
  addVendor: (vendor: Vendor) => {
    set((state) => ({
      vendors: [...state.vendors, vendor],
    }))
    get().addAuditLog({
      id: String(Date.now()),
      userId: get().currentUser?.id || '',
      action: 'CREATE',
      entityType: 'Vendor',
      entityId: vendor.id,
      timestamp: new Date(),
    })
  },

  updateVendor: (id: string, updates: Partial<Vendor>) => {
    set((state) => ({
      vendors: state.vendors.map((v) => (v.id === id ? { ...v, ...updates, updatedAt: new Date() } : v)),
    }))
    get().addAuditLog({
      id: String(Date.now()),
      userId: get().currentUser?.id || '',
      action: 'UPDATE',
      entityType: 'Vendor',
      entityId: id,
      changes: updates,
      timestamp: new Date(),
    })
  },

  getVendor: (id: string) => {
    return get().vendors.find((v) => v.id === id)
  },

  // RFQ operations
  addRFQ: (rfq: RFQ) => {
    set((state) => ({
      rfqs: [...state.rfqs, rfq],
    }))
    get().addAuditLog({
      id: String(Date.now()),
      userId: get().currentUser?.id || '',
      action: 'CREATE',
      entityType: 'RFQ',
      entityId: rfq.id,
      timestamp: new Date(),
    })
  },

  updateRFQ: (id: string, updates: Partial<RFQ>) => {
    set((state) => ({
      rfqs: state.rfqs.map((r) => (r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r)),
    }))
    get().addAuditLog({
      id: String(Date.now()),
      userId: get().currentUser?.id || '',
      action: 'UPDATE',
      entityType: 'RFQ',
      entityId: id,
      changes: updates,
      timestamp: new Date(),
    })
  },

  getRFQ: (id: string) => {
    return get().rfqs.find((r) => r.id === id)
  },

  // Quotation operations
  addQuotation: (quotation: Quotation) => {
    set((state) => ({
      quotations: [...state.quotations, quotation],
    }))
    get().addAuditLog({
      id: String(Date.now()),
      userId: get().currentUser?.id || '',
      action: 'CREATE',
      entityType: 'Quotation',
      entityId: quotation.id,
      timestamp: new Date(),
    })
  },

  updateQuotation: (id: string, updates: Partial<Quotation>) => {
    set((state) => ({
      quotations: state.quotations.map((q) =>
        q.id === id ? { ...q, ...updates, updatedAt: new Date() } : q
      ),
    }))
    get().addAuditLog({
      id: String(Date.now()),
      userId: get().currentUser?.id || '',
      action: 'UPDATE',
      entityType: 'Quotation',
      entityId: id,
      changes: updates,
      timestamp: new Date(),
    })
  },

  getQuotation: (id: string) => {
    return get().quotations.find((q) => q.id === id)
  },

  getQuotationsByRFQ: (rfqId: string) => {
    return get().quotations.filter((q) => q.rfqId === rfqId)
  },

  // PO operations
  addPO: (po: PurchaseOrder) => {
    set((state) => ({
      pos: [...state.pos, po],
    }))
    get().addAuditLog({
      id: String(Date.now()),
      userId: get().currentUser?.id || '',
      action: 'CREATE',
      entityType: 'PurchaseOrder',
      entityId: po.id,
      timestamp: new Date(),
    })
  },

  updatePO: (id: string, updates: Partial<PurchaseOrder>) => {
    set((state) => ({
      pos: state.pos.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p)),
    }))
    get().addAuditLog({
      id: String(Date.now()),
      userId: get().currentUser?.id || '',
      action: 'UPDATE',
      entityType: 'PurchaseOrder',
      entityId: id,
      changes: updates,
      timestamp: new Date(),
    })
  },

  getPO: (id: string) => {
    return get().pos.find((p) => p.id === id)
  },

  // Invoice operations
  addInvoice: (invoice: Invoice) => {
    set((state) => ({
      invoices: [...state.invoices, invoice],
    }))
    get().addAuditLog({
      id: String(Date.now()),
      userId: get().currentUser?.id || '',
      action: 'CREATE',
      entityType: 'Invoice',
      entityId: invoice.id,
      timestamp: new Date(),
    })
  },

  updateInvoice: (id: string, updates: Partial<Invoice>) => {
    set((state) => ({
      invoices: state.invoices.map((i) =>
        i.id === id ? { ...i, ...updates, updatedAt: new Date() } : i
      ),
    }))
    get().addAuditLog({
      id: String(Date.now()),
      userId: get().currentUser?.id || '',
      action: 'UPDATE',
      entityType: 'Invoice',
      entityId: id,
      changes: updates,
      timestamp: new Date(),
    })
  },

  getInvoice: (id: string) => {
    return get().invoices.find((i) => i.id === id)
  },

  // Audit
  addAuditLog: (log: AuditLog) => {
    set((state) => ({
      auditLogs: [...state.auditLogs, log],
    }))
  },
}))

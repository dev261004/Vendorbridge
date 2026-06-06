'use client'

import { useAppStore } from '@/lib/store'
import { Users, FileText, Package, Receipt, TrendingUp, Clock } from 'lucide-react'
import { useMemo } from 'react'

export default function DashboardPage() {
  const { currentUser, vendors, rfqs, quotations, pos, invoices } = useAppStore()

  const stats = useMemo(() => {
    const activeVendors = vendors.filter((v) => v.status === 'active').length
    const publishedRFQs = rfqs.filter((r) => r.status === 'published').length
    const pendingQuotations = quotations.filter((q) => q.status === 'submitted').length
    const totalPOs = pos.length
    const pendingInvoices = invoices.filter((i) => i.paymentStatus === 'pending').length
    const totalSpent = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)

    return {
      activeVendors,
      publishedRFQs,
      pendingQuotations,
      totalPOs,
      pendingInvoices,
      totalSpent,
    }
  }, [vendors, rfqs, quotations, pos, invoices])

  const recentActivities = useMemo(() => {
    const activities = []
    if (rfqs.length > 0) activities.push({ type: 'RFQ', label: `${rfqs.length} RFQs Created`, icon: FileText })
    if (quotations.length > 0) activities.push({ type: 'Quotation', label: `${quotations.length} Quotations`, icon: Package })
    if (pos.length > 0) activities.push({ type: 'PO', label: `${pos.length} Purchase Orders`, icon: Package })
    if (invoices.length > 0) activities.push({ type: 'Invoice', label: `${invoices.length} Invoices`, icon: Receipt })
    return activities.slice(0, 4)
  }, [rfqs, quotations, pos, invoices])

  return (
    <div className="p-8 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, {currentUser?.name}!
        </h1>
        <p className="text-slate-400">
          Here&apos;s your procurement overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Active Vendors */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 hover:border-slate-600 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-300 font-medium">Active Vendors</h3>
            <div className="bg-green-900/30 p-2 rounded-lg">
              <Users className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white mb-2">{stats.activeVendors}</p>
          <p className="text-xs text-slate-500">Total in system: {stats.activeVendors}</p>
        </div>

        {/* Published RFQs */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 hover:border-slate-600 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-300 font-medium">Active RFQs</h3>
            <div className="bg-blue-900/30 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white mb-2">{stats.publishedRFQs}</p>
          <p className="text-xs text-slate-500">Currently published</p>
        </div>

        {/* Pending Quotations */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 hover:border-slate-600 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-300 font-medium">Pending Quotations</h3>
            <div className="bg-yellow-900/30 p-2 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white mb-2">{stats.pendingQuotations}</p>
          <p className="text-xs text-slate-500">Awaiting review</p>
        </div>

        {/* Total Purchase Orders */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 hover:border-slate-600 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-300 font-medium">Purchase Orders</h3>
            <div className="bg-purple-900/30 p-2 rounded-lg">
              <Package className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white mb-2">{stats.totalPOs}</p>
          <p className="text-xs text-slate-500">Total placed</p>
        </div>

        {/* Pending Invoices */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 hover:border-slate-600 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-300 font-medium">Pending Invoices</h3>
            <div className="bg-red-900/30 p-2 rounded-lg">
              <Receipt className="w-5 h-5 text-red-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white mb-2">{stats.pendingInvoices}</p>
          <p className="text-xs text-slate-500">Awaiting payment</p>
        </div>

        {/* Total Spent */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 hover:border-slate-600 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-300 font-medium">Total Spent</h3>
            <div className="bg-blue-900/30 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white mb-2">
            ${stats.totalSpent.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-slate-500">Total invoices paid</p>
        </div>
      </div>

      {/* Recent Activities */}
      {recentActivities.length > 0 && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-lg font-bold text-white mb-4">System Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentActivities.map((activity, index) => {
              const Icon = activity.icon
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                >
                  <Icon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-slate-300">{activity.label}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

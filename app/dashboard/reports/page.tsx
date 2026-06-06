'use client'

import { useAppStore } from '@/lib/store'
import { BarChart3, TrendingUp, PieChart, Calendar } from 'lucide-react'

export default function ReportsPage() {
  const { vendors, rfqs, quotations, pos, invoices } = useAppStore()

  const stats = {
    totalVendors: vendors.length,
    activeVendors: vendors.filter((v) => v.status === 'active').length,
    totalRFQs: rfqs.length,
    closedRFQs: rfqs.filter((r) => r.status === 'closed').length,
    totalQuotations: quotations.length,
    acceptedQuotations: quotations.filter((q) => q.status === 'accepted').length,
    totalPOs: pos.length,
    completedPOs: pos.filter((p) => p.status === 'completed').length,
    totalInvoices: invoices.length,
    paidInvoices: invoices.filter((i) => i.paymentStatus === 'paid').length,
    totalAmount: invoices.reduce((sum, i) => sum + i.totalAmount, 0),
    paidAmount: invoices
      .filter((i) => i.paymentStatus === 'paid')
      .reduce((sum, i) => sum + i.totalAmount, 0),
  }

  const overallStats = [
    {
      icon: BarChart3,
      label: 'Total Spend',
      value: `$${stats.totalAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      color: 'bg-blue-900/30 text-blue-400',
    },
    {
      icon: TrendingUp,
      label: 'Paid Amount',
      value: `$${stats.paidAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      color: 'bg-green-900/30 text-green-400',
    },
    {
      icon: PieChart,
      label: 'Payment Rate',
      value: `${((stats.paidAmount / stats.totalAmount) * 100 || 0).toFixed(0)}%`,
      color: 'bg-purple-900/30 text-purple-400',
    },
    {
      icon: Calendar,
      label: 'Pending Payment',
      value: `$${(stats.totalAmount - stats.paidAmount).toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      color: 'bg-yellow-900/30 text-yellow-400',
    },
  ]

  return (
    <div className="p-8 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Reports & Analytics</h1>
        <p className="text-slate-400">Procurement and vendor performance metrics</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {overallStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              className={`rounded-lg border border-slate-700 p-6 ${stat.color}`}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-400 text-sm font-medium opacity-80">{stat.label}</p>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          )
        })}
      </div>

      {/* Procurement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* RFQ Summary */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-lg font-bold text-white mb-6">RFQ Summary</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Total RFQs</span>
              <span className="text-2xl font-bold text-white">{stats.totalRFQs}</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{
                  width: `${((stats.closedRFQs / stats.totalRFQs) * 100) || 0}%`,
                }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Closed RFQs</span>
              <span className="text-green-400">{stats.closedRFQs}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Active RFQs</span>
              <span className="text-blue-400">{stats.totalRFQs - stats.closedRFQs}</span>
            </div>
          </div>
        </div>

        {/* Quotation Summary */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-lg font-bold text-white mb-6">Quotation Summary</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Total Quotations</span>
              <span className="text-2xl font-bold text-white">{stats.totalQuotations}</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{
                  width: `${((stats.acceptedQuotations / stats.totalQuotations) * 100) || 0}%`,
                }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Accepted</span>
              <span className="text-green-400">{stats.acceptedQuotations}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Pending</span>
              <span className="text-yellow-400">
                {stats.totalQuotations - stats.acceptedQuotations}
              </span>
            </div>
          </div>
        </div>

        {/* PO Summary */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-lg font-bold text-white mb-6">Purchase Order Summary</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Total POs</span>
              <span className="text-2xl font-bold text-white">{stats.totalPOs}</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{
                  width: `${((stats.completedPOs / stats.totalPOs) * 100) || 0}%`,
                }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Completed</span>
              <span className="text-green-400">{stats.completedPOs}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">In Progress</span>
              <span className="text-blue-400">{stats.totalPOs - stats.completedPOs}</span>
            </div>
          </div>
        </div>

        {/* Invoice Summary */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-lg font-bold text-white mb-6">Invoice Summary</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Total Invoices</span>
              <span className="text-2xl font-bold text-white">{stats.totalInvoices}</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{
                  width: `${((stats.paidInvoices / stats.totalInvoices) * 100) || 0}%`,
                }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Paid</span>
              <span className="text-green-400">{stats.paidInvoices}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Pending</span>
              <span className="text-yellow-400">
                {stats.totalInvoices - stats.paidInvoices}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Vendor Summary */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h2 className="text-lg font-bold text-white mb-6">Vendor Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-300">Total Vendors</span>
              <span className="text-2xl font-bold text-white">{stats.totalVendors}</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{
                  width: `${((stats.activeVendors / stats.totalVendors) * 100) || 0}%`,
                }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-sm mt-3">
              <span className="text-slate-400">Active</span>
              <span className="text-green-400">{stats.activeVendors}</span>
            </div>
          </div>
          <div>
            <p className="text-slate-300 mb-4">Vendor Rating Distribution</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Excellent (4.5+)</span>
                <span className="text-green-400">
                  {vendors.filter((v) => v.rating >= 4.5).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Good (4.0-4.4)</span>
                <span className="text-blue-400">
                  {vendors.filter((v) => v.rating >= 4 && v.rating < 4.5).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Average (3.0-3.9)</span>
                <span className="text-yellow-400">
                  {vendors.filter((v) => v.rating >= 3 && v.rating < 4).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Below Average ({`<3.0`})</span>
                <span className="text-red-400">
                  {vendors.filter((v) => v.rating < 3).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

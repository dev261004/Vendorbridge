'use client'

import { CheckCircle, Clock, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const approvalItems = [
  {
    id: 'APR-001',
    rfq: 'Office furniture procurement Q2',
    vendor: 'Infra Supplies Pvt Ltd',
    amount: 'Rs. 1,85,400',
    status: 'pending',
    step: 'L2 approval',
  },
  {
    id: 'APR-002',
    rfq: 'IT hardware refresh',
    vendor: 'TechCore LTD',
    amount: 'Rs. 4,20,000',
    status: 'approved',
    step: 'Completed',
  },
]

export default function ApprovalsPage() {
  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-white">
          Approval Workflow
        </h1>
        <p className="text-slate-400">
          Review selected quotations and approve or reject procurement requests.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium text-slate-300">Pending</h3>
            <Clock className="size-5 text-yellow-400" />
          </div>
          <p className="text-3xl font-bold text-white">1</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium text-slate-300">Approved</h3>
            <CheckCircle className="size-5 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-white">1</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium text-slate-300">Rejected</h3>
            <XCircle className="size-5 text-red-400" />
          </div>
          <p className="text-3xl font-bold text-white">0</p>
        </div>
      </div>

      <div className="space-y-4">
        {approvalItems.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-slate-700 bg-slate-800 p-6"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-white">
                    {item.rfq}
                  </h2>
                  <span
                    className={
                      item.status === 'approved'
                        ? 'rounded-full border border-green-700 bg-green-900/30 px-3 py-1 text-xs font-medium text-green-400'
                        : 'rounded-full border border-yellow-700 bg-yellow-900/30 px-3 py-1 text-xs font-medium text-yellow-400'
                    }
                  >
                    {item.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-slate-400">
                  {item.id} - {item.vendor} - {item.amount} - {item.step}
                </p>
              </div>

              {item.status === 'pending' && (
                <div className="flex gap-2">
                  <Button className="bg-green-600 text-white hover:bg-green-700">
                    Approve
                  </Button>
                  <Button className="bg-red-600 text-white hover:bg-red-700">
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

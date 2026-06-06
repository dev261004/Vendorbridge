'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Plus, Eye, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import RFQModal from '@/components/RFQModal'
import Link from 'next/link'

export default function RFQsPage() {
  const { rfqs } = useAppStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRFQ, setSelectedRFQ] = useState<string | null>(null)

  const handleAddRFQ = () => {
    setSelectedRFQ(null)
    setIsModalOpen(true)
  }

  const handleEditRFQ = (rfqId: string) => {
    setSelectedRFQ(rfqId)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedRFQ(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-900/30 text-green-400 border-green-700'
      case 'draft':
        return 'bg-slate-700/30 text-slate-400 border-slate-600'
      case 'closed':
        return 'bg-red-900/30 text-red-400 border-red-700'
      case 'cancelled':
        return 'bg-gray-700/30 text-gray-400 border-gray-600'
      default:
        return 'bg-slate-700/30 text-slate-400 border-slate-600'
    }
  }

  return (
    <div className="p-8 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Requests for Quotation</h1>
          <p className="text-slate-400">Create and manage RFQs for procurement</p>
        </div>
        <Button
          onClick={handleAddRFQ}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New RFQ
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h3 className="text-slate-300 font-medium text-sm mb-2">Total RFQs</h3>
          <p className="text-3xl font-bold text-white">{rfqs.length}</p>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h3 className="text-slate-300 font-medium text-sm mb-2">Published</h3>
          <p className="text-3xl font-bold text-green-400">
            {rfqs.filter((r) => r.status === 'published').length}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h3 className="text-slate-300 font-medium text-sm mb-2">Drafts</h3>
          <p className="text-3xl font-bold text-yellow-400">
            {rfqs.filter((r) => r.status === 'draft').length}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h3 className="text-slate-300 font-medium text-sm mb-2">Closed</h3>
          <p className="text-3xl font-bold text-red-400">
            {rfqs.filter((r) => r.status === 'closed').length}
          </p>
        </div>
      </div>

      {/* RFQ List */}
      <div className="space-y-4">
        {rfqs.length === 0 ? (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center">
            <p className="text-slate-400 mb-4">No RFQs found</p>
            <Button
              onClick={handleAddRFQ}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Create First RFQ
            </Button>
          </div>
        ) : (
          rfqs.map((rfq) => (
            <div
              key={rfq.id}
              className="bg-slate-800 rounded-lg border border-slate-700 p-6 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{rfq.title}</h3>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(rfq.status)}`}
                    >
                      {rfq.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mb-3">{rfq.description}</p>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-slate-300">
                      <span className="text-slate-500">Number:</span> {rfq.number}
                    </span>
                    <span className="text-slate-300">
                      <span className="text-slate-500">Items:</span> {rfq.items.length}
                    </span>
                    <span className="text-slate-300">
                      <span className="text-slate-500">Budget:</span> $
                      {rfq.estimatedBudget.toLocaleString()}
                    </span>
                    <span className="text-slate-300">
                      <span className="text-slate-500">Due:</span>{' '}
                      {new Date(rfq.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/rfqs/${rfq.id}`}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                    onClick={() => handleEditRFQ(rfq.id)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <RFQModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        rfqId={selectedRFQ}
      />
    </div>
  )
}

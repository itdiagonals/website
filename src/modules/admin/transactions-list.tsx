'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import type { TransactionHistoryListItem, TransactionHistoryPagination } from '@/lib/api'
import { Truck, Loader2, RefreshCw, CheckSquare, Square } from 'lucide-react'

export default function TransactionsListModule() {
  const [transactions, setTransactions] = useState<TransactionHistoryListItem[]>([])
  const [pagination, setPagination] = useState<TransactionHistoryPagination>({ page: 1, limit: 50, total: 0, total_pages: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingResult, setBookingResult] = useState<{ success: number; failed: number } | null>(null)

  const fetchTransactions = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const res = await api.admin.transactions(page, 50, statusFilter || undefined)
      setTransactions(res.data)
      setPagination(res.pagination)
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchTransactions(1)
  }, [fetchTransactions])

  const toggleSelect = (orderId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(orderId)) next.delete(orderId)
      else next.add(orderId)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === transactions.length && transactions.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(transactions.map(t => t.order_id)))
    }
  }

  const handleBulkBookShipment = async () => {
    if (selectedIds.size === 0) return
    setBookingLoading(true)
    setBookingResult(null)

    let success = 0
    let failed = 0

    for (const orderId of selectedIds) {
      try {
        await api.admin.bookShipment({ order_id: orderId })
        success++
      } catch {
        failed++
      }
    }

    setBookingResult({ success, failed })
    setSelectedIds(new Set())
    setBookingLoading(false)
    fetchTransactions(pagination.page)
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      paid: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      failed: 'bg-red-100 text-red-700',
      refunded: 'bg-blue-100 text-blue-700',
    }
    return map[status.toLowerCase()] || 'bg-neutral-100 text-neutral-700'
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-1000">Transactions</h1>
          <p className="mt-1 text-sm text-neutral-700">Manage orders and shipments.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <button
            onClick={() => fetchTransactions(1)}
            disabled={loading}
            className="h-10 px-4 rounded-lg border border-neutral-300 text-sm font-semibold hover:bg-neutral-100 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {bookingResult && (
        <div className={`rounded-lg p-3 text-sm border ${bookingResult.failed === 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
          Booked: {bookingResult.success} success, {bookingResult.failed} failed
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-primary-50 border border-primary-200 rounded-lg">
          <span className="text-sm font-medium text-primary-900">{selectedIds.size} selected</span>
          <button
            onClick={handleBulkBookShipment}
            disabled={bookingLoading}
            className="h-9 px-4 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-400 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {bookingLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <Truck className="h-4 w-4" />
            Book Shipment
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="h-9 px-4 rounded-lg border border-neutral-300 text-sm font-semibold hover:bg-neutral-100 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-neutral-300 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-100 text-neutral-700 font-semibold">
              <tr>
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleSelectAll} className="flex items-center justify-center">
                    {selectedIds.size === transactions.length && transactions.length > 0 ? (
                      <CheckSquare className="h-5 w-5 text-primary-500" />
                    ) : (
                      <Square className="h-5 w-5 text-neutral-400" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Shipping</th>
                <th className="px-4 py-3">Tracking</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && !loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-neutral-500">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.order_id} className="border-t border-neutral-100 hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelect(tx.order_id)} className="flex items-center justify-center">
                        {selectedIds.has(tx.order_id) ? (
                          <CheckSquare className="h-5 w-5 text-primary-500" />
                        ) : (
                          <Square className="h-5 w-5 text-neutral-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-black">{tx.order_id}</td>
                    <td className="px-4 py-3 text-neutral-600">{tx.customer_id?.slice(0, 8)}...</td>
                    <td className="px-4 py-3 font-medium text-black">Rp {tx.total_amount.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(tx.status)}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{tx.shipping_status}</td>
                    <td className="px-4 py-3 text-neutral-600">{tx.tracking_number || '-'}</td>
                    <td className="px-4 py-3 text-neutral-600">{new Date(tx.created_at).toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/orders/${tx.order_id}`}
                          target="_blank"
                          className="text-xs px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-100 transition-colors"
                        >
                          View
                        </Link>
                        {tx.status === 'paid' && !tx.tracking_number && (
                          <button
                            onClick={async () => {
                              try {
                                await api.admin.bookShipment({ order_id: tx.order_id })
                                fetchTransactions(pagination.page)
                              } catch {
                                alert('Failed to book shipment')
                              }
                            }}
                            className="text-xs px-3 py-1.5 rounded-lg bg-primary-500 text-white hover:bg-primary-400 transition-colors flex items-center gap-1"
                          >
                            <Truck className="h-3 w-3" />
                            Book
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
            <p className="text-sm text-neutral-600">
              Page {pagination.page} of {pagination.total_pages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchTransactions(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
                className="h-9 px-4 rounded-lg border border-neutral-300 text-sm font-semibold hover:bg-neutral-100 transition-colors disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => fetchTransactions(pagination.page + 1)}
                disabled={pagination.page >= pagination.total_pages || loading}
                className="h-9 px-4 rounded-lg border border-neutral-300 text-sm font-semibold hover:bg-neutral-100 transition-colors disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

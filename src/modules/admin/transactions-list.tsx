'use client'

import { useState, useEffect, useCallback } from 'react'
import { api, type TransactionHistoryDetail, type Product as BackendProduct } from '@/lib/api'
import type { TransactionHistoryListItem, TransactionHistoryPagination } from '@/lib/api'
import { Truck, Loader2, RefreshCw, CheckSquare, Square, PackageCheck, X, MapPin, User, Calendar, CreditCard, Truck as TruckIcon, Printer } from 'lucide-react'
import ShippingLabel, { getLabelCSS, generateLabelHTML } from '@/components/admin/shipping-label'
import { generateBarcodeDataUrl } from '@/lib/barcode'

function normalizeStatus(value: string) {
  return value.trim().toLowerCase()
}

function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    paid: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700',
    refunded: 'bg-blue-100 text-blue-700',
  }
  return map[status.toLowerCase()] || 'bg-neutral-100 text-neutral-700'
}

function getWorkflowState(tx: TransactionHistoryListItem) {
  const paymentStatus = normalizeStatus(tx.status)
  const shippingStatus = normalizeStatus(tx.shipping_status)

  if (paymentStatus === 'failed') {
    return { label: 'Failed', borderClass: 'border-l-red-400', rowBg: 'bg-red-50/30' }
  }
  if (paymentStatus === 'refunded') {
    return { label: 'Refunded', borderClass: 'border-l-blue-400', rowBg: 'bg-blue-50/30' }
  }
  if (paymentStatus === 'pending') {
    return { label: 'Awaiting Payment', borderClass: 'border-l-yellow-400', rowBg: 'bg-yellow-50/30' }
  }
  if (tx.tracking_number) {
    return { label: 'Shipped', borderClass: 'border-l-green-500', rowBg: 'bg-green-50/30' }
  }
  if (shippingStatus === 'packed') {
    return { label: 'Ready to Book', borderClass: 'border-l-indigo-400', rowBg: 'bg-indigo-50/30' }
  }
  return { label: 'Ready to Pack', borderClass: 'border-l-orange-400', rowBg: 'bg-orange-50/30' }
}

export default function TransactionsListModule() {
  const [transactions, setTransactions] = useState<TransactionHistoryListItem[]>([])
  const [pagination, setPagination] = useState<TransactionHistoryPagination>({ page: 1, limit: 50, total: 0, total_pages: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingResult, setBookingResult] = useState<{ success: number; failed: number } | null>(null)
  const [actionMessage, setActionMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [bulkPrintLoading, setBulkPrintLoading] = useState(false)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewOrderId, setPreviewOrderId] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<TransactionHistoryDetail | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewProductNames, setPreviewProductNames] = useState<Map<number, { name: string; image: string }>>(new Map())

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
    setActionMessage({ tone: failed === 0 ? 'success' : 'error', text: failed === 0 ? 'Shipment berhasil dibooking.' : `${failed} order gagal dibooking.` })
    setSelectedIds(new Set())
    setBookingLoading(false)
    fetchTransactions(pagination.page)
  }

  const handleBulkPackShipment = async () => {
    if (selectedIds.size === 0) return
    setBookingLoading(true)
    setBookingResult(null)

    let success = 0
    let failed = 0

    for (const orderId of selectedIds) {
      try {
        await api.admin.packShipment({ order_id: orderId })
        success++
      } catch {
        failed++
      }
    }

    setBookingResult({ success, failed })
    setActionMessage({ tone: failed === 0 ? 'success' : 'error', text: failed === 0 ? 'Order berhasil ditandai packed.' : `${failed} order gagal ditandai packed.` })
    setSelectedIds(new Set())
    setBookingLoading(false)
    fetchTransactions(pagination.page)
  }

  const handleBulkPrintLabels = async () => {
    if (selectedIds.size === 0) return
    setBulkPrintLoading(true)
    setActionMessage(null)

    try {
      const orderIds = Array.from(selectedIds)
      const results = await Promise.allSettled(
        orderIds.map((id) => api.admin.getByOrderId(id))
      )

      const orders = results
        .filter((r): r is PromiseFulfilledResult<TransactionHistoryDetail> => r.status === 'fulfilled')
        .map((r) => r.value)
        .filter((o) => o.tracking_number)

      const skippedCount = orderIds.length - orders.length

      if (orders.length === 0) {
        setActionMessage({ tone: 'error', text: 'No selected orders have a tracking number. Book shipment first.' })
        setBulkPrintLoading(false)
        return
      }

      const barcodeMap = new Map<string, string>()
      await Promise.all(
        orders.map(async (o) => {
          if (!o.tracking_number) return
          try {
            const url = await generateBarcodeDataUrl(o.tracking_number, { width: 2, height: 60 })
            barcodeMap.set(o.order_id, url)
          } catch {
            barcodeMap.set(o.order_id, '')
          }
        })
      )

      const allProductIds = [...new Set(orders.flatMap((o) => o.items.map((i) => i.product_id)))]
      const productNamesMap = new Map<number, { name: string; image: string }>()
      await Promise.all(
        allProductIds.map(async (pid) => {
          try {
            const product: BackendProduct = await api.products.getById(pid)
            productNamesMap.set(pid, { name: product.name, image: product.cover_image?.url ?? '' })
          } catch {
            productNamesMap.set(pid, { name: `Product #${pid}`, image: '' })
          }
        })
      )

      const logoUrl = `${window.location.origin}/logo/diagonals.webp`
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        setBulkPrintLoading(false)
        return
      }

      const labelsHTML = orders.map((o) => {
        const html = generateLabelHTML(o, barcodeMap.get(o.order_id) || '', logoUrl, productNamesMap)
        return `<div class="label-page">${html}</div>`
      }).join('')

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Shipping Labels</title>
            <style>
              @page { size: 100mm 150mm; margin: 0; }
              body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
              ${getLabelCSS()}
              .label-page { page-break-after: always; }
              .label-page:last-child { page-break-after: auto; }
            </style>
          </head>
          <body>
            ${labelsHTML}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)

      if (skippedCount > 0) {
        setActionMessage({ tone: 'success', text: `Printed ${orders.length} labels. ${skippedCount} skipped (no tracking).` })
      } else {
        setActionMessage({ tone: 'success', text: `Printed ${orders.length} labels successfully.` })
      }
    } catch {
      setActionMessage({ tone: 'error', text: 'Failed to print labels. Please try again.' })
    } finally {
      setBulkPrintLoading(false)
    }
  }

  const openPreview = async (orderId: string) => {
    setPreviewOpen(true)
    setPreviewOrderId(orderId)
    setPreviewLoading(true)
    setPreviewError(null)
    setPreviewData(null)
    setPreviewProductNames(new Map())

    try {
      const data = await api.admin.getByOrderId(orderId)
      setPreviewData(data)

      const productIds = [...new Set(data.items.map((item) => item.product_id))]
      const nameMap = new Map<number, { name: string; image: string }>()
      await Promise.all(
        productIds.map(async (pid) => {
          try {
            const product: BackendProduct = await api.products.getById(pid)
            nameMap.set(pid, { name: product.name, image: product.cover_image?.url ?? '' })
          } catch {
            nameMap.set(pid, { name: `Product #${pid}`, image: '' })
          }
        })
      )
      setPreviewProductNames(nameMap)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load order preview'
      setPreviewError(message)
    } finally {
      setPreviewLoading(false)
    }
  }

  const closePreview = () => {
    setPreviewOpen(false)
    setPreviewOrderId(null)
    setPreviewData(null)
    setPreviewError(null)
    setPreviewProductNames(new Map())
  }

  useEffect(() => {
    if (!previewOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePreview()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [previewOpen])

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

      {actionMessage && (
        <div className={`rounded-lg p-3 text-sm border ${actionMessage.tone === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {actionMessage.text}
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-primary-50 border border-primary-200 rounded-lg">
          <span className="text-sm font-medium text-primary-900">{selectedIds.size} selected</span>
          <button
            onClick={handleBulkPackShipment}
            disabled={bookingLoading || bulkPrintLoading}
            className="h-9 px-4 rounded-lg border border-primary-300 text-sm font-semibold hover:bg-primary-50 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {bookingLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <PackageCheck className="h-4 w-4" />
            Mark Packed
          </button>
          <button
            onClick={handleBulkBookShipment}
            disabled={bookingLoading || bulkPrintLoading}
            className="h-9 px-4 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-400 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {bookingLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <Truck className="h-4 w-4" />
            Book Shipment
          </button>
          <button
            onClick={handleBulkPrintLabels}
            disabled={bookingLoading || bulkPrintLoading}
            className="h-9 px-4 rounded-lg border border-neutral-700 bg-neutral-800 text-white text-sm font-semibold hover:bg-neutral-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {bulkPrintLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <Printer className="h-4 w-4" />
            Print Labels
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
                <th className="px-4 py-3">State</th>
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
                transactions.map((tx) => {
                  const paymentStatus = normalizeStatus(tx.status)
                  const shippingStatus = normalizeStatus(tx.shipping_status)
                  const canPack = paymentStatus === 'paid' && (shippingStatus === 'pending' || shippingStatus === '') && !tx.tracking_number
                  const canBook = paymentStatus === 'paid' && shippingStatus === 'packed' && !tx.tracking_number
                  const state = getWorkflowState(tx)

                  return (
                  <tr key={tx.order_id} className={`border-t border-neutral-100 hover:bg-neutral-50 transition-colors border-l-4 ${state.borderClass}`}>
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
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeClass(tx.status)}`} title={`Payment: ${tx.status} | Shipping: ${tx.shipping_status}`}>
                        {state.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{tx.shipping_status}</td>
                    <td className="px-4 py-3 text-neutral-600">{tx.tracking_number || '-'}</td>
                    <td className="px-4 py-3 text-neutral-600">{new Date(tx.created_at).toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openPreview(tx.order_id)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-100 transition-colors"
                        >
                          View
                        </button>
                        {canPack && (
                          <button
                            onClick={async () => {
                              try {
                                await api.admin.packShipment({ order_id: tx.order_id })
                                setActionMessage({ tone: 'success', text: `Order ${tx.order_id} ditandai packed.` })
                                fetchTransactions(pagination.page)
                              } catch (error) {
                                const message = error instanceof Error ? error.message : 'Failed to mark packed'
                                setActionMessage({ tone: 'error', text: message })
                              }
                            }}
                            className="text-xs px-3 py-1.5 rounded-lg border border-primary-300 text-primary-700 hover:bg-primary-50 transition-colors flex items-center gap-1"
                          >
                            <PackageCheck className="h-3 w-3" />
                            Pack
                          </button>
                        )}
                        {canBook && (
                          <button
                            onClick={async () => {
                              try {
                                await api.admin.bookShipment({ order_id: tx.order_id })
                                setActionMessage({ tone: 'success', text: `Shipment ${tx.order_id} berhasil dibooking.` })
                                fetchTransactions(pagination.page)
                              } catch (error) {
                                const message = error instanceof Error ? error.message : 'Failed to book shipment'
                                setActionMessage({ tone: 'error', text: message })
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
                  )
                })
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

      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={closePreview}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-white rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-black">Order Preview</h2>
                <p className="text-sm text-neutral-500">{previewOrderId}</p>
              </div>
              <button
                onClick={closePreview}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
                aria-label="Close preview"
              >
                <X className="h-5 w-5 text-neutral-600" />
              </button>
            </div>

            <div className="p-6">
              {previewLoading && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                  <p className="text-sm text-neutral-500">Loading order details...</p>
                </div>
              )}

              {previewError && (
                <div className="rounded-lg p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
                  {previewError}
                </div>
              )}

              {!previewLoading && previewData && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${statusBadgeClass(previewData.status)}`}>
                      <CreditCard className="h-3 w-3 mr-1.5" />
                      {previewData.status}
                    </span>
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${statusBadgeClass(previewData.shipping_status)}`}>
                      <TruckIcon className="h-3 w-3 mr-1.5" />
                      {previewData.shipping_status}
                    </span>
                    {previewData.tracking_number && (
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {previewData.tracking_number}
                      </span>
                    )}
                    {previewData.tracking_number && (
                      <ShippingLabel order={previewData} productNames={previewProductNames} />
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50">
                      <User className="h-4 w-4 text-neutral-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-neutral-500 text-xs">Customer</p>
                        <p className="font-medium text-black">{previewData.customer_id}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50">
                      <Calendar className="h-4 w-4 text-neutral-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-neutral-500 text-xs">Order Date</p>
                        <p className="font-medium text-black">{new Date(previewData.created_at).toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 sm:col-span-2">
                      <MapPin className="h-4 w-4 text-neutral-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-neutral-500 text-xs">Shipping Address</p>
                        <p className="font-medium text-black">{previewData.shipping_address.recipient_name}</p>
                        <p className="text-neutral-600 mt-0.5">{previewData.shipping_address.phone_number}</p>
                        <p className="text-neutral-600 mt-0.5">
                          {previewData.shipping_address.full_address}, {previewData.shipping_address.village},{' '}
                          {previewData.shipping_address.district}, {previewData.shipping_address.city},{' '}
                          {previewData.shipping_address.province} {previewData.shipping_address.postal_code}
                        </p>
                      </div>
                    </div>
                    {previewData.notes && (
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 sm:col-span-2">
                        <div>
                          <p className="text-neutral-500 text-xs">Catatan Pesanan</p>
                          <p className="font-medium text-black mt-0.5 whitespace-pre-wrap">{previewData.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-sm">
                    <p className="text-neutral-500 text-xs mb-1">Courier</p>
                    <p className="font-medium text-black">
                      {previewData.courier_name} — {previewData.courier_service}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-black mb-3">Items ({previewData.items.length})</p>
                    <div className="flex flex-col gap-3">
                      {previewData.items.map((item) => {
                        const productInfo = previewProductNames.get(item.product_id)
                        return (
                          <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl border border-neutral-200 bg-white">
                            <div className="h-12 w-12 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 overflow-hidden">
                              {productInfo?.image ? (
                                <img src={productInfo.image} alt={productInfo.name} className="h-full w-full object-cover" />
                              ) : (
                                <PackageCheck className="h-5 w-5 text-neutral-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-black truncate">{productInfo?.name ?? `Product #${item.product_id}`}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-2.5 h-2.5 rounded-full border border-neutral-200" style={{ backgroundColor: item.selected_color_hex || '#ccc' }} />
                                  {item.selected_color_name}
                                </span>
                                <span>|</span>
                                <span>Size: {item.selected_size}</span>
                                <span>|</span>
                                <span>Qty: {item.quantity}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-medium text-black">Rp {item.subtotal.toLocaleString('id-ID')}</p>
                              <p className="text-xs text-neutral-500">Rp {item.price.toLocaleString('id-ID')} each</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="border-t border-neutral-200 pt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-600">Subtotal</span>
                      <span className="font-medium text-black">Rp {(previewData.total_amount - previewData.shipping_cost).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-neutral-600">Shipping</span>
                      <span className="font-medium text-black">Rp {previewData.shipping_cost.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold pt-2 border-t border-neutral-100">
                      <span>Total</span>
                      <span>Rp {previewData.total_amount.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

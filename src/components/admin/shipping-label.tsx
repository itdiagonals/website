'use client'

import { useState, useEffect } from 'react'
import { Printer } from 'lucide-react'
import type { TransactionHistoryDetail } from '@/lib/api'
import { generateBarcodeDataUrl } from '@/lib/barcode'

interface ShippingLabelProps {
  order: TransactionHistoryDetail
  productNames: Map<number, { name: string; image: string }>
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function getLabelCSS(): string {
  return `
    .label-container { width: 100mm; height: 150mm; padding: 4mm; box-sizing: border-box; }
    .label-inner { width: 100%; height: 100%; border: 1px solid #000; padding: 3mm; box-sizing: border-box; display: flex; flex-direction: column; }
    .logo-img { width: auto; height: 14mm; object-fit: contain; }
    .text-xs { font-size: 8px; line-height: 1.3; }
    .text-sm { font-size: 10px; line-height: 1.3; }
    .text-base { font-size: 12px; line-height: 1.3; }
    .text-lg { font-size: 14px; line-height: 1.3; }
    .text-xl { font-size: 18px; line-height: 1.2; }
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
    .uppercase { text-transform: uppercase; }
    .text-center { text-align: center; }
    .border-t { border-top: 1px solid #000; }
    .border-b { border-bottom: 1px solid #000; }
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .items-center { align-items: center; }
    .justify-center { justify-content: center; }
    .justify-between { justify-content: space-between; }
    .gap-1 { gap: 1mm; }
    .gap-2 { gap: 2mm; }
    .p-1 { padding: 1mm; }
    .p-2 { padding: 2mm; }
    .py-1 { padding-top: 1mm; padding-bottom: 1mm; }
    .py-2 { padding-top: 2mm; padding-bottom: 2mm; }
    .px-2 { padding-left: 2mm; padding-right: 2mm; }
    .mt-1 { margin-top: 1mm; }
    .mt-2 { margin-top: 2mm; }
    .mb-1 { margin-bottom: 1mm; }
    .mb-2 { margin-bottom: 2mm; }
    .w-full { width: 100%; }
    .flex-1 { flex: 1; }
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: 1fr 1fr; }
    .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .barcode-img { width: 100%; height: 18mm; object-fit: contain; }
    .block { display: block; }
    .text-neutral-500 { color: #737373; }
    .gap-0-5 { gap: 0.5mm; }
  `
}

export function generateLabelHTML(
  order: TransactionHistoryDetail,
  barcodeUrl: string,
  logoUrl: string,
  productNames?: Map<number, { name: string; image: string }>
): string {
  const sender = order.sender
  const trackingNumber = order.tracking_number || ''
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0)
  const esc = escapeHtml

  const itemsHTML = order.items.slice(0, 3).map((item) => {
    const product = productNames?.get(item.product_id)
    const name = esc(product?.name || `Product #${item.product_id}`)
    return `
      <div class="flex flex-col gap-0-5">
        <span class="text-sm font-semibold block truncate">${name}</span>
        <span class="text-xs text-neutral-500 block">${esc(item.selected_color_name)} | ${esc(item.selected_size)} | x${item.quantity}</span>
      </div>
    `
  }).join('')

  const moreItems = order.items.length > 3
    ? `<span class="text-xs text-neutral-500 block mt-1">+${order.items.length - 3} more items</span>`
    : ''

  return `
    <div class="label-container">
      <div class="label-inner">
        <div class="flex flex-col items-center border-b py-1 mb-1">
          ${logoUrl ? `<img src="${esc(logoUrl)}" alt="Diagonals" class="logo-img" />` : ''}
          <div class="flex justify-between w-full mt-1">
            <span class="text-xs uppercase font-bold">Shipping Label</span>
            <span class="text-xs">${esc(order.courier_name.toUpperCase())} - ${esc(order.courier_service.toUpperCase())}</span>
          </div>
        </div>

        <div class="py-1 border-b">
          <span class="text-xs uppercase text-neutral-500 block">Pengirim (Sender)</span>
          <span class="text-sm font-bold block truncate">${esc(sender?.name || 'DIAGONALS')}</span>
          <span class="text-xs block">${esc(sender?.phone || '')}</span>
          <span class="text-xs block truncate">${esc(sender?.address || '')}</span>
          <span class="text-xs block">${esc(sender?.postal_code || '')}</span>
        </div>

        <div class="py-1 border-b">
          <span class="text-xs uppercase text-neutral-500 block">Penerima (Recipient)</span>
          <span class="text-base font-bold block">${esc(order.shipping_address.recipient_name)}</span>
          <span class="text-xs block">${esc(order.shipping_address.phone_number)}</span>
          <span class="text-xs block">${esc(order.shipping_address.full_address)}</span>
          <span class="text-xs block">${esc(order.shipping_address.village)}, ${esc(order.shipping_address.district)}, ${esc(order.shipping_address.city)}</span>
          <span class="text-xs block">${esc(order.shipping_address.province)} ${esc(order.shipping_address.postal_code)}</span>
        </div>

        <div class="py-1 border-b flex flex-col items-center gap-1">
          ${barcodeUrl ? `<img src="${esc(barcodeUrl)}" alt="Barcode" class="barcode-img" />` : ''}
          <span class="text-lg font-bold tracking-widest">${esc(trackingNumber)}</span>
        </div>

        <div class="py-1 border-b flex-1">
          <span class="text-xs uppercase text-neutral-500 block">Items (${totalItems})</span>
          <div class="mt-1 flex flex-col gap-1">
            ${itemsHTML}
            ${moreItems}
          </div>
        </div>

        ${order.notes ? `<div class="py-1 border-b"><span class="text-xs uppercase text-neutral-500 block">Catatan</span><span class="text-xs block">${esc(order.notes)}</span></div>` : ''}

        <div class="py-1 flex justify-between items-end">
          <div>
            <span class="text-xs uppercase text-neutral-500 block">Order</span>
            <span class="text-xs font-bold block">${esc(order.order_id)}</span>
          </div>
          <div class="text-right">
            <span class="text-xs block">${esc(new Date(order.created_at).toLocaleDateString('id-ID'))}</span>
          </div>
        </div>
      </div>
    </div>
  `
}

export default function ShippingLabel({ order, productNames }: ShippingLabelProps) {
  const [barcodeUrl, setBarcodeUrl] = useState<string>('')

  const trackingNumber = order.tracking_number || ''
  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/logo/diagonals.webp` : ''

  useEffect(() => {
    if (!trackingNumber) {
      return
    }

    generateBarcodeDataUrl(trackingNumber, { width: 2, height: 60 })
      .then((url) => setBarcodeUrl(url))
      .catch(() => setBarcodeUrl(''))
  }, [trackingNumber])

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const labelHTML = generateLabelHTML(order, barcodeUrl, logoUrl, productNames)

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shipping Label - ${order.order_id}</title>
          <style>
            @page { size: 100mm 150mm; margin: 0; }
            body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
            ${getLabelCSS()}
          </style>
        </head>
        <body>
          ${labelHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  if (!trackingNumber) return null

  return (
    <button
      onClick={handlePrint}
      className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold hover:bg-neutral-100 transition-colors"
    >
      <Printer className="h-4 w-4" />
      Print Label
    </button>
  )
}

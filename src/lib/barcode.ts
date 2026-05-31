export function generateBarcodeDataUrl(text: string, options: { width?: number; height?: number; format?: string } = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Barcode generation requires a browser environment'))
      return
    }

    import('jsbarcode').then((JsBarcode) => {
      const canvas = document.createElement('canvas')
      const { width = 2, height = 80, format = 'CODE128' } = options

      try {
        JsBarcode.default(canvas, text, {
          format,
          width,
          height,
          displayValue: false,
          margin: 0,
        })
        resolve(canvas.toDataURL('image/png'))
      } catch (err) {
        reject(err)
      }
    }).catch((err) => {
      reject(err)
    })
  })
}

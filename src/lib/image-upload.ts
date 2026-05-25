const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export function validateImageBeforeUpload(file: File) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Only JPG, PNG, and WebP images are allowed.')
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Image size must not exceed 10 MB.')
  }
}

export async function convertImageFileToWebP(file: File, quality = 0.9) {
  validateImageBeforeUpload(file)

  if (file.type === 'image/webp') {
    return new File([file], toWebPFileName(file.name), {
      type: 'image/webp',
      lastModified: file.lastModified,
    })
  }

  const bitmap = await readImageBitmap(file)

  try {
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Failed to initialize image converter.')
    }

    context.drawImage(bitmap, 0, 0)

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (!result) {
            reject(new Error('Failed to convert image to WebP.'))
            return
          }

          resolve(result)
        },
        'image/webp',
        quality,
      )
    })

    if (blob.size > MAX_IMAGE_BYTES) {
      throw new Error('Converted WebP image is larger than 10 MB.')
    }

    return new File([blob], toWebPFileName(file.name), {
      type: 'image/webp',
      lastModified: Date.now(),
    })
  } finally {
    bitmap.close()
  }
}

async function readImageBitmap(file: File) {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file)
  }

  const dataUrl = await readFileAsDataURL(file)
  const image = await loadImageElement(dataUrl)
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Failed to initialize fallback image converter.')
  }

  context.drawImage(image, 0, 0)
  return createImageBitmap(canvas)
}

async function readFileAsDataURL(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Failed to read image file.'))
        return
      }

      resolve(reader.result)
    }
    reader.onerror = () => reject(new Error('Failed to read image file.'))
    reader.readAsDataURL(file)
  })
}

async function loadImageElement(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to decode image.'))
    image.src = source
  })
}

function toWebPFileName(fileName: string) {
  const baseName = fileName.replace(/\.[^.]+$/, '') || 'upload'
  return `${baseName}.webp`
}

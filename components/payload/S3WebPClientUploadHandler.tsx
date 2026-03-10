'use client'

import { createClientUploadHandler } from '@payloadcms/plugin-cloud-storage/client'
import { formatAdminURL } from 'payload/shared'

const webpConvertibleTypes = new Set(['image/jpeg', 'image/jpg', 'image/png'])

const loadImage = async (file: File): Promise<HTMLImageElement> => {
  const objectURL = URL.createObjectURL(file)

  try {
    const image = new Image()
    image.src = objectURL
    await image.decode()
    return image
  } catch (error) {
    URL.revokeObjectURL(objectURL)
    throw error
  }
}

const convertImageToWebP = async (file: File): Promise<File> => {
  if (!webpConvertibleTypes.has(file.type)) {
    return file
  }

  const image = await loadImage(file)

  try {
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth || image.width
    canvas.height = image.naturalHeight || image.height

    const context = canvas.getContext('2d')

    if (!context) {
      return file
    }

    context.drawImage(image, 0, 0)

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', 0.9)
    })

    if (!blob) {
      return file
    }

    const filenameWithoutExtension = file.name.replace(/\.[^.]+$/, '')

    return new File([blob], `${filenameWithoutExtension}.webp`, {
      type: 'image/webp',
      lastModified: Date.now(),
    })
  } finally {
    URL.revokeObjectURL(image.src)
  }
}

export const S3ClientUploadHandler = createClientUploadHandler({
  handler: async ({
    apiRoute,
    collectionSlug,
    file,
    prefix,
    serverHandlerPath,
    serverURL,
    updateFilename,
  }) => {
    const uploadFile = await convertImageToWebP(file)

    if (uploadFile.name !== file.name) {
      updateFilename(uploadFile.name)
    }

    const endpointRoute = formatAdminURL({
      apiRoute,
      path: serverHandlerPath,
      serverURL,
    })

    const response = await fetch(endpointRoute, {
      body: JSON.stringify({
        collectionSlug,
        filename: uploadFile.name,
        filesize: uploadFile.size,
        mimeType: uploadFile.type,
      }),
      credentials: 'include',
      method: 'POST',
    })

    if (!response.ok) {
      const { errors } = await response.json()
      throw new Error(errors.reduce((acc: string, err: { message: string }) => `${acc ? `${acc}, ` : ''}${err.message}`, ''))
    }

    const { url } = await response.json()

    await fetch(url, {
      body: uploadFile,
      headers: {
        'Content-Length': uploadFile.size.toString(),
        'Content-Type': uploadFile.type,
      },
      method: 'PUT',
    })

    return {
      prefix,
    }
  },
})
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const s3ClientUploadHandlerWebpackAlias = path.resolve(dirname, 'components/payload/S3WebPClientUploadHandler.tsx')
const s3ClientUploadHandlerTurbopackAlias = './components/payload/S3WebPClientUploadHandler.tsx'

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      '@payloadcms/storage-s3/client': s3ClientUploadHandlerTurbopackAlias,
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@payloadcms/storage-s3/client': s3ClientUploadHandlerWebpackAlias,
    }

    return config
  },
};

export default withPayload(nextConfig);

import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { CareGuides } from './collections/CareGuides.ts'
import { Categories } from './collections/Categories.ts'
import { Users } from './collections/Users.ts'
import { Media } from './collections/Media.ts'
import { Products } from './collections/Products.ts'
import { Seasons } from './collections/Seasons.ts'
import { s3Storage } from '@payloadcms/storage-s3'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const payloadDatabaseURL = process.env.PAYLOAD_DATABASE_URL || process.env.DATABASE_URL || ''
const payloadEnablePush = process.env.PAYLOAD_ENABLE_PUSH === 'true'

export default buildConfig({
    admin: {
        user: Users.slug,
        importMap: {
            baseDir: path.resolve(dirname),
        },
    },
    collections: [Users, Media, Seasons, Categories, CareGuides, Products],
    editor: lexicalEditor(),
    secret: process.env.PAYLOAD_SECRET || '',
    typescript: {
        outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
    db: postgresAdapter({
        push: payloadEnablePush,
        pool: {
            connectionString: payloadDatabaseURL,
        },
    }),
    sharp,
    plugins: [
        s3Storage({
            clientUploads: true,
            collections: {
                media: true,
            },
            bucket: process.env.S3_BUCKET || '',
            config: {
                credentials: {
                    accessKeyId: process.env.S3_ACCESS_KEY || '',
                    secretAccessKey: process.env.S3_SECRET_KEY || '',
                },
                endpoint: process.env.S3_ENDPOINT || undefined,
                forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
                region: process.env.S3_REGION || 'us-east-1',
            },
        }),
    ],
})

import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

const baseURL = process.env.SEED_BASE_URL || 'http://localhost:3000'

const seed = async () => {
  const response = await fetch(`${baseURL}/api/dev/seed`, {
    headers: {
      'Content-Type': 'application/json',
      'x-seed-secret': process.env.PAYLOAD_SECRET || '',
    },
    method: 'POST',
  })

  const body = await response.json()

  if (!response.ok) {
    throw new Error(body.message || 'Seed request failed')
  }

  console.log('Seed completed successfully:', body)
}

seed()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
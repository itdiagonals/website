import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

const baseURL = process.env.SEED_BASE_URL || 'http://localhost:3000'

const syncCatalog = async () => {
	const response = await fetch(`${baseURL}/api/dev/sync-catalog`, {
		headers: {
			'Content-Type': 'application/json',
			'x-seed-secret': process.env.PAYLOAD_SECRET || '',
		},
		method: 'POST',
	})

	const body = await response.json()

	if (!response.ok) {
		throw new Error(body.message || 'Catalog sync request failed')
	}

	return body
}

syncCatalog()
	.then((summary) => {
		console.log('Catalog sync completed successfully:', summary)
		process.exit(0)
	})
	.catch((error) => {
		console.error('Catalog sync failed:', error)
		process.exit(1)
	})
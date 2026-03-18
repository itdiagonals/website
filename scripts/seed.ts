import { seedCatalog } from '../lib/seedCatalog.ts'

const seed = async () => {
  const result = await seedCatalog()
  console.log('Seed completed successfully:', result)
}

seed()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
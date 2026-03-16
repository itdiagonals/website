import { NextResponse } from 'next/server'

import { seedCatalog } from '@/lib/seedCatalog'

export const POST = async (request: Request) => {
  const secret = request.headers.get('x-seed-secret')

  if (!process.env.PAYLOAD_SECRET || secret !== process.env.PAYLOAD_SECRET) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await seedCatalog()
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown seed error'
    return NextResponse.json({ message }, { status: 500 })
  }
}
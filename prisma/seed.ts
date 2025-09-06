import { seedInitialTags } from '@/lib/seed-tags'

async function main() {
  console.log('🌱 Starting database seeding...')
  
  try {
    console.log('Seeding initial tags...')
    await seedInitialTags()
    console.log('✅ Tags seeded successfully!')
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  } finally {
    process.exit(0)
  }
}

main()
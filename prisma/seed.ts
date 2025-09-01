import { seedInitialTags } from '@/lib/seed-tags'

async function main() {
  try {
    console.log('Seeding initial tags...')
    await seedInitialTags()
    console.log('Tags seeded successfully!')
  } catch (error) {
    console.error('Error seeding tags:', error)
  } finally {
    process.exit(0)
  }
}

main()
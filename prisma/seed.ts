import { seedInitialTags } from '@/lib/seed-tags'
import { seedArticles } from '@/lib/seed-articles'
import { seedDefaultUser } from '@/lib/seed-default-user'

async function main() {
  console.log('🌱 Starting database seeding...')
  
  try {
    console.log('Seeding initial tags...')
    await seedInitialTags()
    console.log('✅ Tags seeded successfully!')
    
    console.log('Seeding articles...')
    await seedArticles()
    console.log('✅ Articles seeded successfully!')
    
    console.log('Seeding default user...')
    await seedDefaultUser()
    console.log('✅ Default user seeded successfully!')
    
    console.log('🎉 All seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  } finally {
    process.exit(0)
  }
}

main()
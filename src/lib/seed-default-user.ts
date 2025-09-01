import { prisma } from './prisma'

export async function seedDefaultUser() {
  try {
    // Check if a test user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    })

    if (existingUser) {
      console.log('Test user already exists, updating preferences...')
      
      // Update the existing user with some default preferences
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          preferredTags: ['technology', 'artificial-intelligence', 'cybersecurity', 'business', 'science']
        }
      })
      
      console.log('Updated test user preferences:', updatedUser.preferredTags)
      return updatedUser
    }

    // Create a new test user if it doesn't exist
    const defaultUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        preferredTags: ['technology', 'artificial-intelligence', 'cybersecurity', 'business', 'science']
      }
    })

    console.log('Created default test user with preferences:', defaultUser.preferredTags)
    return defaultUser
  } catch (error) {
    console.error('Error seeding default user:', error)
    throw error
  }
}

// Run directly if this file is executed
if (require.main === module) {
  seedDefaultUser()
    .then(() => {
      console.log('✅ Default user seeded successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error seeding default user:', error)
      process.exit(1)
    })
}

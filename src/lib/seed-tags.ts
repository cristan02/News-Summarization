import { prisma } from './prisma'

export async function seedInitialTags() {
  const initialTags = [
    'Technology',
    'AI',
    'Business',
    'Sports',
    'Politics',
    'Health',
    'Science',
    'Entertainment',
    'World News',
    'Finance'
  ]

  for (const tagName of initialTags) {
    await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName }
    })
  }
}

// Run this once: seedInitialTags()
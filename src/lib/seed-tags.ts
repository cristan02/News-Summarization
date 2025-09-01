import { prisma } from './prisma'

export async function seedInitialTags() {
  // These tags will be used to fetch articles from news APIs
  const newsApiTags = [
        'artificial intelligence', 
        'health',
        'science',
        'sports',
        'entertainment',
        'politics'
      ]

  console.log(`Seeding ${newsApiTags.length} tags for news API integration...`)

  for (const tagName of newsApiTags) {
    await prisma.tag.upsert({
      where: { name: tagName },
      update: {
        usageCount: Math.floor(Math.random() * 50) + 1 // Random usage count
      },
      create: { 
        name: tagName,
        usageCount: Math.floor(Math.random() * 50) + 1
      }
    })
  }
}

// Run this once: seedInitialTags()
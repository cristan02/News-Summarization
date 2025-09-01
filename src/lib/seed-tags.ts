import { prisma } from './prisma'

export async function seedInitialTags() {
  // These tags will be used to fetch articles from news APIs
  const newsApiTags = [
    // Main News Categories (good for news APIs)
    'technology',
    'business',
    'sports',
    'politics',
    'health',
    'science',
    'entertainment',
    'general',
    
    // Technology Subcategories
    'artificial-intelligence',
    'cybersecurity',
    'cryptocurrency',
    'startup',
    'apple',
    'google',
    'microsoft',
    'tesla',
    'spacex',
    
    // Business & Finance
    'stock-market',
    'economy',
    'investment',
    'banking',
    'real-estate',
    
    // Sports Categories
    'football',
    'basketball',
    'soccer',
    'tennis',
    'olympics',
    'baseball',
    
    // Health & Science
    'medical-research',
    'climate-change',
    'space-exploration',
    'quantum-computing',
    'biotechnology',
    
    // Entertainment
    'movies',
    'music',
    'gaming',
    'streaming',
    'celebrity',
    
    // World & Politics
    'world-news',
    'elections',
    'international',
    'military',
    'diplomacy',
    
    // Lifestyle
    'travel',
    'food',
    'fashion',
    'education',
    'environment'
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
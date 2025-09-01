import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// This endpoint will fetch articles from external news APIs based on user's preferred tags
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tags, limit = 10 } = await request.json()

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json({ error: 'Tags are required' }, { status: 400 })
    }

    // Simulate fetching from news API (replace with actual implementation)
    const fetchedArticles = await fetchArticlesFromNewsAPI(tags, limit)
    
    // Save articles to database
    const savedArticles = []
    for (const article of fetchedArticles) {
      try {
        const savedArticle = await prisma.article.upsert({
          where: { link: article.link },
          update: {
            title: article.title,
            content: article.content,
            shortSummary: article.shortSummary,
            tag: article.tag,
            source: article.source,
            author: article.author,
            publishedAt: article.publishedAt,
            imageUrl: article.imageUrl
          },
          create: article
        })
        savedArticles.push(savedArticle)
      } catch (error) {
        console.error('Error saving article:', error)
        // Continue with other articles even if one fails
      }
    }

    return NextResponse.json({
      message: `Successfully fetched and saved ${savedArticles.length} articles`,
      articles: savedArticles
    })
  } catch (error) {
    console.error('Error fetching external articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles from external sources' }, 
      { status: 500 }
    )
  }
}

// Mock function to simulate fetching from news APIs
// Replace this with actual NewsAPI, Guardian API, or other news service integration
async function fetchArticlesFromNewsAPI(tags: string[], limit: number) {
  // This is a mock implementation - replace with actual API calls
  const mockArticles = []
  
  for (const tag of tags.slice(0, 3)) { // Limit to 3 tags to avoid rate limits
    const articlesForTag = generateMockArticlesForTag(tag, Math.ceil(limit / tags.length))
    mockArticles.push(...articlesForTag)
  }

  return mockArticles.slice(0, limit)
}

function generateMockArticlesForTag(tag: string, count: number) {
  const articles = []
  const baseDate = new Date()
  
  for (let i = 0; i < count; i++) {
    const mockDate = new Date(baseDate.getTime() - (i * 24 * 60 * 60 * 1000)) // Days ago
    
    articles.push({
      title: `Latest ${tag} News: ${getRandomHeadline(tag)} - ${i + 1}`,
      link: `https://newsapi.example.com/${tag.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}-${i}`,
      content: generateMockContent(tag),
      shortSummary: `Breaking news in ${tag}: ${getRandomSummary(tag)}`,
      tag: tag,
      source: getRandomSource(),
      author: getRandomAuthor(),
      publishedAt: mockDate,
      imageUrl: `https://source.unsplash.com/400x200/?${tag.toLowerCase().replace(/[^a-z]/g, '')}`
    })
  }
  
  return articles
}

function getRandomHeadline(tag: string): string {
  const headlines: Record<string, string[]> = {
    'technology': ['Revolutionary AI Breakthrough', 'New Tech Innovation Emerges', 'Digital Transformation Accelerates'],
    'business': ['Market Reaches New Heights', 'Corporate Strategy Shifts', 'Economic Growth Continues'],
    'sports': ['Championship Victory Celebrated', 'Record-Breaking Performance', 'Playoff Race Intensifies'],
    'health': ['Medical Discovery Announced', 'Health Guidelines Updated', 'Treatment Breakthrough Reported'],
    'science': ['Research Findings Published', 'Scientific Discovery Made', 'Study Results Released'],
    'politics': ['Policy Changes Announced', 'Political Developments Unfold', 'Legislative Action Taken'],
    'entertainment': ['Award Show Highlights', 'Celebrity News Breaks', 'Entertainment Industry Evolves'],
    'general': ['Important News Update', 'Significant Development', 'Major Announcement Made']
  }
  
  const tagHeadlines = headlines[tag.toLowerCase()] || headlines['general']
  return tagHeadlines[Math.floor(Math.random() * tagHeadlines.length)]
}

function getRandomSummary(tag: string): string {
  const summaries: Record<string, string[]> = {
    'technology': ['Latest technological advancement shows promising results', 'Innovation drives industry forward', 'Tech sector sees significant progress'],
    'business': ['Companies report strong quarterly performance', 'Market conditions remain favorable', 'Business growth continues steadily'],
    'sports': ['Athletes demonstrate exceptional skill and dedication', 'Competition reaches new intensity levels', 'Sports fans celebrate remarkable achievements'],
    'health': ['Medical professionals share important findings', 'Health outcomes show improvement', 'Healthcare advances benefit patients'],
    'science': ['Researchers make significant scientific contribution', 'Scientific community celebrates discovery', 'Study provides valuable insights'],
    'politics': ['Government officials address important issues', 'Political landscape continues evolving', 'Policy implications being evaluated'],
    'entertainment': ['Entertainment industry showcases creativity', 'Audiences respond positively to content', 'Cultural impact continues growing'],
    'general': ['Development has widespread implications', 'Community responds to significant changes', 'Impact extends across multiple sectors']
  }
  
  const tagSummaries = summaries[tag.toLowerCase()] || summaries['general']
  return tagSummaries[Math.floor(Math.random() * tagSummaries.length)]
}

function generateMockContent(tag: string): string {
  return `This is a comprehensive article about ${tag} that would typically contain detailed information, quotes from experts, analysis of the situation, and relevant background context. The content would be several paragraphs long and provide in-depth coverage of the topic.

In real implementation, this content would be fetched from actual news APIs like NewsAPI, Guardian API, or other news sources. The content would include the full article text, proper attribution, and all necessary metadata.

The article would cover recent developments in ${tag}, featuring insights from industry experts, relevant statistics, and implications for the broader community. This mock content serves as a placeholder for actual news content that would be retrieved from external sources.

Key points would include recent trends, expert opinions, and future outlook for ${tag}-related developments. The full article would provide readers with comprehensive understanding of the current state and future direction of this topic.`
}

function getRandomSource(): string {
  const sources = ['NewsAPI', 'Reuters', 'Associated Press', 'BBC News', 'CNN', 'The Guardian', 'TechCrunch', 'Bloomberg']
  return sources[Math.floor(Math.random() * sources.length)]
}

function getRandomAuthor(): string {
  const authors = ['John Smith', 'Sarah Johnson', 'Michael Chen', 'Emma Wilson', 'David Brown', 'Lisa Garcia', 'Tom Anderson', 'Maria Rodriguez']
  return authors[Math.floor(Math.random() * authors.length)]
}

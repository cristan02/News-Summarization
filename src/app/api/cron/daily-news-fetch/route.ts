import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchArticlesWithFallback } from '@/lib/news-fetcher';

// Security check for cron jobs
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || cronSecret === 'your_secure_cron_secret_here') {
    // In development, allow requests without secret
    return process.env.NODE_ENV === 'development';
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting daily news fetch job...');
    
    // Get all available tags from the database, ordered by usage count (most popular first)
    const tags = await prisma.tag.findMany({
      select: { name: true, usageCount: true },
      orderBy: { usageCount: 'desc' }
    });

    let searchQueries: string[] = [];
    
    if (tags.length > 0) {
      // Use existing tags as search queries, prioritizing more popular tags
      // Take up to 10 tags, but ensure we have at least some variety
      searchQueries = tags.slice(0, 10).map(tag => tag.name);
      console.log(`Using ${searchQueries.length} tags from database:`, searchQueries);
    } else {
      // No tags exist in database yet - skip the cron job
      console.log('No tags found in database. Skipping news fetch until tags are created.');
      return NextResponse.json({
        success: true,
        message: 'No tags found in database. Please create tags first before running news fetch.',
        statistics: {
          queriesProcessed: 0,
          articlesFetched: 0,
          articlesSaved: 0,
          articlesAlreadyExisted: 0,
          errors: 0,
          oldArticlesDeleted: 0
        },
        timestamp: new Date().toISOString()
      });
    }

    console.log(`Fetching articles for ${searchQueries.length} tags from database...`);

    // Fetch articles with fallback logic - adjust articles per tag based on number of tags
    const articlesPerTag = Math.max(3, Math.floor(40 / searchQueries.length)); // Aim for ~40 total articles
    
    // Pass all existing tag names to the fetcher for better categorization
    const existingTagNames = tags.map(tag => tag.name);
    const fetchedArticles = await fetchArticlesWithFallback(searchQueries, articlesPerTag, existingTagNames);
    
    console.log(`Fetched ${fetchedArticles.length} articles total`);

    // Save articles to database
    const savedArticles = [];
    const errors = [];

    for (const article of fetchedArticles) {
      try {
        // Check if article already exists
        const existingArticle = await prisma.article.findUnique({
          where: { link: article.link }
        });

        if (existingArticle) {
          console.log(`Article already exists: ${article.title}`);
          continue;
        }

        // Ensure tag exists in database
        await prisma.tag.upsert({
          where: { name: article.tag },
          update: { usageCount: { increment: 1 } },
          create: { 
            name: article.tag,
            usageCount: 1
          }
        });

        // Save article
        const savedArticle = await prisma.article.create({
          data: {
            title: article.title,
            link: article.link,
            content: article.content,
            shortSummary: article.shortSummary || '',
            tag: article.tag,
            source: article.source,
            author: article.author,
            publishedAt: article.publishedAt,
            imageUrl: article.imageUrl
          }
        });

        // Log content length for debugging
        console.log(`Saved article: "${article.title}" - Content length: ${article.content?.length || 0} characters`);
        savedArticles.push(savedArticle);

      } catch (error) {
        console.error(`Error saving article "${article.title}":`, error);
        errors.push({
          title: article.title,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Clean up old articles (older than 30 days) to manage database size
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const deleteResult = await prisma.article.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo
        }
      }
    });

    console.log(`Cleaned up ${deleteResult.count} old articles`);

    const response = {
      success: true,
      message: 'Daily news fetch completed',
      statistics: {
        queriesProcessed: searchQueries.length,
        articlesFetched: fetchedArticles.length,
        articlesSaved: savedArticles.length,
        articlesAlreadyExisted: fetchedArticles.length - savedArticles.length - errors.length,
        errors: errors.length,
        oldArticlesDeleted: deleteResult.count
      },
      timestamp: new Date().toISOString(),
      errors: errors.length > 0 ? errors : undefined
    };

    console.log('Daily news fetch job completed:', response.statistics);
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in daily news fetch cron job:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to execute daily news fetch',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Also allow POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}

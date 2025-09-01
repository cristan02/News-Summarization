import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fetchArticlesWithFallback } from '@/lib/news-fetcher';

async function executeDailyNewsFetch() {
  console.log('Starting manual daily news fetch job...');
  
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
    return {
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
    };
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

      savedArticles.push(savedArticle);
      console.log(`Saved article: ${article.title}`);

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
  return response;
}

async function executeCleanupJob() {
  console.log('Starting manual cleanup job...');
  
  // Delete articles older than 60 days
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  
  const deleteResult = await prisma.article.deleteMany({
    where: {
      createdAt: {
        lt: sixtyDaysAgo
      }
    }
  });

  // Clean up unused tags (tags with usageCount 0)
  const unusedTagsResult = await prisma.tag.deleteMany({
    where: {
      usageCount: 0
    }
  });

  // Update tag usage counts to reflect current articles
  const tagCounts = await prisma.article.groupBy({
    by: ['tag'],
    _count: {
      tag: true
    }
  });

  // Reset all tag counts first
  await prisma.tag.updateMany({
    data: {
      usageCount: 0
    }
  });

  // Update with current counts
  for (const tagCount of tagCounts) {
    await prisma.tag.upsert({
      where: { name: tagCount.tag },
      update: { usageCount: tagCount._count.tag },
      create: { 
        name: tagCount.tag,
        usageCount: tagCount._count.tag
      }
    });
  }

  const response = {
    success: true,
    message: 'Cleanup job completed',
    statistics: {
      oldArticlesDeleted: deleteResult.count,
      unusedTagsDeleted: unusedTagsResult.count,
      tagCountsUpdated: tagCounts.length
    },
    timestamp: new Date().toISOString()
  };

  console.log('Cleanup job completed:', response.statistics);
  return response;
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated (for security)
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();

    if (action === 'daily-fetch') {
      const result = await executeDailyNewsFetch();
      return NextResponse.json({
        message: 'Daily news fetch triggered',
        result
      });

    } else if (action === 'cleanup') {
      const result = await executeCleanupJob();
      return NextResponse.json({
        message: 'Cleanup job triggered',
        result
      });

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error triggering manual job:', error);
    return NextResponse.json({
      error: 'Failed to trigger job',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

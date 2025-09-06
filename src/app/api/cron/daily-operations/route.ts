import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fetchArticlesWithFallback } from '@/lib/news-fetcher';
import { ensureArticleChunks } from '@/lib/chunk-embed';

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

// Check if user is authenticated for manual triggers
async function verifyUserAuth(): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    return !!session?.user?.email;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return await executeDailyOperations();
  } catch (error) {
    console.error('Error in daily operations cron job:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to execute daily operations',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Also allow POST for manual triggering (with user authentication)
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated for manual triggers
    if (!(await verifyUserAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return await executeDailyOperations();
  } catch (error) {
    console.error('Error in manual daily operations trigger:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to execute daily operations',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function executeDailyOperations() {

    console.log('Starting daily operations: cleanup + news fetch...');
    
    // STEP 1: CLEANUP OLD DATA FIRST
    console.log('Step 1: Cleaning up old data...');
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Delete old chunks first (due to foreign key constraints)
    const deletedChunks = await prisma.articleChunk.deleteMany({
      where: {
        article: {
          OR: [
            {
              publishedAt: {
                lt: sevenDaysAgo
              }
            },
            {
              publishedAt: null,
              createdAt: {
                lt: sevenDaysAgo
              }
            }
          ]
        }
      }
    });

    // Delete old articles
    const deletedArticles = await prisma.article.deleteMany({
      where: {
        OR: [
          {
            publishedAt: {
              lt: sevenDaysAgo
            }
          },
          {
            publishedAt: null,
            createdAt: {
              lt: sevenDaysAgo
            }
          }
        ]
      }
    });

    console.log(`Cleanup completed: ${deletedArticles.count} articles and ${deletedChunks.count} chunks deleted`);

    // STEP 2: FETCH NEW NEWS
    console.log('Step 2: Fetching new news...');
    
    let newsFetchResults = {
      queriesProcessed: 0,
      articlesFetched: 0,
      articlesSaved: 0,
      articlesAlreadyExisted: 0,
      errors: 0
    };

    // Fixed articles per tag
    const articlesPerTag = 2;
    const maxTags = 10;
    console.log(`Configured to fetch ${articlesPerTag} articles per tag (max ${maxTags} tags)`);
    
    // Fetch articles (function will get tags from database internally)
    const fetchedArticles = await fetchArticlesWithFallback(articlesPerTag, maxTags);
    
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
            summary: article.summary, // No fallback needed - all articles now have summaries
            tag: article.tag,
            source: article.source,
            author: article.author,
            publishedAt: article.publishedAt,
            imageUrl: article.imageUrl
          }
        });

        // Generate chunks & embeddings
        try {
          const chunkResult = await ensureArticleChunks(prisma, savedArticle, { chunkSize: 1200, overlap: 150 });
          console.log(`Saved article: "${article.title}" - Content length: ${article.content?.length || 0} chars; Chunks created: ${chunkResult.created}${chunkResult.skippedExisting ? ' (skipped existing)' : ''}`);
        } catch (chunkErr) {
          console.error(`Failed chunking article "${article.title}":`, chunkErr);
        }
        savedArticles.push(savedArticle);

      } catch (error) {
        console.error(`Error saving article "${article.title}":`, error);
        errors.push({
          title: article.title,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    newsFetchResults = {
      queriesProcessed: fetchedArticles.length > 0 ? maxTags : 0,
      articlesFetched: fetchedArticles.length,
      articlesSaved: savedArticles.length,
      articlesAlreadyExisted: fetchedArticles.length - savedArticles.length - errors.length,
      errors: errors.length
    };

    const response = {
      success: true,
      message: 'Daily operations completed successfully',
      cleanup: {
        articlesDeleted: deletedArticles.count,
        chunksDeleted: deletedChunks.count,
        cutoffDate: sevenDaysAgo.toISOString()
      },
      newsFetch: newsFetchResults,
      timestamp: new Date().toISOString()
    };

    console.log('Daily operations completed:', response);
    
    return NextResponse.json(response);
}

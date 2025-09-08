import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchArticlesWithFallback } from "@/lib/news-fetcher";
import { ensureArticleChunks } from "@/lib/chunk-embed";
import {
  DEFAULT_ARTICLE_RETENTION_DAYS,
  DEFAULT_ARTICLES_PER_TAG,
} from "@/lib/constants";

// Security check for cron jobs
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || cronSecret === "your_secure_cron_secret_here") {
    // In development, allow requests without secret
    return process.env.NODE_ENV === "development";
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return await executeDailyOperations();
  } catch (error) {
    console.error("Error in daily operations cron job:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to execute daily operations",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also allow POST for manual triggering (with user authentication)
export async function POST() {
  try {
    // Check if user is authenticated for manual triggers
    if (!(await verifyUserAuth())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return await executeDailyOperations();
  } catch (error) {
    console.error("Error in manual daily operations trigger:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to execute daily operations",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

async function executeDailyOperations() {
  console.log("Starting daily operations: cleanup + news fetch...");

  // STEP 1: CLEANUP OLD DATA FIRST
  console.log("Step 1: Cleaning up old data...");
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - DEFAULT_ARTICLE_RETENTION_DAYS);

  // Delete old chunks first (due to foreign key constraints)
  const deletedChunks = await prisma.articleChunk.deleteMany({
    where: {
      article: {
        OR: [
          {
            publishedAt: {
              lt: sevenDaysAgo,
            },
          },
          {
            publishedAt: null,
            createdAt: {
              lt: sevenDaysAgo,
            },
          },
        ],
      },
    },
  });

  // Delete old articles
  const deletedArticles = await prisma.article.deleteMany({
    where: {
      OR: [
        {
          publishedAt: {
            lt: sevenDaysAgo,
          },
        },
        {
          publishedAt: null,
          createdAt: {
            lt: sevenDaysAgo,
          },
        },
      ],
    },
  });

  console.log(
    `Cleanup completed: ${deletedArticles.count} articles and ${deletedChunks.count} chunks deleted`
  );

  // STEP 2: FETCH NEW NEWS
  console.log("Step 2: Fetching new news...");

  let newsFetchResults = {
    queriesProcessed: 0,
    articlesFetched: 0,
    articlesSaved: 0,
    articlesAlreadyExisted: 0,
    errors: 0,
  }; // Fixed articles per tag
  const articlesPerTag = DEFAULT_ARTICLES_PER_TAG;
  console.log(
    `Configured to fetch ${articlesPerTag} articles per tag (processing ALL tags)`
  );

  // Fetch articles (function will get ALL tags from database)
  const fetchedArticles = await fetchArticlesWithFallback(articlesPerTag);

  console.log(`Fetched ${fetchedArticles.length} articles total`);

  // Log detailed breakdown of fetched articles by tag
  if (fetchedArticles.length > 0) {
    console.log("📋 Articles fetched breakdown by tag:");
    const articlesByTag = fetchedArticles.reduce((acc, article) => {
      acc[article.tag] = (acc[article.tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(articlesByTag).forEach(([tag, count]) => {
      console.log(`   ${tag}: ${count} articles`);
    });

    console.log("📋 All fetched articles:");
    fetchedArticles.forEach((article, idx) => {
      console.log(
        `   ${idx + 1}. "${article.title}" (Tag: ${article.tag}, Source: ${
          article.source
        })`
      );
    });
  }

  // Get the actual number of tags processed for reporting
  const tagsFromDB = await prisma.tag.count();

  // Save articles to database with rate limiting
  const savedArticles = [];
  const errors = [];

  console.log(
    `Processing ${fetchedArticles.length} articles with rate limiting...`
  );

  for (let i = 0; i < fetchedArticles.length; i++) {
    const article = fetchedArticles[i];

    try {
      console.log(
        `🔄 Processing article ${i + 1}/${fetchedArticles.length}: "${
          article.title
        }"`
      );
      console.log(`   Tag: ${article.tag}`);
      console.log(`   Source: ${article.source}`);
      console.log(`   URL: ${article.link}`);

      // Check if article already exists
      const existingArticle = await prisma.article.findUnique({
        where: { link: article.link },
      });

      if (existingArticle) {
        console.log(
          `⏭️ Article already exists in database: "${article.title}" (Tag: ${article.tag})`
        );
        continue;
      }

      // Ensure tag exists in database
      await prisma.tag.upsert({
        where: { name: article.tag },
        update: { usageCount: { increment: 1 } },
        create: {
          name: article.tag,
          usageCount: 1,
        },
      });

      console.log(
        `💾 Saving new article: "${article.title}" (Tag: ${article.tag})`
      );

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
          imageUrl: article.imageUrl,
        },
      });

      console.log(
        `✅ Article saved successfully: "${article.title}" (ID: ${savedArticle.id}, Tag: ${article.tag})`
      );

      // Generate chunks & embeddings with retry on failure
      try {
        console.log(
          `Generating chunks and embeddings for article: ${article.title}`
        );
        const chunkResult = await ensureArticleChunks(prisma, savedArticle, {
          chunkSize: 1200, // Hardcoded chunk size
          overlap: 150, // Hardcoded chunk overlap
        });

        console.log(
          `✅ Article processed successfully: ${chunkResult.created} chunks created for "${article.title}"`
        );
        savedArticles.push(savedArticle);
      } catch (chunkError) {
        console.error(
          `❌ Failed to create chunks for article "${article.title}":`,
          chunkError
        );
        // Save the article anyway, just without chunks/embeddings
        savedArticles.push(savedArticle);
        errors.push({
          article: article.title,
          error: "Chunk generation failed",
          details:
            chunkError instanceof Error
              ? chunkError.message
              : String(chunkError),
        });
      }

      // Add delay between processing articles to avoid overwhelming HuggingFace API
      if (i < fetchedArticles.length - 1) {
        console.log("Waiting 2 seconds before processing next article...");
        await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay
      }
    } catch (error) {
      console.error(`Failed to save article "${article.title}":`, error);
      errors.push({
        article: article.title,
        error: "Article save failed",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  newsFetchResults = {
    queriesProcessed: fetchedArticles.length > 0 ? tagsFromDB : 0, // Show actual number of tags processed
    articlesFetched: fetchedArticles.length,
    articlesSaved: savedArticles.length,
    articlesAlreadyExisted:
      fetchedArticles.length - savedArticles.length - errors.length,
    errors: errors.length,
  };

  const response = {
    success: true,
    message: "Daily operations completed successfully",
    cleanup: {
      articlesDeleted: deletedArticles.count,
      chunksDeleted: deletedChunks.count,
      cutoffDate: sevenDaysAgo.toISOString(),
    },
    newsFetch: newsFetchResults,
    timestamp: new Date().toISOString(),
  };

  console.log("Daily operations completed:", response);

  return NextResponse.json(response);
}

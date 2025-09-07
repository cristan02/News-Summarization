import "server-only";
import { InferenceClient } from "@huggingface/inference";
import { JSDOM } from "jsdom";
import { convert } from "html-to-text";
import { ExternalNewsArticle, AppError } from "@/types";
import { prisma } from "@/lib/prisma";
import {
  HUGGINGFACE_SUMMARY_MODEL,
  DEFAULT_SUMMARY_MAX_LENGTH,
  DEFAULT_SUMMARY_MIN_LENGTH,
  DEFAULT_ARTICLES_PER_TAG,
  HUGGINGFACE_API_TIMEOUT,
  GNEWS_API_URL,
  NEWSAPI_URL,
} from "@/lib/constants";

const hf = new InferenceClient(process.env.HUGGINGFACE_API_KEY);

// API Keys
const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
const NEWSAPI_KEY = process.env.NEWS_API_KEY;

/**
 * Check if HuggingFace API is responsive with a simple test
 */
export async function checkHuggingFaceAPI(): Promise<boolean> {
  try {
    console.log("🔍 Checking HuggingFace API status...");

    // Use the latest HuggingFace Inference API pattern
    const result = await hf.summarization({
      model: HUGGINGFACE_SUMMARY_MODEL,
      inputs: "This is a simple test to check if the API is working.",
      parameters: {
        max_length: 30,
        min_length: 10,
      },
    });

    console.log("✅ HuggingFace API is responsive");
    return true;
  } catch (error) {
    console.error(
      "❌ HuggingFace API health check failed:",
      (error as Error).message
    );
    return false;
  }
}

/**
 * Extract clean article content using JSDOM with improved timeout and error handling
 */
async function scrapeArticleContent(
  url: string,
  timeoutMs: number = 10000
): Promise<string> {
  try {
    console.log(`Scraping content from: ${url}`);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        DNT: "1",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`HTTP ${response.status} for ${url}`);
      return "";
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Remove unwanted elements
    const unwantedSelectors = [
      "script",
      "style",
      "nav",
      "header",
      "footer",
      "aside",
      ".ad",
      ".advertisement",
      ".comments",
      ".sidebar",
      ".menu",
      ".social",
      ".related",
      ".widget",
    ];
    unwantedSelectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => el.remove());
    });

    // Try article-specific selectors
    const selectors = [
      "article",
      '[class*="article"]',
      '[class*="content"]',
      '[class*="story"]',
      '[class*="post"]',
      '[role="main"]',
      "main",
      ".entry-content",
      ".post-content",
      ".article-body",
    ];

    for (const selector of selectors) {
      const content = document.querySelector(selector);
      if (content && content.textContent && content.textContent.length > 200) {
        const paragraphs = Array.from(content.querySelectorAll("p"))
          .map((p) => p.textContent?.trim() || "")
          .filter((text) => text.length > 20);

        if (paragraphs.length > 0) {
          const result = paragraphs.join("\n\n");
          console.log(
            `Successfully scraped ${result.length} characters from ${url}`
          );
          return result;
        }
      }
    }

    // Fallback: convert entire body to clean text
    const fallbackContent = convert(html, {
      wordwrap: false,
      selectors: [
        { selector: "a", options: { ignoreHref: true } },
        { selector: "img", format: "skip" },
        { selector: "script", format: "skip" },
        { selector: "style", format: "skip" },
      ],
    }).slice(0, 3000);

    console.log(
      `Fallback scraping got ${fallbackContent.length} characters from ${url}`
    );
    return fallbackContent;
  } catch (error: unknown) {
    const appError = error as AppError;
    if (appError.name === "AbortError") {
      console.error(`Scraping timeout (${timeoutMs}ms) for ${url}`);
    } else {
      console.error(
        `Scraping failed for ${url}:`,
        appError.message || String(error)
      );
    }
    return "";
  }
}

/**
 * Generate summary using Hugging Face with improved error handling - fails immediately on error
 */
async function generateSummary(content: string): Promise<string | null> {
  if (!process.env.HUGGINGFACE_API_KEY || !content) {
    return null;
  }

  try {
    const cleanContent = content.replace(/[^\w\s.,!?]/g, "").slice(0, 2000);

    if (cleanContent.length < 50) {
      console.warn("Content too short for summarization");
      return null;
    }

    console.log(
      `Generating summary for content (${cleanContent.length} chars)...`
    );

    // Use the latest HuggingFace Inference API pattern without custom timeout
    // The library handles timeouts internally
    const result: unknown = await hf.summarization({
      model: HUGGINGFACE_SUMMARY_MODEL,
      inputs: cleanContent,
      parameters: {
        max_length: DEFAULT_SUMMARY_MAX_LENGTH,
        min_length: DEFAULT_SUMMARY_MIN_LENGTH,
      },
    });

    // Debug: Log the actual response structure
    console.log(
      "HuggingFace summary response:",
      JSON.stringify(result, null, 2)
    );

    // Handle the latest HuggingFace Inference library response format
    let summaryText: string | null = null;

    // The new library typically returns an object with summary_text property
    if (result && typeof result === "object" && "summary_text" in result) {
      summaryText = (result as { summary_text: string }).summary_text;
    }
    // Fallback for array format (some models still return arrays)
    else if (Array.isArray(result) && result.length > 0) {
      const firstResult = result[0];
      if (
        firstResult &&
        typeof firstResult === "object" &&
        "summary_text" in firstResult
      ) {
        summaryText = (firstResult as { summary_text: string }).summary_text;
      }
    }

    if (summaryText && summaryText.trim()) {
      console.log(
        `Summary generated successfully: "${summaryText.slice(0, 100)}..."`
      );
      return summaryText.trim();
    }

    console.warn("No valid summary found in API response");
    return null;
  } catch (error: unknown) {
    const appError = error as AppError;
    console.error(
      `Summary generation failed:`,
      appError.message || String(error)
    );

    // No retries - fail immediately
    console.warn("Summary generation failed, continuing without summary");
    return null;
  }
}

/**
 * Fetch from GNews API using direct HTTP calls
 */
async function fetchFromGNews(
  query: string,
  limit: number
): Promise<ExternalNewsArticle[]> {
  if (!GNEWS_API_KEY) throw new Error("GNews API key missing");

  try {
    const url = new URL(GNEWS_API_URL);
    url.searchParams.append("q", query);
    url.searchParams.append("lang", "en");
    url.searchParams.append("max", limit.toString());
    url.searchParams.append("sortby", "relevance");
    url.searchParams.append("apikey", GNEWS_API_KEY);

    const response = await fetch(url.toString());

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("RATE_LIMIT");
      }
      throw new Error(
        `GNews API error: ${response.status} ${response.statusText}`
      );
    }

    const data: {
      articles: Array<{
        url: string;
        content?: string;
        description?: string;
        title: string;
        source?: { name: string };
        publishedAt: string;
        image?: string;
      }>;
    } = await response.json();
    const articles: ExternalNewsArticle[] = [];

    console.log(
      `📰 GNews returned ${
        data.articles?.length || 0
      } raw articles for query "${query}"`
    );

    for (const article of data.articles || []) {
      console.log(`🔍 Processing article: "${article.title}"`);
      console.log(`   URL: ${article.url}`);
      console.log(`   Source: ${article.source?.name || "Unknown"}`);

      const content =
        (await scrapeArticleContent(article.url)) ||
        article.content ||
        article.description ||
        "";

      console.log(`   Content length: ${content.length} chars`);

      let summary = await generateSummary(content);

      // Use fallback summary if AI generation fails
      if (!summary) {
        console.log(
          `⚠️ No AI summary generated for "${article.title}" - using fallback`
        );
        // Create a simple fallback summary from description or first part of content
        summary =
          article.description ||
          (content.length > 200
            ? content.substring(0, 200) + "..."
            : content) ||
          "Summary not available";
        console.log(`   Fallback summary: "${summary.slice(0, 100)}..."`);
      }

      const articleData = {
        title: article.title,
        link: article.url,
        content,
        summary,
        tag: query, // Use the search query as the tag since articles are fetched by tag
        source: "GNews" as const,
        author: article.source?.name || "Unknown",
        publishedAt: new Date(article.publishedAt),
        imageUrl: article.image,
      };

      articles.push(articleData);
      console.log(
        `✅ Article added to results: "${article.title}" (Tag: ${query})`
      );

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(
      `📊 GNews completed for "${query}": ${articles.length} articles processed`
    );
    return articles;
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "RATE_LIMIT") throw error;
    throw new Error(`GNews error: ${(error as Error).message}`);
  }
}

/**
 * Fetch from NewsAPI using direct HTTP calls (fallback)
 */
async function fetchFromNewsAPI(
  query: string,
  limit: number
): Promise<ExternalNewsArticle[]> {
  if (!NEWSAPI_KEY) throw new Error("NewsAPI key missing");

  try {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 1);

    const url = new URL(NEWSAPI_URL);
    url.searchParams.append("q", query);
    url.searchParams.append("from", fromDate.toISOString().split("T")[0]);
    url.searchParams.append("pageSize", limit.toString());
    url.searchParams.append("sortBy", "relevancy");
    url.searchParams.append("apiKey", NEWSAPI_KEY);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(
        `NewsAPI error: ${response.status} ${response.statusText}`
      );
    }

    const data: {
      articles: Array<{
        url: string;
        content?: string;
        title: string;
        author?: string;
        source?: { name: string };
        publishedAt: string;
        urlToImage?: string;
      }>;
    } = await response.json();
    const articles: ExternalNewsArticle[] = [];

    const validArticles = (data.articles || []).filter(
      (a) => a.content && a.content !== "[Removed]"
    );

    console.log(
      `📰 NewsAPI returned ${
        data.articles?.length || 0
      } raw articles for query "${query}"`
    );
    console.log(`📝 Valid articles (after filtering): ${validArticles.length}`);

    for (const article of validArticles) {
      console.log(`🔍 Processing article: "${article.title}"`);
      console.log(`   URL: ${article.url}`);
      console.log(`   Source: ${article.source?.name || "Unknown"}`);

      const content =
        (await scrapeArticleContent(article.url)) || article.content || "";

      console.log(`   Content length: ${content.length} chars`);

      let summary = await generateSummary(content);

      // Use fallback summary if AI generation fails
      if (!summary) {
        console.log(
          `⚠️ No AI summary generated for "${article.title}" - using fallback`
        );
        // Create a simple fallback summary from first part of content
        summary =
          (content.length > 200
            ? content.substring(0, 200) + "..."
            : content) || "Summary not available";
        console.log(`   Fallback summary: "${summary.slice(0, 100)}..."`);
      }

      articles.push({
        title: article.title,
        link: article.url,
        content,
        summary,
        tag: query, // Use the search query as the tag since articles are fetched by tag
        source: "NewsAPI",
        author: article.author || article.source?.name || "Unknown",
        publishedAt: new Date(article.publishedAt),
        imageUrl: article.urlToImage || undefined,
      });
      console.log(
        `✅ Article added to results: "${article.title}" (Tag: ${query})`
      );
    }

    console.log(
      `📊 NewsAPI completed for "${query}": ${articles.length} articles processed`
    );
    return articles;
  } catch (error: unknown) {
    throw new Error(`NewsAPI error: ${(error as Error).message}`);
  }
}

/**
 * Main function: Fetch tags from database and then fetch articles for each tag
 */
export async function fetchArticlesWithFallback(
  articlesPerTag: number = DEFAULT_ARTICLES_PER_TAG
): Promise<ExternalNewsArticle[]> {
  console.log(
    `🔍 Starting news fetch with ${articlesPerTag} articles per tag (processing ALL tags)`
  );
  console.log(
    `📊 API Keys available: GNews=${!!GNEWS_API_KEY}, NewsAPI=${!!NEWSAPI_KEY}`
  );

  // Check HuggingFace API health before starting
  const isHuggingFaceHealthy = await checkHuggingFaceAPI();
  if (!isHuggingFaceHealthy) {
    console.warn(
      "⚠️ HuggingFace API appears to be having issues. Summaries may fail, but articles will still be processed with fallback summaries."
    );
  }

  // STEP 1: Get tags from database
  console.log("📋 Fetching ALL tags from database...");
  const tags = await prisma.tag.findMany({
    select: { name: true, usageCount: true },
    orderBy: { usageCount: "desc" },
    // Removed take: maxTags - now processes ALL tags
  });

  if (tags.length === 0) {
    console.log("❌ No tags found in database. Please create some tags first.");
    return [];
  }

  const tagNames = tags.map((tag) => tag.name);
  console.log(`✅ Found ${tags.length} tags:`, tagNames);

  // STEP 2: Fetch articles for each tag
  const allArticles: ExternalNewsArticle[] = [];
  let useNewsAPI = false;

  for (const [i, tagName] of tagNames.entries()) {
    try {
      console.log(
        `🔍 Fetching articles for tag: "${tagName}" (${i + 1}/${
          tagNames.length
        })`
      );

      const articles = useNewsAPI
        ? await fetchFromNewsAPI(tagName, articlesPerTag)
        : await fetchFromGNews(tagName, articlesPerTag);

      console.log(
        `📦 Received ${articles.length} articles from API for tag "${tagName}"`
      );
      if (articles.length > 0) {
        console.log(`   Article titles for "${tagName}":`);
        articles.forEach((article, idx) => {
          console.log(
            `   ${idx + 1}. "${article.title}" (Tag: ${article.tag})`
          );
        });
      }

      allArticles.push(...articles);
      console.log(
        `✅ Tag "${tagName}": ${articles.length} articles added to collection (Total so far: ${allArticles.length})`
      );
    } catch (error) {
      console.error(`❌ Error fetching articles for tag "${tagName}":`, error);
      if (error instanceof Error && error.message === "RATE_LIMIT") {
        console.log("⚠️ Rate limit hit, switching to NewsAPI");
        useNewsAPI = true;
        try {
          const articles = await fetchFromNewsAPI(tagName, articlesPerTag);
          console.log(
            `📦 Fallback: Received ${articles.length} articles from NewsAPI for tag "${tagName}"`
          );
          allArticles.push(...articles);
          console.log(
            `✅ Tag "${tagName}" (fallback): ${articles.length} articles fetched`
          );
        } catch (fallbackError) {
          console.error(
            `❌ Both APIs failed for tag "${tagName}":`,
            fallbackError
          );
        }
      } else {
        console.error(`❌ Tag "${tagName}" failed:`, error);
      }
    }

    // Rate limiting between tag queries
    if (i < tagNames.length - 1) {
      console.log("⏳ Waiting 1s before next tag...");
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.log(
    `🎯 Total articles fetched: ${allArticles.length} from ${tagNames.length} tags`
  );
  return allArticles;
}

// Export legacy functions for backward compatibility
export const scrapeFullArticleContent = scrapeArticleContent;
export const generateSummaryWithHuggingFace = generateSummary;
export { fetchFromGNews, fetchFromNewsAPI };

// Legacy function for backward compatibility - now just calls the main function
export async function fetchArticlesForQueries(
  queries: string[],
  articlesPerQuery: number = 2
): Promise<ExternalNewsArticle[]> {
  console.log(
    "⚠️ Warning: fetchArticlesForQueries is deprecated. Use fetchArticlesWithFallback() instead."
  );
  // This is a simplified compatibility function - it won't use the queries parameter
  // since the new function gets tags from the database
  return fetchArticlesWithFallback(articlesPerQuery);
}

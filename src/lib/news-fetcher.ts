import "server-only";
import { InferenceClient } from "@huggingface/inference";
import { JSDOM } from "jsdom";
import { convert } from "html-to-text";
import { ExternalNewsArticle } from "@/types";
import { prisma } from "@/lib/prisma";
import {
  HUGGINGFACE_SUMMARY_MODEL,
  DEFAULT_SUMMARY_MAX_LENGTH,
  DEFAULT_SUMMARY_MIN_LENGTH,
  DEFAULT_ARTICLES_PER_TAG,
} from "@/lib/constants";

const hf = new InferenceClient(process.env.HUGGINGFACE_API_KEY);

// API endpoints and keys
const GNEWS_API_URL = "https://gnews.io/api/v4/search";
const NEWSAPI_URL = "https://newsapi.org/v2/everything";
const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
const NEWSAPI_KEY = process.env.NEWS_API_KEY;

/**
 * Extract clean article content using JSDOM
 */
async function scrapeArticleContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) return "";

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
      "main",
    ];

    for (const selector of selectors) {
      const content = document.querySelector(selector);
      if (content && content.textContent && content.textContent.length > 200) {
        const paragraphs = Array.from(content.querySelectorAll("p"))
          .map((p) => p.textContent?.trim() || "")
          .filter((text) => text.length > 20);

        if (paragraphs.length > 0) {
          return paragraphs.join("\n\n");
        }
      }
    }

    // Fallback: convert entire body to clean text
    return convert(html, {
      wordwrap: false,
      selectors: [
        { selector: "a", options: { ignoreHref: true } },
        { selector: "img", format: "skip" },
      ],
    }).slice(0, 3000);
  } catch (error) {
    console.error(`Scraping failed for ${url}:`, error);
    return "";
  }
}

/**
 * Generate summary using Hugging Face
 */
async function generateSummary(content: string): Promise<string | null> {
  if (!process.env.HUGGINGFACE_API_KEY || !content) {
    return null;
  }

  try {
    const cleanContent = content.replace(/[^\w\s.,!?]/g, "").slice(0, 2000);

    const result = await hf.summarization({
      model: HUGGINGFACE_SUMMARY_MODEL,
      inputs: cleanContent,
      parameters: {
        max_length: DEFAULT_SUMMARY_MAX_LENGTH,
        min_length: DEFAULT_SUMMARY_MIN_LENGTH,
      },
      provider: "hf-inference",
    });

    return result.summary_text || null;
  } catch (error) {
    console.warn(
      "Summary generation failed, no fallback available",
      (error as Error)?.message
    );
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

    for (const article of data.articles || []) {
      const content =
        (await scrapeArticleContent(article.url)) ||
        article.content ||
        article.description ||
        "";
      const summary = await generateSummary(content);

      // Skip articles without proper summaries
      if (!summary) {
        console.log(
          `⏭️ Skipping article "${article.title}" - no summary generated`
        );
        continue;
      }

      articles.push({
        title: article.title,
        link: article.url,
        content,
        summary,
        tag: query, // Use the search query as the tag since articles are fetched by tag
        source: "GNews",
        author: article.source?.name || "Unknown",
        publishedAt: new Date(article.publishedAt),
        imageUrl: article.image,
      });

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

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

    for (const article of validArticles) {
      const content =
        (await scrapeArticleContent(article.url)) || article.content || "";
      const summary = await generateSummary(content);

      // Skip articles without proper summaries
      if (!summary) {
        console.log(
          `⏭️ Skipping article "${article.title}" - no summary generated`
        );
        continue;
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
    }

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

      allArticles.push(...articles);
      console.log(`✅ Tag "${tagName}": ${articles.length} articles fetched`);
    } catch (error) {
      if (error instanceof Error && error.message === "RATE_LIMIT") {
        console.log("⚠️ Rate limit hit, switching to NewsAPI");
        useNewsAPI = true;
        try {
          const articles = await fetchFromNewsAPI(tagName, articlesPerTag);
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

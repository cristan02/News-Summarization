// Utility functions for external news APIs and Hugging Face integration
import { InferenceClient } from '@huggingface/inference'

// Initialize Hugging Face client
const hf = new InferenceClient(process.env.HUGGINGFACE_API_KEY)

interface NewsArticle {
  title: string;
  link: string;
  content: string;
  summary?: string; // renamed from shortSummary
  tag: string;
  source: string;
  author?: string;
  publishedAt: Date;
  imageUrl?: string;
}

interface GNewsResponse {
  totalArticles: number;
  articles: Array<{
    title: string;
    description: string;
    content: string;
    url: string;
    image: string;
    publishedAt: string;
    source: {
      name: string;
      url: string;
    };
  }>;
}

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: Array<{
    source: {
      id: string;
      name: string;
    };
    author: string;
    title: string;
    description: string;
    url: string;
    urlToImage: string;
    publishedAt: string;
    content: string;
  }>;
}

/**
 * Scrape full article content from URL
 */
export async function scrapeFullArticleContent(url: string): Promise<string> {
  try {
    console.log(`Scraping full content from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    });

    if (!response.ok) {
      console.log(`Failed to fetch article: ${response.status}`);
      return '';
    }

    const html = await response.text();
    
    // Extract article content using advanced text extraction
    const fullContent = extractArticleTextFromHTML(html);
    
    if (fullContent && fullContent.length > 100) { // Lowered threshold from 200 to 100
      console.log(`Successfully extracted ${fullContent.length} characters`);
      return fullContent;
    }
    
    console.log('Could not extract meaningful content, length:', fullContent?.length || 0);
    return '';

  } catch (error) {
    console.error(`Error scraping article ${url}:`, error);
    return '';
  }
}

/**
 * Extract article text from HTML using advanced patterns
 */
export function extractArticleTextFromHTML(html: string): string {
  // Remove script and style tags
  let cleanHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleanHtml = cleanHtml.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  cleanHtml = cleanHtml.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');
  
  // Common article content selectors (in order of preference)
  const contentSelectors = [
    'article',
    '[class*="article-content"]',
    '[class*="post-content"]',
    '[class*="entry-content"]',
    '[class*="content-body"]',
    '[class*="story-body"]',
    '[class*="article-body"]',
    '[class*="post-body"]',
    '[class*="article-text"]',
    '[class*="story-content"]',
    '[class*="main-content"]',
    '[class*="article-wrap"]',
    '[id*="article-content"]',
    '[id*="story-content"]',
    '[id*="main-content"]',
    '[data-module="ArticleBody"]',
    '[data-testid="article-content"]',
    '.content',
    'main',
    '[role="main"]',
    '.post',
    '.entry'
  ];

  let extractedContent = '';
  let maxContentLength = 0;

  // Try to find content using common patterns
  for (const selector of contentSelectors) {
    try {
      let selectorPattern = selector;
      
      // Handle different selector types
      if (selector.includes('[class*=')) {
        const className = selector.match(/\[class\*="([^"]+)"\]/)?.[1];
        if (className) {
          selectorPattern = `class="[^"]*${className}[^"]*"`;
        }
      } else if (selector.includes('[id*=')) {
        const idName = selector.match(/\[id\*="([^"]+)"\]/)?.[1];
        if (idName) {
          selectorPattern = `id="[^"]*${idName}[^"]*"`;
        }
      } else if (selector.includes('[data-')) {
        selectorPattern = selector.replace(/[\[\]]/g, '');
      }
      
      // Create regex pattern for content extraction
      const regexPattern = selectorPattern.includes('=') 
        ? `<[^>]*${selectorPattern}[^>]*>([\\s\\S]*?)</[^>]*>`
        : `<${selector}[^>]*>([\\s\\S]*?)</${selector}>`;
      
      const regex = new RegExp(regexPattern, 'gi');
      const matches = cleanHtml.match(regex);
      
      if (matches) {
        for (const match of matches) {
          let content = extractParagraphsFromHTML(match);
          
          if (content.length > maxContentLength && content.length > 100) {
            extractedContent = content;
            maxContentLength = content.length;
          }
        }
      }
    } catch (error) {
      console.error(`Error processing selector ${selector}:`, error);
      continue;
    }
  }

  // If no content found with selectors, try to extract from whole document
  if (!extractedContent || extractedContent.length < 500) {
    extractedContent = extractParagraphsFromHTML(cleanHtml);
  }

  // Clean up the extracted content
  extractedContent = extractedContent
    .replace(/\[.*?\]/g, '') // Remove [brackets]
    .replace(/Click here|Read more|Subscribe|Share|Advertisement|Loading\.\.\.|Related:|See also:|Skip to content|Sign In|Sign Up|View All|Load More|Copyright \d{4}/gi, '') // Remove common noise
    .replace(/^\s*[-•]\s*/gm, '') // Remove bullet points
    .trim();

  // Decode HTML entities
  extractedContent = decodeHtmlEntities(extractedContent);

  // Final cleanup
  extractedContent = extractedContent
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Max 2 line breaks
    .trim();
  
  // Apply final news-specific cleaning
  extractedContent = cleanNewsArticleContent(extractedContent);
  
  return extractedContent;
}

// Extract paragraphs: first try <p> tags, fallback to all text
function extractParagraphsFromHTML(html: string): string {
  // First try: extract only <p> tags
  const paragraphs = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
  
  if (paragraphs.length > 0) {
    // Found <p> tags - extract and join with paragraph breaks
    const paragraphTexts = paragraphs
      .map(p => {
        const text = p.replace(/<[^>]*>/g, '').trim();
        return decodeHtmlEntities(text);
      })
      .filter(p => p.length > 20 && !isNavigationContent(p));
    
    if (paragraphTexts.length > 0) {
      return paragraphTexts.join('\n\n');
    }
  }
  
  // Fallback: no good <p> tags found, extract all text
  const allText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return decodeHtmlEntities(allText);
}

/**
 * Decode HTML entities (comprehensive)
 */
function decodeHtmlEntities(text: string): string {
  return text
    // Basic entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Quotes and dashes
    .replace(/&#8220;|&ldquo;/g, '"')  // Left double quote
    .replace(/&#8221;|&rdquo;/g, '"')  // Right double quote
    .replace(/&#8216;|&lsquo;/g, "'")  // Left single quote
    .replace(/&#8217;|&rsquo;/g, "'")  // Right single quote
    .replace(/&#8211;|&ndash;/g, '–')  // En dash
    .replace(/&#8212;|&mdash;/g, '—')  // Em dash
    .replace(/&#8230;|&hellip;/g, '…') // Ellipsis
    // Common numeric entities
    .replace(/&#8242;/g, "'")          // Prime (apostrophe)
    .replace(/&#8243;/g, '"')          // Double prime
    .replace(/&#8482;/g, '™')          // Trademark
    .replace(/&#169;|&copy;/g, '©')    // Copyright
    .replace(/&#174;|&reg;/g, '®')     // Registered
    .replace(/&#176;/g, '°')           // Degree symbol
    .replace(/&#8594;/g, '→')          // Right arrow
    .replace(/&#8592;/g, '←')          // Left arrow
    // Generic numeric entity handler for any remaining &#NNNN;
    .replace(/&#(\d+);/g, (match, num) => {
      try {
        return String.fromCharCode(parseInt(num, 10));
      } catch (e) {
        return match; // Keep original if conversion fails
      }
    })
    // Generic hex entity handler for any remaining &#xNNNN;
    .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch (e) {
        return match; // Keep original if conversion fails
      }
    });
}

/**
 * Check if content is navigation/footer content
 */
function isNavigationContent(text: string): boolean {
  return /^(Sign|Click|Read|Subscribe|Share|Tags:|Copyright|More|Save|Comment|Load|View|Best|Top)/i.test(text.trim());
}

/**
 * Clean news article content for better readability and structure
 */
function cleanNewsArticleContent(content: string): string {
  if (!content) return '';
  
  // Only remove obvious navigation/footer content, preserve article text
const cleaned = content
    .replace(/^.*?Skip to content\s*/i, '') // Remove everything before "Skip to content"
    .replace(/\s*Tags:\s*.*$/gim, '') // Remove tags section at end
    .replace(/\s*Copyright.*$/gim, '') // Remove copyright at end
    .replace(/\s*Sign\s+Up.*?Privacy\s+Policy.*$/gim, '') // Remove newsletter signup at end
    .replace(/\s*Join\s+the\s+Conversation.*$/gim, '') // Remove comments section at end
    .replace(/\s*You\s+May\s+Also\s+Like.*$/gim, '') // Remove related articles at end
    .replace(/\s*Load\s+More.*$/gim, '') // Remove load more at end
    .replace(/Save\s+Comment\s+More\s*/gi, '') // Remove social sharing buttons
    .replace(/FILE\s+PHOTO:.*?REUTERS.*?Photo\s*/gi, '') // Remove photo captions
    .trim();

  // If we have paragraph structure, clean it up
  if (cleaned.includes('\n\n')) {
    const paragraphs = cleaned.split('\n\n');
    const cleanedParagraphs = paragraphs
      .map(para => para.replace(/\s+/g, ' ').trim())
      .filter(para => {
        const trimmed = para.trim();
        return trimmed.length > 30 && 
               !trimmed.match(/^(Sign\s+In|Sign\s+Up|Click|Read\s+more|Subscribe|Share|More|Tags|Copyright|About|Join|Load|View\s+All|Best|Top)/i) &&
               !trimmed.match(/^\d+\s+(Images?|Photos?)/i);
      });

    return cleanedParagraphs.join('\n\n').trim();
  }

  // Single block of text - minimal cleaning to preserve content
  return cleaned
    .replace(/\s+/g, ' ') // Just normalize spaces
    .trim();
}

/**
 * Fetch articles from GNews API
 */
export async function fetchFromGNews(query: string, limit: number = 10, existingTags?: string[]): Promise<NewsArticle[]> {
  try {
    const apiKey = process.env.GNEWS_API_KEY;
    if (!apiKey) {
      throw new Error('GNews API key not found');
    }

    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&token=${apiKey}&lang=en&country=us&max=${limit}&sortby=publishedAt`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'News-Summarization-App/1.0'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GNews API Error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('RATE_LIMIT_EXCEEDED');
      }
      throw new Error(`GNews API error: ${response.status}`);
    }

    const data: GNewsResponse = await response.json();
    
    const articles: NewsArticle[] = [];
    
    for (const article of data.articles) {
      try {
        // Try to get full content by scraping the article URL
        console.log(`Processing GNews article: ${article.title.substring(0, 50)}...`);
        let fullContent = await scrapeFullArticleContent(article.url);
        
        // If scraping fails, fall back to API content/description
        if (!fullContent || fullContent.length < 100) { // Lowered threshold
          fullContent = article.content || article.description || '';
          console.log(`Using API content for: ${article.title.substring(0, 50)}... (${fullContent.length} chars)`);
        } else {
          console.log(`Scraped full content for: ${article.title.substring(0, 50)}... (${fullContent.length} chars)`);
        }
        
        articles.push({
          title: article.title,
          link: article.url,
          content: fullContent,
          tag: categorizeArticle(article.title + ' ' + article.description, existingTags, query),
          source: 'GNews',
          author: article.source.name,
          publishedAt: new Date(article.publishedAt),
          imageUrl: article.image
        });
        
        // Add delay between scraping requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Error processing article ${article.title}:`, error);
        // Add article with basic content if processing fails
        articles.push({
          title: article.title,
          link: article.url,
          content: article.content || article.description || '',
          tag: categorizeArticle(article.title + ' ' + article.description, existingTags, query),
          source: 'GNews',
          author: article.source.name,
          publishedAt: new Date(article.publishedAt),
          imageUrl: article.image
        });
      }
    }
    
    return articles;

  } catch (error) {
    console.error('Error fetching from GNews:', error);
    if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') {
      throw error;
    }
    return [];
  }
}

/**
 * Fetch articles from NewsAPI as fallback
 */
export async function fetchFromNewsAPI(query: string, limit: number = 10, existingTags?: string[]): Promise<NewsArticle[]> {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      throw new Error('NewsAPI key not found');
    }

    // Use current date - 1 day to get recent news
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 1);
    const fromDateStr = fromDate.toISOString().split('T')[0];

    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&from=${fromDateStr}&sortBy=publishedAt&apiKey=${apiKey}&pageSize=${limit}&language=en`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'News-Summarization-App/1.0'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NewsAPI Error:', response.status, errorText);
      throw new Error(`NewsAPI error: ${response.status}`);
    }

    const data: NewsAPIResponse = await response.json();
    
    const filteredArticles = data.articles
      .filter(article => article.content && article.content !== '[Removed]' && article.url);

    const processedArticles: NewsArticle[] = [];

    // Process each article individually to scrape full content
    for (const article of filteredArticles) {
      try {
        // Attempt to scrape full article content
        console.log(`Processing NewsAPI article: ${article.title.substring(0, 50)}...`);
        const fullContent = await scrapeFullArticleContent(article.url);
        
        const processedArticle: NewsArticle = {
          title: article.title,
          link: article.url,
          content: fullContent || article.content || article.description,
          tag: categorizeArticle(article.title + ' ' + (article.description || ''), existingTags, query),
          source: 'NewsAPI',
          author: article.author || article.source.name,
          publishedAt: new Date(article.publishedAt),
          imageUrl: article.urlToImage
        };

        if (fullContent && fullContent.length > 100) { // Lowered threshold
          console.log(`Scraped full content for: ${article.title.substring(0, 50)}... (${fullContent.length} chars)`);
        } else {
          console.log(`Using API content for: ${article.title.substring(0, 50)}... (${(article.content || article.description)?.length || 0} chars)`);
        }

        processedArticles.push(processedArticle);

        // Add delay between requests to be respectful to websites
        if (processedArticles.length < filteredArticles.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`Error processing NewsAPI article ${article.url}:`, error);
        
        // Fallback to original content if scraping fails
        const fallbackArticle: NewsArticle = {
          title: article.title,
          link: article.url,
          content: article.content || article.description,
          tag: categorizeArticle(article.title + ' ' + (article.description || ''), existingTags, query),
          source: 'NewsAPI',
          author: article.author || article.source.name,
          publishedAt: new Date(article.publishedAt),
          imageUrl: article.urlToImage
        };

        processedArticles.push(fallbackArticle);
      }
    }

    return processedArticles;

  } catch (error) {
    console.error('Error fetching from NewsAPI:', error);
    return [];
  }
}

/**
 * Generate summary using Hugging Face API with the official library
 */
export async function generateSummaryWithHuggingFace(content: string): Promise<string> {
  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey || apiKey === 'your_huggingface_api_key_here') {
      // Fallback to simple extraction if no API key
      return extractSentencesForSummary(content);
    }

    // Clean and prepare content for summarization
    const cleanedContent = cleanContentForSummarization(content);
    
    // Increase input length for better summaries but keep within Hugging Face limits
    // BART can handle up to 1024 tokens, which is roughly 2000-3000 characters
    const maxInputLength = 2500;
    const truncatedContent = cleanedContent.length > maxInputLength ? 
      cleanedContent.substring(0, maxInputLength) + '...' : cleanedContent;

    // Use the official Hugging Face library for summarization
    const result = await hf.summarization({
      model: 'facebook/bart-large-cnn',
      inputs: truncatedContent,
      parameters: {
        max_length: 180,  // Increased for longer paragraph (6-8 lines)
        min_length: 80,   // Minimum 80 words for substantial paragraph
        length_penalty: 1.2,  // Allow longer summaries
        num_beams: 4,
        early_stopping: true,
        do_sample: false,
        no_repeat_ngram_size: 3  // Prevent repetition
      },
      // Specify provider for better reliability
      provider: 'hf-inference'
    });
    
    if (result && result.summary_text) {
      const summary = result.summary_text.trim();
      // Allow longer summaries - limit to ~600 characters (6-8 lines)
      if (summary.length > 600) {
        const sentences = summary.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
        // Take first 4-5 sentences for a good paragraph
        return sentences.slice(0, 5).join('. ').trim() + '.';
      }
      return summary;
    }
    
    // Fallback if no summary generated
    return extractSentencesForSummary(content);

  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        console.warn('Hugging Face API timeout - falling back to basic summary extraction');
      } else {
        console.error('Error generating summary with Hugging Face:', error.message);
      }
    } else {
      console.error('Error generating summary with Hugging Face:', error);
    }
    return extractSentencesForSummary(content);
  }
}

/**
 * Clean content for better summarization
 */
function cleanContentForSummarization(content: string): string {
  if (!content) return '';
  
  // Remove common noise patterns from news content
  let cleaned = content
    .replace(/\[.*?\]/g, '') // Remove [brackets] content
    .replace(/\(.*?\)/g, '') // Remove (parentheses) content
    .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
    .replace(/\b\d{1,2}:\d{2}\s?(AM|PM|am|pm)\b/g, '') // Remove timestamps
    .replace(/\b(Click here|Read more|Subscribe|Share this)\b[^.]*[.!?]/gi, '') // Remove call-to-action sentences
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  // If content is still very long, take the first few paragraphs
  const paragraphs = cleaned.split('\n\n').filter(p => p.trim().length > 50);
  if (paragraphs.length > 2) {
    cleaned = paragraphs.slice(0, 2).join('\n\n');
  }
  
  return cleaned;
}

/**
 * Improved fallback summary generation - extract meaningful sentences
 */
function extractSentencesForSummary(content: string): string {
  if (!content) return 'No summary available.';
  
  const cleaned = cleanContentForSummarization(content);
  const sentences = cleaned.match(/[^\.!?]+[\.!?]+/g) || [];
  
  if (sentences.length === 0) {
    // If no proper sentences found, take first 500 characters for longer paragraph
    return cleaned.substring(0, 500).trim() + '...';
  }
  
  // Take first 5-6 sentences that are meaningful (not too short)
  const meaningfulSentences = sentences
    .filter(s => s.trim().length > 15) // Filter out very short sentences
    .slice(0, 6); // Take up to 6 sentences for longer paragraph
  
  if (meaningfulSentences.length === 0) {
    return sentences[0]?.trim() || 'No summary available.';
  }
  
  const summary = meaningfulSentences.join(' ').trim();
  
  // Ensure summary is appropriate length for longer paragraph (around 600 characters)
  if (summary.length > 600) {
    // Find a good breaking point near 600 characters
    const breakPoint = summary.lastIndexOf('.', 600);
    if (breakPoint > 300) {
      return summary.substring(0, breakPoint + 1).trim();
    } else {
      return summary.substring(0, 600).trim() + '...';
    }
  }
  
  return summary;
}

/**
 * Categorize article based on content using only existing tags from database
 * Will only assign tags that already exist in your Tag table
 */
function categorizeArticle(text: string, existingTags?: string[], searchQuery?: string): string {
  const lowercaseText = text.toLowerCase();
  
  // First, check if the search query itself should be the tag (when searching for specific tags)
  if (searchQuery && existingTags?.includes(searchQuery)) {
    const queryLower = searchQuery.toLowerCase();
    // If the search query appears in the content, use it as the tag
    if (lowercaseText.includes(queryLower) || 
        lowercaseText.includes(queryLower.replace(/\s+/g, '')) ||
        queryLower.split(' ').some(word => lowercaseText.includes(word))) {
      return searchQuery;
    }
  }
  
  // Try to match against existing tags from database
  if (existingTags && existingTags.length > 0) {
    // First pass: exact matches
    for (const tag of existingTags) {
      const tagLower = tag.toLowerCase();
      if (lowercaseText.includes(tagLower) || 
          lowercaseText.includes(tagLower.replace(/\s+/g, ''))) {
        return tag;
      }
    }
    
    // Second pass: partial word matches
    for (const tag of existingTags) {
      const tagWords = tag.toLowerCase().split(' ');
      if (tagWords.length > 1 && tagWords.every(word => lowercaseText.includes(word))) {
        return tag;
      }
    }
    
    // Third pass: individual word matches for multi-word tags
    for (const tag of existingTags) {
      const tagWords = tag.toLowerCase().split(' ');
      if (tagWords.some(word => word.length > 3 && lowercaseText.includes(word))) {
        return tag;
      }
    }
  }
  
  // If we're searching for a specific tag and no matches found, 
  // still assign to that tag since user requested it
  if (searchQuery && existingTags?.includes(searchQuery)) {
    return searchQuery;
  }
  
  // If no existing tags match and we have existing tags, use the first one as default
  // This ensures we only use tags that exist in your database
  if (existingTags && existingTags.length > 0) {
    return existingTags[0]; // Use the most popular tag (first in the list)
  }
  
  // Only create 'general' if no existing tags available at all
  return 'general';
}

/**
 * Fetch articles with GNews primary and NewsAPI fallback
 */
export async function fetchArticlesWithFallback(queries: string[], articlesPerQuery: number = 2, existingTags?: string[]): Promise<NewsArticle[]> {
  console.log(`🔍 Starting article fetch: ${queries.length} queries, ${articlesPerQuery} articles per query`);
  
  const allArticles: NewsArticle[] = [];
  let useNewsAPIFallback = false;

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    console.log(`\n📰 Processing query ${i + 1}/${queries.length}: "${query}"`);
    
    try {
      let articles: NewsArticle[] = [];

      if (!useNewsAPIFallback) {
        try {
          articles = await fetchFromGNews(query, articlesPerQuery, existingTags);
          console.log(`   ✅ GNews: Retrieved ${articles.length} articles`);
        } catch (error) {
          if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') {
            console.log('   ⚠️  GNews rate limit exceeded, switching to NewsAPI for remaining queries');
            useNewsAPIFallback = true;
            articles = await fetchFromNewsAPI(query, articlesPerQuery, existingTags);
            console.log(`   ✅ NewsAPI (fallback): Retrieved ${articles.length} articles`);
          } else {
            throw error;
          }
        }
      } else {
        articles = await fetchFromNewsAPI(query, articlesPerQuery, existingTags);
        console.log(`   ✅ NewsAPI: Retrieved ${articles.length} articles`);
      }

      // Generate summaries for each article
      console.log(`   🤖 Generating summaries for ${articles.length} articles...`);
      for (let j = 0; j < articles.length; j++) {
        const article = articles[j];
        if (!article.summary && article.content) {
          article.summary = await generateSummaryWithHuggingFace(article.content);
          console.log(`      📝 Summary ${j + 1}/${articles.length} generated`);
        }
      }

      allArticles.push(...articles);

      // Add delay between requests to respect rate limits
      if (i < queries.length - 1) {
        console.log(`   ⏳ Waiting 1s before next query...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error(`   ❌ Error fetching articles for query "${query}":`, error);
      continue;
    }
  }

  console.log(`\n🎯 Fetch complete: ${allArticles.length} total articles retrieved`);
  return allArticles;
}

// Utility functions for external news APIs and Hugging Face integration

interface NewsArticle {
  title: string;
  link: string;
  content: string;
  shortSummary?: string;
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
          // Check if this element contains paragraphs for structure
          const paragraphsInMatch = match.match(/<p[^>]*>[\s\S]*?<\/p>/gi) || [];
          
          let content = '';
          if (paragraphsInMatch.length > 2) {
            // Multiple paragraphs found - preserve structure
            content = paragraphsInMatch
              .map(p => p.replace(/<[^>]*>/g, '').trim())
              .filter(p => p.length > 20) // Remove very short paragraphs
              .join('\n\n');
          } else {
            // Single or no paragraphs - extract all text
            content = match.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          }
          
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

  // If no content found with selectors, try to extract all paragraphs
  if (!extractedContent || extractedContent.length < 500) {
    const paragraphs = cleanHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
    
    if (paragraphs.length > 2) {
      // Multiple paragraphs - preserve structure
      const structuredContent = paragraphs
        .map(p => {
          const text = p.replace(/<[^>]*>/g, '').trim();
          return decodeHtmlEntities(text);
        })
        .filter(p => p.length > 20 && !isNavigationContent(p))
        .join('\n\n');
      
      if (structuredContent.length > extractedContent.length) {
        extractedContent = structuredContent;
      }
    } else {
      // Few paragraphs - combine as single text
      const combinedContent = paragraphs
        .map(p => p.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim())
        .filter(p => p.length > 20 && !isNavigationContent(p))
        .join(' ');
      
      if (combinedContent.length > extractedContent.length) {
        extractedContent = combinedContent;
      }
    }
  }

  // If still no good content, extract from all text content
  if (!extractedContent || extractedContent.length < 500) {
    const allText = cleanHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (allText.length > extractedContent.length) {
      extractedContent = allText;
    }
  }

  // Clean up the extracted content but preserve paragraph structure
  extractedContent = extractedContent
    .replace(/\[.*?\]/g, '') // Remove [brackets]
    .replace(/\(.*?\)/g, '') // Remove (parentheses) that might contain metadata
    .replace(/Click here|Read more|Subscribe|Share|Advertisement|Loading\.\.\.|Related:|See also:|Skip to content|Sign In|Sign Up|View All|Load More|Copyright \d{4}/gi, '') // Remove common noise
    .replace(/^\s*[-•]\s*/gm, '') // Remove bullet points
    .trim();

  // Decode HTML entities
  extractedContent = decodeHtmlEntities(extractedContent);

  // Only apply paragraph formatting if we already have paragraph breaks
  if (extractedContent.includes('\n\n')) {
    // Clean up existing paragraph structure
    const paragraphs = extractedContent.split('\n\n');
    extractedContent = paragraphs
      .map(para => para.replace(/\s+/g, ' ').trim()) // Normalize spaces within each paragraph
      .filter(para => para.length > 20) // Remove very short paragraphs
      .join('\n\n'); // Rejoin with proper paragraph breaks
  } else {
    // No paragraph structure detected - keep as single block but clean
    extractedContent = extractedContent.replace(/\s+/g, ' ').trim();
    
    // Optionally add paragraph breaks for very long content with clear sentence patterns
    if (extractedContent.length > 1000) {
      extractedContent = extractedContent
        .replace(/\.\s+([A-Z][a-z]{2,})/g, '.\n\n$1') // Add breaks before sentences starting with longer words
        .replace(/\?\s+([A-Z][a-z]{2,})/g, '?\n\n$1')
        .replace(/!\s+([A-Z][a-z]{2,})/g, '!\n\n$1');
    }
  }

  console.log(`Extracted content length: ${extractedContent.length} characters`);
  
  // Clean up navigation and footer content
  extractedContent = extractedContent
    .replace(/News\s+News\s+Sections.*?Sign\s+In/gi, '') // Remove navigation
    .replace(/Tags:.*$/gi, '') // Remove tags section
    .replace(/Galleries.*$/gi, '') // Remove galleries section
    .replace(/You\s+May\s+Also\s+Like.*$/gi, '') // Remove related articles
    .replace(/Copyright.*?Privacy\s+Policy.*$/gi, '') // Remove footer
    .replace(/\s+More\s+Reuters\s+/gi, ' ') // Clean Reuters attribution
    .replace(/FILE\s+PHOTO:.*?Photo\s+/gi, '') // Remove photo captions
    .replace(/By\s+[A-Z][a-z]+\s+[A-Z][a-z]+.*?\d{4}.*?p\.m\.\s+/gi, ''); // Clean author lines

  // Final cleanup
  extractedContent = extractedContent
    .replace(/\s+/g, ' ') // Normalize whitespace again
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Max 2 line breaks
    .trim();
  
  // Apply final news-specific cleaning
  extractedContent = cleanNewsArticleContent(extractedContent);
  
  return extractedContent;
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '...')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"');
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
  let cleaned = content
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

    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&token=${apiKey}&lang=en&country=us&max=${limit}`;
    
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

    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&from=${fromDateStr}&sortBy=popularity&apiKey=${apiKey}&pageSize=${limit}&language=en`;
    
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
 * Generate summary using Hugging Face API
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

    const response = await fetch('https://api-inference.huggingface.co/models/facebook/bart-large-cnn', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: truncatedContent,
        parameters: {
          max_length: 180,  // Increased for longer paragraph (6-8 lines)
          min_length: 80,   // Minimum 80 words for substantial paragraph
          length_penalty: 1.2,  // Allow longer summaries
          num_beams: 4,
          early_stopping: true,
          do_sample: false,
          no_repeat_ngram_size: 3  // Prevent repetition
        }
      })
    });

    if (!response.ok) {
      console.error('Hugging Face API Error:', response.status, await response.text());
      return extractSentencesForSummary(content);
    }

    const result = await response.json();
    
    if (result && result[0] && result[0].summary_text) {
      const summary = result[0].summary_text.trim();
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
    console.error('Error generating summary with Hugging Face:', error);
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
export async function fetchArticlesWithFallback(queries: string[], articlesPerQuery: number = 10, existingTags?: string[]): Promise<NewsArticle[]> {
  const allArticles: NewsArticle[] = [];
  let useNewsAPIFallback = false;

  for (const query of queries) {
    try {
      let articles: NewsArticle[] = [];

      if (!useNewsAPIFallback) {
        try {
          articles = await fetchFromGNews(query, articlesPerQuery, existingTags);
          console.log(`Fetched ${articles.length} articles from GNews for query: ${query}`);
        } catch (error) {
          if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') {
            console.log('GNews rate limit exceeded, switching to NewsAPI for remaining queries');
            useNewsAPIFallback = true;
            articles = await fetchFromNewsAPI(query, articlesPerQuery, existingTags);
          } else {
            throw error;
          }
        }
      } else {
        articles = await fetchFromNewsAPI(query, articlesPerQuery, existingTags);
        console.log(`Fetched ${articles.length} articles from NewsAPI for query: ${query}`);
      }

      // Generate summaries for each article
      for (const article of articles) {
        if (!article.shortSummary && article.content) {
          article.shortSummary = await generateSummaryWithHuggingFace(article.content);
        }
      }

      allArticles.push(...articles);

      // Add delay between requests to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`Error fetching articles for query "${query}":`, error);
      continue;
    }
  }

  return allArticles;
}

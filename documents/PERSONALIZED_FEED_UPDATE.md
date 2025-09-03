# News Summarization - Personalized Feed Updates

## Recent Changes

### Database Schema Updates
- **Articles now use single tags instead of tag arrays**
- Each article has one specific tag (e.g., "technology", "cybersecurity", "apple")
- Added new fields: `source`, `author`, `publishedAt`, `imageUrl`
- Updated indexes for better performance

### New Features

#### 1. Enhanced Tag System
- Expanded tag list to 60+ relevant news categories
- Tags are designed to work with news APIs (NewsAPI, Guardian API, etc.)
- Tags include both broad categories (`technology`, `business`) and specific topics (`artificial-intelligence`, `cryptocurrency`)

#### 2. External Article Fetching
- New API endpoint: `/api/articles/fetch-external`
- Fetches articles from external news sources based on user preferences
- Currently uses mock data (replace with real news API integration)
- Articles are automatically saved to database

#### 3. Improved User Experience
- Personalized feed now properly filters articles by user's selected tags
- Single-tag system makes filtering more precise and faster
- Better article cards with source information and publish dates
- Enhanced user preferences page with article fetching capability

## How to Use

### Setting Up User Preferences
1. Go to `/user-preferences`
2. Select tags you're interested in from the available list
3. Click "Save Preferences" to store your interests
4. Click "Fetch Latest Articles" to get articles matching your interests

### Viewing Your Feed
1. Go to `/feed` to see personalized articles
2. Articles are filtered based on your selected tags
3. If no preferences are set, you'll be prompted to configure them
4. Use the search functionality to find specific articles

### Browsing All Articles
1. Go to `/all-feed` to see all available articles
2. Filter by tag by clicking on any tag badge
3. Use search to find specific content

## Technical Implementation

### Single Tag Architecture
```typescript
// Before (multiple tags)
interface Article {
  tags: string[]  // ["Technology", "AI", "Machine Learning"]
}

// After (single tag)
interface Article {
  tag: string     // "artificial-intelligence"
  source?: string // "NewsAPI"
  author?: string // "John Smith"
  publishedAt?: DateTime
  imageUrl?: string
}
```

### News API Integration
The system is designed to work with external news APIs:

```typescript
// Example integration with NewsAPI
const fetchFromNewsAPI = async (tag: string) => {
  const response = await fetch(`https://newsapi.org/v2/everything?q=${tag}&apiKey=${API_KEY}`)
  const data = await response.json()
  
  return data.articles.map(article => ({
    title: article.title,
    content: article.content || article.description,
  summary: article.description,
    tag: tag,
    source: article.source.name,
    author: article.author,
    publishedAt: new Date(article.publishedAt),
    imageUrl: article.urlToImage,
    link: article.url
  }))
}
```

### Database Seeding
Run the following commands to set up the database:

```bash
# Update database schema
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed database with tags, articles, and test user
npx tsx prisma/seed.ts
```

## Integration with News APIs

### Recommended APIs
1. **NewsAPI** - General news from various sources
2. **Guardian API** - High-quality journalism
3. **Associated Press API** - Breaking news and wire stories
4. **Reddit API** - Community-driven content
5. **Google News API** - Aggregated news content

### Implementation Steps
1. Replace the mock `fetchArticlesFromNewsAPI` function in `/api/articles/fetch-external/route.ts`
2. Add API keys to environment variables
3. Implement rate limiting and error handling
4. Set up scheduled tasks to fetch articles automatically

### Environment Variables Needed
```env
NEWSAPI_KEY=your_newsapi_key
GUARDIAN_API_KEY=your_guardian_key
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_secret
```

## Benefits of Single-Tag System

1. **Simplified Filtering**: Exact tag matching instead of complex array operations
2. **Better Performance**: Faster database queries with single-field indexes
3. **News API Compatibility**: Most news APIs categorize articles with single topics
4. **Cleaner UI**: Single tag per article makes the interface less cluttered
5. **Precise Personalization**: Users get exactly what they're interested in

## User Workflow

1. **Onboarding**: User selects preferred news categories
2. **Article Fetching**: System retrieves latest articles for selected categories
3. **Personalized Feed**: User sees only articles matching their interests
4. **Discovery**: User can browse all articles and discover new topics
5. **Preference Updates**: User can modify interests and fetch new content

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live article updates
2. **AI Summarization**: Generate better summaries using AI models
3. **Reading History**: Track user reading patterns
4. **Recommendation Engine**: Suggest new topics based on reading behavior
5. **Social Features**: Share articles and follow other users' recommendations

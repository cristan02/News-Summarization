# News Summarization - Vercel Cron Jobs Setup

This project includes automated cron jobs that run on Vercel to fetch news articles from external APIs and process them with AI summarization.

## Cron Jobs Overview

### 1. Daily News Fetch (`/api/cron/daily-news-fetch`)
- **Schedule**: Every day at 6:00 AM UTC (`0 6 * * *`)
- **Purpose**: Fetches latest news articles from GNews API and NewsAPI
- **Features**:
  - Primary source: GNews API (better content quality)
  - Fallback: NewsAPI (when GNews rate limit is exceeded)
  - AI-powered summarization using Hugging Face
  - Automatic categorization and tagging
  - Duplicate detection and prevention
  - Database storage in MongoDB

### 2. Cleanup Old Articles (`/api/cron/cleanup-old-articles`)
- **Schedule**: Every day at 2:00 AM UTC (`0 2 * * *`)
- **Purpose**: Maintains database hygiene
- **Features**:
  - Removes articles older than 60 days
  - Cleans up unused tags
  - Updates tag usage counts

## Required Environment Variables

```env
# API Keys
GNEWS_API_KEY="your_gnews_api_key"
NEWS_API_KEY="your_newsapi_key"
HUGGINGFACE_API_KEY="your_huggingface_token"

# Security
CRON_SECRET="your_secure_random_string"

# Database
DATABASE_URL="your_mongodb_connection_string"
```

## Getting API Keys

### 1. GNews API
1. Visit [GNews.io](https://gnews.io/)
2. Sign up for a free account
3. Get your API token from the dashboard
4. Free tier: 100 requests per day

### 2. NewsAPI
1. Visit [NewsAPI.org](https://newsapi.org/)
2. Register for a free account
3. Get your API key from the dashboard
4. Free tier: 1000 requests per day

### 3. Hugging Face
1. Visit [Hugging Face](https://huggingface.co/)
2. Create an account and go to Settings > Access Tokens
3. Create a new token with read permissions
4. The app uses the `facebook/bart-large-cnn` model for summarization

## Deployment on Vercel

1. **Deploy your Next.js app to Vercel**
2. **Set environment variables** in Vercel dashboard
3. **The `vercel.json` file** automatically configures the cron jobs
4. **Cron jobs will run automatically** once deployed

## Security

- Cron endpoints are protected with a `CRON_SECRET` token
- Only authenticated requests are processed
- Rate limiting is handled gracefully with fallback APIs

## Manual Testing

Visit `/cron-test` in your deployed app to manually trigger cron jobs for testing.

## API Endpoints

### Cron Jobs (Protected)
- `GET /api/cron/daily-news-fetch` - Daily news fetch
- `GET /api/cron/cleanup-old-articles` - Cleanup job

### Manual Triggers (Auth Required)
- `POST /api/cron/manual-trigger` - Trigger cron jobs manually

### Disabled Endpoints
- `POST /api/articles/fetch-external` - **Disabled** - External fetching now only happens via cron jobs

## Database Schema

Articles are stored with the following structure:
- Title, content, and AI-generated summary
- Source attribution (GNews/NewsAPI)
- Automatic categorization and tagging
- Publication date and metadata
- Vector embeddings (for future similarity search)

## Rate Limiting Strategy

1. **Primary**: GNews API (100 requests/day)
2. **Fallback**: NewsAPI (1000 requests/day)
3. **Graceful degradation**: If both APIs are exhausted, the job continues with existing data
4. **Delays**: 1-second delay between API requests to respect rate limits

## Monitoring

Check the cron job execution logs in Vercel dashboard:
1. Go to your Vercel project
2. Click on "Functions" tab
3. View logs for `/api/cron/daily-news-fetch` and `/api/cron/cleanup-old-articles`

## Troubleshooting

### Common Issues:
1. **Rate limits exceeded**: The system automatically falls back to NewsAPI
2. **Hugging Face API errors**: Falls back to simple text extraction
3. **Database connection errors**: Check MongoDB connection string
4. **Unauthorized errors**: Verify CRON_SECRET is set correctly

### Debugging:
- Use the `/cron-test` page to manually trigger jobs
- Check Vercel function logs for detailed error messages
- Monitor the response JSON for job statistics

## Architecture Benefits

- **Resilient**: Multiple API fallbacks prevent total failure
- **Efficient**: Intelligent rate limiting and duplicate detection
- **Scalable**: MongoDB storage with proper indexing
- **Smart**: AI-powered summarization and categorization
- **Maintainable**: Automatic cleanup and database hygiene

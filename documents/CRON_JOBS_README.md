# News Summarization - Automated Operations Guide

This project includes automated cron jobs that run on Vercel to fetch news articles from external APIs, process them with AI summarization, and maintain database hygiene.

## 🔄 Cron Jobs Overview

### Daily Operations (`/api/cron/daily-operations`)

- **Schedule**: Every day at 2:00 AM UTC (`0 2 * * *`)
- **Purpose**: Combined news fetching and database cleanup
- **Features**:
  - **News Fetching**:
    - Processes ALL available tags (no limit)
    - Fetches 10 articles per tag
    - Primary source: GNews API (better content quality)
    - Fallback: NewsAPI (when GNews rate limit is exceeded)
    - AI-powered summarization using Hugging Face BART model
    - Content chunking and vector embeddings for RAG
    - Automatic categorization and tagging
    - Duplicate detection and prevention
  - **Database Cleanup**:
    - Removes articles older than 7 days
    - Cleans up associated article chunks and embeddings
    - Maintains database performance and storage efficiency

## ⚙️ Configuration

### Required Environment Variables

```env
# External News APIs
GNEWS_API_KEY="your_gnews_api_key"           # Primary source (100 req/day free)
NEWS_API_KEY="your_newsapi_key"              # Fallback source (1000 req/day free)

# AI Services
HUGGINGFACE_API_KEY="your_huggingface_token" # For summarization & embeddings

# Security
CRON_SECRET="your_secure_random_string"      # Protects cron endpoints

# Database
DATABASE_URL="your_mongodb_connection_string" # MongoDB with Prisma
```

### Vercel Configuration (`vercel.json`)

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-operations",
      "schedule": "0 1 * * *"
    }
  ]
}
```

## 🔑 Getting API Keys

### 1. GNews API (Primary Source)

1. Visit [GNews.io](https://gnews.io/)
2. Sign up for a free account
3. Get your API token from the dashboard
4. **Free tier**: 100 requests per day
5. **Features**: High-quality articles, good content extraction
6. **Rate limiting**: Automatic fallback to NewsAPI when exhausted

### 2. NewsAPI (Fallback Source)

1. Visit [NewsAPI.org](https://newsapi.org/)
2. Register for a free account
3. Get your API key from the dashboard
4. **Free tier**: 1000 requests per day
5. **Features**: Large article volume, good coverage
6. **Usage**: Activated automatically when GNews hits limits

### 3. Hugging Face (AI Services)

1. Visit [Hugging Face](https://huggingface.co/)
2. Create an account and go to Settings > Access Tokens
3. Create a new token with **read permissions**
4. **Models used**:
   - `facebook/bart-large-cnn` - Article summarization
   - `sentence-transformers/all-MiniLM-L6-v2` - Vector embeddings
   - `meta-llama/Llama-3.1-8B-Instruct` - Chat interactions

### 4. MongoDB (Database)

1. **Option A**: MongoDB Atlas (recommended)
   - Visit [MongoDB Atlas](https://cloud.mongodb.com/)
   - Create free cluster (512MB storage)
   - Get connection string from "Connect" > "Connect your application"
2. **Option B**: Local MongoDB
   - Install MongoDB locally
   - Use connection string: `mongodb://localhost:27017/news-hub`

## 🚀 Deployment Guide

### Vercel Deployment (Recommended)

1. **Push code to GitHub repository**
2. **Connect repository to Vercel**:
   - Visit [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project" and import your repository
3. **Configure environment variables**:
   - Go to Project Settings > Environment Variables
   - Add all required variables from the configuration section
4. **Deploy**:
   - Vercel automatically deploys on push to main branch
   - Cron jobs start working immediately after deployment
5. **Verify deployment**:
   - Visit `/cron-test` to manually trigger jobs
   - Check Vercel function logs for execution details

### Environment Variables Setup in Vercel

```env
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/database
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secure-secret-key
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-secret
GNEWS_API_KEY=your-gnews-api-key
NEWS_API_KEY=your-newsapi-key
HUGGINGFACE_API_KEY=your-huggingface-token
CRON_SECRET=your-secure-cron-secret
```

## 🔒 Security & Authentication

### Cron Job Security

- **CRON_SECRET Protection**: All cron endpoints require Bearer token authentication
- **Development Mode**: Bypasses security checks for local testing
- **Manual Triggers**: Require user authentication via NextAuth.js
- **Rate Limiting**: Built-in protection against API abuse

### API Security Best Practices

- Store all secrets in environment variables
- Use secure random strings for CRON_SECRET (32+ characters)
- Rotate API keys regularly
- Monitor API usage dashboards
- Enable IP restrictions where available

## 🧪 Manual Testing & Monitoring

### Testing Interface (`/cron-test`)

- **Manual Triggers**: Test cron jobs without waiting for schedule
- **Real-time Results**: View job execution details and statistics
- **Error Debugging**: See detailed error messages and stack traces
- **Performance Monitoring**: Track execution time and resource usage

### Monitoring Cron Jobs

1. **Vercel Dashboard**:

   - Go to your project > Functions tab
   - View logs for `/api/cron/daily-operations`
   - Monitor execution frequency and success rates

2. **Application Logs**:

   - Check console output for detailed execution steps
   - Monitor API rate limit usage
   - Track article processing statistics

3. **Database Monitoring**:
   - Monitor article count trends
   - Check tag usage patterns
   - Verify cleanup operations

## 📊 API Endpoints Reference

### Protected Cron Endpoints

```typescript
GET / api / cron / daily - operations;
// Automated execution (protected by CRON_SECRET)
// Headers: Authorization: Bearer <CRON_SECRET>

POST / api / cron / daily - operations;
// Manual trigger (requires user authentication)
// Auth: NextAuth.js session required
```

### Response Format

```json
{
  "success": true,
  "message": "Daily operations completed successfully",
  "cleanup": {
    "articlesDeleted": 15,
    "chunksDeleted": 45,
    "cutoffDate": "2025-08-31T02:00:00.000Z"
  },
  "newsFetch": {
    "queriesProcessed": -1, // -1 = all tags processed
    "articlesFetched": 120,
    "articlesSaved": 85,
    "articlesAlreadyExisted": 30,
    "errors": 5
  },
  "timestamp": "2025-09-07T02:00:00.000Z"
}
```

## 🛠️ Advanced Configuration

### Content Processing Settings

```typescript
// In src/lib/constants.ts
export const DEFAULT_ARTICLES_PER_TAG = 10; // Articles per tag
export const DEFAULT_ARTICLE_RETENTION_DAYS = 7; // Cleanup threshold
export const DEFAULT_SUMMARY_MAX_LENGTH = 150; // Summary length
export const DEFAULT_SUMMARY_MIN_LENGTH = 50; // Minimum summary
export const DEFAULT_API_TIMEOUT = 10000; // API timeout (ms)
```

### Database Schema Considerations

- **Articles**: Automatic indexing on `publishedAt` and `createdAt`
- **Chunks**: Vector embeddings for semantic search
- **Tags**: Usage count tracking for popularity ranking
- **Cleanup**: Cascading deletion of chunks when articles are removed

## 🔧 Troubleshooting Guide

### Common Issues & Solutions

#### 1. Cron Jobs Not Running

```bash
# Check Vercel deployment
vercel logs --follow

# Verify environment variables
vercel env ls

# Test manual trigger
curl -X POST https://your-app.vercel.app/api/cron/daily-operations \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
```

#### 2. API Rate Limit Errors

- **GNews exhausted**: System automatically switches to NewsAPI
- **Both APIs exhausted**: Job continues with existing content
- **Solution**: Upgrade API plans or reduce `DEFAULT_ARTICLES_PER_TAG`

#### 3. AI Service Failures

- **Hugging Face errors**: Articles saved without summaries
- **Timeout issues**: Increase `DEFAULT_API_TIMEOUT`
- **Model errors**: Check Hugging Face service status

#### 4. Database Connection Issues

```bash
# Test MongoDB connection
npx prisma db pull

# Verify connection string format
mongodb+srv://username:password@cluster.mongodb.net/database

# Check IP whitelist in MongoDB Atlas
```

#### 5. Memory/Performance Issues

- **Large content**: Articles chunked automatically
- **Vector embeddings**: Generated asynchronously
- **Cleanup timing**: Runs before fetch to free space

### Debug Commands

```bash
# Local development testing
npm run dev
# Visit http://localhost:3000/cron-test

# Check Prisma schema
npx prisma studio

# View database contents
npx prisma db seed

# Reset database (caution!)
npx prisma db push --force-reset
```

## 📈 Performance & Optimization

### Current Limits & Recommendations

- **Articles per run**: ~500-1000 (depends on tag count)
- **Processing time**: 5-15 minutes per execution
- **Storage growth**: ~10-50MB per day
- **API usage**: 100-200 requests per day

### Optimization Strategies

1. **Tag Management**: Remove unused tags to reduce processing
2. **Content Filtering**: Implement quality filters for articles
3. **Caching**: Cache API responses during development
4. **Parallel Processing**: Consider batch processing for large tag sets

### Scaling Considerations

- **API Upgrades**: Consider paid plans for higher limits
- **Database Sharding**: For very large article volumes
- **CDN Integration**: For article images and assets
- **Search Optimization**: Elasticsearch for advanced search features

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

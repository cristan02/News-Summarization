# 📰 News Hub - Personalized News Summarization Platform

A modern, full-stack news aggregation and summarization platform built with Next.js 15, featuring personalized feeds, AI-powered chat, automated content management, and a sleek user interface.

![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC)
![Prisma](https://img.shields.io/badge/Prisma-6.15.0-2D3748)
![Hugging Face](https://img.shields.io/badge/Hugging_Face-AI_Powered-yellow)

## ✨ Features

### 🔐 Authentication & User Management

- **Google OAuth Integration** - Secure authentication with NextAuth.js
- **User Profiles** - Personalized user accounts with profile images
- **Session Management** - Persistent login sessions

### 📱 Smart Navigation

- **Active Page Indicators** - Visual feedback for current page
- **Responsive Design** - Mobile-friendly navigation with dropdown menu
- **Theme Toggle** - Instant light/dark mode switching

### 🎯 Personalized Content

- **Tag-Based Preferences** - Users can select preferred news categories
- **Smart Feed Filtering** - Articles filtered by user's selected tags
- **Single-Tag Architecture** - Precise content categorization for better performance
- **Dynamic Content Updates** - Fresh articles fetched automatically via cron jobs

### 📊 News Management & Automation

- **Article Aggregation** - Centralized news content from multiple sources
- **External API Integration** - GNews API and NewsAPI integration with automatic fallback
- **AI-Powered Summarization** - Hugging Face BART model for content summarization
- **Automated Content Management** - Daily cron jobs for fetching and cleanup
- **Content Chunking & Embeddings** - Vector embeddings for enhanced search and RAG
- **Rich Metadata** - Author, source, publication date, and images

### 💬 AI-Powered Features

- **Article Chat** - Interactive AI chat about specific articles using RAG
- **Content Analysis** - Discuss article content with AI assistant (Llama 3.1)
- **Smart Responses** - Context-aware AI interactions with semantic search
- **Vector Embeddings** - Sentence transformers for intelligent content matching

### 🔄 Automated Operations

- **Daily Article Fetching** - Automated news collection from all available tags
- **Content Cleanup** - Automatic removal of articles older than 7 days
- **Database Maintenance** - Tag usage tracking and optimization
- **Rate Limit Management** - Intelligent API usage with fallback strategies

### 🎨 Modern UI/UX

- **shadcn/ui Components** - Beautiful, accessible component library
- **Clean Design** - Minimalist interface focused on content
- **Smooth Interactions** - Polished user experience
- **Toast Notifications** - User feedback with Sonner

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.0
- **Components**: shadcn/ui + Radix UI
- **Icons**: Lucide React
- **Themes**: next-themes with system preference support

### Backend

- **API Routes**: Next.js API routes with TypeScript
- **Database**: MongoDB with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth
- **Session Management**: JWT tokens
- **AI Services**:
  - Hugging Face API for summarization and embeddings
  - BART model for content summarization
  - Sentence transformers for vector embeddings
  - Llama 3.1 for chat interactions
- **External APIs**:
  - GNews API (primary news source)
  - NewsAPI (fallback news source)
- **Automation**: Vercel cron jobs for content management
- **Content Processing**: JSDOM and html-to-text for web scraping

### Development Tools

- **Package Manager**: npm
- **Linting**: ESLint 9
- **Type Checking**: TypeScript 5
- **Database Management**: Prisma Studio

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB database
- Google OAuth credentials

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/cristan02/News-Summarization.git
   cd News-Summarization
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env.local` file:

   ```env
   # Database
   DATABASE_URL="your-mongodb-connection-string"

   # NextAuth.js
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-nextauth-secret"

   # Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"

   # News APIs
   GNEWS_API_KEY="your-gnews-api-key"
   NEWS_API_KEY="your-newsapi-key"

   # AI Services
   HUGGINGFACE_API_KEY="your-huggingface-token"

   # Cron Jobs (for production)
   CRON_SECRET="your-secure-random-string"
   ```

4. **Database Setup**

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma db push

   # Seed the database with initial tags
   npx tsx prisma/seed.ts
   ```

5. **Start Development Server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🔗 API Endpoints

### Public Endpoints

- `GET /api/articles` - Fetch articles with pagination and filtering
- `GET /api/articles/[id]` - Get specific article details
- `GET /api/tags` - Retrieve all available tags

### Protected Endpoints (Require Authentication)

- `POST /api/user-preferences` - Save user's preferred tags
- `GET /api/user-preferences` - Retrieve user preferences
- `POST /api/tags` - Create new custom tags
- `POST /api/chat` - AI chat about specific articles
- `DELETE /api/articles` - Admin: Delete all articles

### Cron Job Endpoints (Protected by CRON_SECRET)

- `GET /api/cron/daily-operations` - Automated daily news fetch and cleanup
- `POST /api/cron/daily-operations` - Manual trigger (requires user auth)

### Manual Testing

- Visit `/cron-test` to manually trigger cron jobs for testing
- Real-time monitoring of job execution and results

## 📁 Project Structure

```
news-summarization/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── articles/      # Article management
│   │   │   ├── auth/          # Authentication
│   │   │   ├── chat/          # AI chat with RAG functionality
│   │   │   ├── cron/          # Automated cron jobs
│   │   │   │   └── daily-operations/ # Combined news fetch & cleanup
│   │   │   ├── tags/          # Tag management
│   │   │   └── user-preferences/ # User settings
│   │   ├── article/[id]/      # Article detail pages
│   │   ├── feed/              # Personalized feed
│   │   ├── all-feed/          # All articles feed
│   │   ├── user-preferences/  # Settings page
│   │   └── cron-test/         # Manual cron job testing
│   ├── components/            # Reusable components
│   │   ├── ui/                # shadcn/ui components
│   │   └── providers/         # Context providers
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility functions
│   │   ├── auth.ts            # Authentication configuration
│   │   ├── chunk-embed.ts     # Content chunking & embeddings
│   │   ├── constants.ts       # Application constants
│   │   ├── news-fetcher.ts    # External news API integration
│   │   └── prisma.ts          # Database client
│   └── types/                 # TypeScript definitions
├── prisma/                    # Database schema & seeds
├── documents/                 # Project documentation
├── public/                    # Static assets
├── vercel.json                # Vercel deployment config (includes cron jobs)
└── README.md
```

## 🔧 Configuration

### Database Schema

The application uses a single-tag architecture for optimal performance:

```prisma
model Article {
   id           String   @id @default(auto()) @map("_id") @db.ObjectId
   title        String
   link         String   @unique
   content      String
   summary      String   // renamed from shortSummary
   tag          String   // Single tag instead of array
   source       String?
   author       String?
   publishedAt  DateTime?
   imageUrl     String?
   createdAt    DateTime @default(now())
   updatedAt    DateTime @updatedAt
      chunks       ArticleChunk[]  // related chunks with per-chunk embeddings
}

model ArticleChunk {
   id              String   @id @default(auto()) @map("_id") @db.ObjectId
   articleId       String   @db.ObjectId
   chunkText       String
   vectorEmbedding Float[]  @default([])
   chunkIndex      Int
   createdAt       DateTime @default(now())
   updatedAt       DateTime @updatedAt
      article         Article  @relation(fields: [articleId], references: [id])
}

model Tag {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  name       String   @unique
  usageCount Int      @default(0)
  createdBy  String?  @db.ObjectId
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model User {
  id            String    @id @default(auto()) @map("_id") @db.ObjectId
  email         String    @unique
  name          String?
  image         String?
  selectedTags  String[]  // User's preferred tags
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### Available News Categories

- Technology & AI
- Business & Finance
- Sports & Recreation
- Health & Medicine
- Science & Research
- Politics & Government
- Entertainment & Culture
- And 50+ more categories

## 🤖 AI & Automation Features

### Automated Content Management

- **Daily Operations Cron Job**: Runs at 2:00 AM UTC daily
  - Fetches articles from ALL available tags (no limit)
  - Processes ~10 articles per tag
  - Automatic cleanup of articles older than 7 days
  - Vector embeddings generation for enhanced search

### AI-Powered Content Processing

- **Summarization**: BART model (`facebook/bart-large-cnn`) for article summaries
- **Embeddings**: Sentence transformers (`all-MiniLM-L6-v2`) for semantic search
- **Chat Integration**: Llama 3.1 model for intelligent article discussions
- **RAG System**: Retrieval-Augmented Generation for contextual chat responses

### External API Integration

- **Primary Source**: GNews API (100 requests/day)
- **Fallback Source**: NewsAPI (1000 requests/day)
- **Intelligent Switching**: Automatic API fallback on rate limits
- **Content Scraping**: JSDOM-based web scraping for full article content

### Content Processing Pipeline

1. **Article Fetching**: External APIs retrieve latest news
2. **Content Extraction**: Web scraping for full article text
3. **AI Summarization**: Generate concise summaries
4. **Content Chunking**: Split articles into searchable chunks
5. **Vector Embeddings**: Generate embeddings for semantic search
6. **Database Storage**: Store processed content with metadata

## 🚢 Deployment

### Vercel (Recommended)

1. **Push your code to GitHub**
2. **Connect your repository to Vercel**
3. **Add environment variables in Vercel dashboard**:
   ```env
   DATABASE_URL="your-mongodb-connection-string"
   NEXTAUTH_URL="https://your-domain.vercel.app"
   NEXTAUTH_SECRET="your-nextauth-secret"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   GNEWS_API_KEY="your-gnews-api-key"
   NEWS_API_KEY="your-newsapi-key"
   HUGGINGFACE_API_KEY="your-huggingface-token"
   CRON_SECRET="your-secure-random-string"
   ```
4. **Deploy automatically** - Vercel will handle the build and deployment
5. **Cron jobs will run automatically** once deployed (configured in `vercel.json`)

### Manual Deployment Steps

```bash
# Build the application
npm run build

# Start production server (for self-hosting)
npm run start
```

### Other Platforms

The app can be deployed on any platform supporting Next.js:

- **Railway** - Full-stack deployment with database
- **DigitalOcean App Platform** - Container-based deployment
- **AWS Amplify** - Serverless deployment
- **Netlify** - Static site generation (with API routes)

⚠️ **Note**: Cron jobs require platform-specific configuration outside of Vercel.

## 🔧 Configuration Guide

### API Keys Setup

#### 1. GNews API (Primary News Source)

```bash
# Visit: https://gnews.io/
# Free tier: 100 requests/day
# Add to environment: GNEWS_API_KEY="your_api_key"
```

#### 2. NewsAPI (Fallback News Source)

```bash
# Visit: https://newsapi.org/
# Free tier: 1000 requests/day
# Add to environment: NEWS_API_KEY="your_api_key"
```

#### 3. Hugging Face (AI Services)

```bash
# Visit: https://huggingface.co/
# Create access token with read permissions
# Add to environment: HUGGINGFACE_API_KEY="your_token"
```

#### 4. Google OAuth (Authentication)

```bash
# Visit: https://console.developers.google.com/
# Create OAuth 2.0 credentials
# Add authorized redirect: https://your-domain.com/api/auth/callback/google
# Add to environment:
# GOOGLE_CLIENT_ID="your_client_id"
# GOOGLE_CLIENT_SECRET="your_client_secret"
```

### Database Configuration

- **MongoDB Atlas** (recommended): Free tier available
- **Local MongoDB**: For development only
- **Connection String**: Standard MongoDB format with credentials

### Environment Variables Reference

| Variable               | Purpose             | Required   | Default                 |
| ---------------------- | ------------------- | ---------- | ----------------------- |
| `DATABASE_URL`         | MongoDB connection  | Yes        | -                       |
| `NEXTAUTH_URL`         | App URL for auth    | Yes        | `http://localhost:3000` |
| `NEXTAUTH_SECRET`      | JWT secret          | Yes        | -                       |
| `GOOGLE_CLIENT_ID`     | OAuth client ID     | Yes        | -                       |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret | Yes        | -                       |
| `GNEWS_API_KEY`        | News API key        | Optional   | -                       |
| `NEWS_API_KEY`         | Fallback news API   | Optional   | -                       |
| `HUGGINGFACE_API_KEY`  | AI services         | Optional   | -                       |
| `CRON_SECRET`          | Cron job security   | Production | -                       |

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes** and ensure they follow the project style
4. **Test your changes**:
   ```bash
   npm run lint
   npm run build
   ```
5. **Commit your changes**:
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to the branch**:
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Development Guidelines

- **Code Style**: Follow ESLint configuration
- **TypeScript**: Maintain type safety
- **Components**: Use shadcn/ui patterns
- **Documentation**: Update README for new features
- **Testing**: Test cron jobs manually via `/cron-test`

## 🐛 Troubleshooting

### Common Issues

#### Development Setup

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma client
npx prisma generate
```

#### Database Connection

- Ensure MongoDB is running and accessible
- Check DATABASE_URL format: `mongodb://username:password@host:port/database`
- Verify IP whitelist in MongoDB Atlas

#### Authentication Issues

- Verify Google OAuth credentials and redirect URLs
- Check NEXTAUTH_URL matches your domain
- Ensure NEXTAUTH_SECRET is set and secure

#### API Rate Limits

- Monitor API usage in provider dashboards
- System automatically falls back to NewsAPI when GNews is exhausted
- Consider upgrading API plans for production use

#### Cron Job Issues

- Test manually via `/cron-test` page
- Check Vercel function logs for errors
- Verify CRON_SECRET is properly configured
- Ensure all environment variables are set in production

### Getting Help

- **Issues**: Open a GitHub issue with detailed description
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check the `/documents` folder for detailed guides

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework for production
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful component library
- [Prisma](https://prisma.io/) - Next-generation ORM
- [NextAuth.js](https://next-auth.js.org/) - Authentication for Next.js

## 📞 Support

If you have any questions or need help, please:

- Open an issue on GitHub
- Check the [documentation](docs/)
- Contact the maintainer

---

⭐ **Star this repository if you found it helpful!**

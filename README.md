# 📰 News Hub - Personalized News Summarization Platform

A modern, full-stack news aggregation and summarization platform built with Next.js 15, featuring personalized feeds, AI-powered chat, and a sleek user interface.

![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC)
![Prisma](https://img.shields.io/badge/Prisma-6.15.0-2D3748)

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

### 📊 News Management
- **Article Aggregation** - Centralized news content from multiple sources
- **External API Integration** - Ready for NewsAPI, Guardian API, and other sources
- **Content Summarization** - Short summaries for quick reading
- **Rich Metadata** - Author, source, publication date, and images

### 💬 AI-Powered Features
- **Article Chat** - Interactive AI chat about specific articles
- **Content Analysis** - Discuss article content with AI assistant
- **Smart Responses** - Context-aware AI interactions

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
- **API Routes**: Next.js API routes
- **Database**: MongoDB with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth
- **Session Management**: JWT tokens

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
   
   # News API (optional)
   NEWS_API_KEY="your-news-api-key"
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma db push
   
   # Seed the database with sample data
   npx prisma db seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
news-summarization/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── articles/      # Article management
│   │   │   ├── auth/          # Authentication
│   │   │   ├── chat/          # AI chat functionality
│   │   │   └── user-preferences/ # User settings
│   │   ├── article/[id]/      # Article detail pages
│   │   ├── auth/              # Auth pages
│   │   ├── feed/              # Personalized feed
│   │   ├── all-feed/          # All articles feed
│   │   └── user-preferences/  # Settings page
│   ├── components/            # Reusable components
│   │   ├── ui/                # shadcn/ui components
│   │   └── providers/         # Context providers
│   ├── lib/                   # Utility functions
│   └── types/                 # TypeScript definitions
├── prisma/                    # Database schema & seeds
├── public/                    # Static assets
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

## 🚢 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
The app can be deployed on any platform supporting Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

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

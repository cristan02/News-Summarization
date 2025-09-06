// Central type definitions for the application
import type { Article, ArticleChunk, Tag, User, Prisma } from '@prisma/client'
export * from './prisma'
export type { Article, ArticleChunk, Tag, User, Prisma }

// ==================== EXTERNAL API TYPES ====================

// Raw news article from external APIs (GNews/NewsAPI)
export interface ExternalNewsArticle {
  title: string
  link: string
  content: string
  summary: string // Required - articles without summaries are not saved
  tag: string
  source: 'GNews' | 'NewsAPI'
  author?: string
  publishedAt: Date
  imageUrl?: string
}

// ==================== REQUEST/RESPONSE TYPES ====================

// Standard API response wrapper
export type ApiResponse<T> = {
  success: true
  data: T
} | {
  success: false
  error: string
}

// Chat API
export interface ChatRequest {
  message: string
  context?: string[]
}

export interface ChatResponse {
  reply: string
  sources: Array<{
    title: string
    url: string
    similarity: number
  }>
}

// Chat message for UI (with id and string timestamp)
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

// User preferences for feed customization
export interface UserPreferences {
  hasPreferences: boolean
  preferredTags: string[]
  userId: string
}

// Text chunking configuration
export interface ChunkingOptions {
  chunkSize?: number
  overlap?: number
  force?: boolean
}

// ==================== TYPE GUARDS ====================

export function isValidExternalNewsArticle(article: any): article is ExternalNewsArticle {
  return article && 
    typeof article.title === 'string' &&
    typeof article.link === 'string' &&
    typeof article.content === 'string'
}

// Validate complete article data
export function isCompleteArticle(article: any): article is Article {
  return article &&
    typeof article.id === 'string' &&
    typeof article.title === 'string' &&
    typeof article.content === 'string' &&
    typeof article.summary === 'string' &&
    typeof article.tag === 'string'
}

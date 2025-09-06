// Prisma type helpers and query builders
// 
// USAGE GUIDE:
// - Use Prisma's `Article` / `ArticleChunk` directly when you need all fields
// - Use `articleListSelect` / `articleDetailSelect` for optimized selects when fetching from DB
// - Use `ArticleWithChunks` when you need the article + its chunks
// - Use `SearchableChunk` for RAG/semantic search operations
// - Use `ArticleFormInput` for creation forms and `ArticleUpdateInput` for edit forms
//
import { Prisma, Article, ArticleChunk } from '@prisma/client'

// Re-export Prisma's built-in creation types for database operations
export type { Prisma } from '@prisma/client'

// ==================== OPTIMIZED SELECTS ====================

// Minimal article for lists (only essential fields)
export const articleListSelect = Prisma.validator<Prisma.ArticleSelect>()({
  id: true,
  title: true,
  summary: true,
  tag: true,
  source: true,
  publishedAt: true,
  link: true,
  chunkCount: true
})

// Article with metadata (for single article views)
export const articleDetailSelect = Prisma.validator<Prisma.ArticleSelect>()({
  id: true,
  title: true,
  content: true,
  summary: true,
  tag: true,
  source: true,
  author: true,
  publishedAt: true,
  imageUrl: true,
  link: true,
  chunkCount: true,
  createdAt: true,
  updatedAt: true
})

// Chunk for RAG/search with minimal article info
export const chunkForSearchSelect = Prisma.validator<Prisma.ArticleChunkSelect>()({
  id: true,
  chunkText: true,
  vectorEmbedding: true,
  chunkIndex: true,
  article: {
    select: { id: true, title: true, source: true, link: true }
  }
})

// ==================== COMMON INCLUDES ====================

// Article with all chunks (for processing/analysis)
export const articleWithChunks = Prisma.validator<Prisma.ArticleDefaultArgs>()({
  include: { chunks: true }
})

// ==================== COMMON WHERE CLAUSES ====================

export const recentArticlesWhere = (days: number = 7) => 
  Prisma.validator<Prisma.ArticleWhereInput>()({
    publishedAt: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
  })

export const articlesByTagWhere = (tagNames: string[]) =>
  Prisma.validator<Prisma.ArticleWhereInput>()({
    tag: { in: tagNames }
  })

export const articlesWithChunksWhere = Prisma.validator<Prisma.ArticleWhereInput>()({
  chunkCount: { gt: 0 }
})

// ==================== COMMON ORDER BY ====================

export const articlesByDate = Prisma.validator<Prisma.ArticleOrderByWithRelationInput>()({
  publishedAt: 'desc'
})

export const articlesByRelevance = Prisma.validator<Prisma.ArticleOrderByWithRelationInput>()({
  chunkCount: 'desc'
})

// ==================== COMMON QUERY PATTERNS ====================

// Get articles with pagination
export const getArticlesWithPagination = (take = 10, skip = 0, tagNames?: string[]) => ({
  where: tagNames?.length ? articlesByTagWhere(tagNames) : {},
  orderBy: articlesByDate,
  select: articleListSelect,
  take,
  skip
})

// Get article by ID with details
export const getArticleById = (id: string) => ({
  where: { id },
  select: articleDetailSelect
})

// Get article with chunks for processing
export const getArticleWithChunks = (id: string) => ({
  where: { id },
  include: { chunks: { orderBy: { chunkIndex: 'asc' } } }
})

// Search chunks with similarity
export const searchChunks = (articleIds?: string[]) => ({
  where: articleIds?.length ? { articleId: { in: articleIds } } : {},
  select: chunkForSearchSelect,
  orderBy: { chunkIndex: 'asc' } as const
})

// ==================== EXTRACTED TYPES ====================

// Note: prefer using Prisma's `Article` type directly for most usages.

// Full article with all related chunks
export type ArticleWithChunks = Prisma.ArticleGetPayload<typeof articleWithChunks>

// Chunk optimized for search operations
export type SearchableChunk = Prisma.ArticleChunkGetPayload<{ select: typeof chunkForSearchSelect }>

// ==================== UI-FOCUSED INPUT TYPES ====================

// Article creation form data (what users actually input)
export type ArticleFormInput = {
  title: string
  content: string
  summary: string
  tag: string
  link: string
  source?: string
  author?: string
  publishedAt?: Date
  imageUrl?: string
}

// Article update form data (partial fields that can be edited)
export type ArticleUpdateInput = {
  title?: string
  content?: string
  summary?: string
  tag?: string
  author?: string
  imageUrl?: string
}

// Chunk creation data (for manual chunk creation if needed)
export type ChunkFormInput = {
  articleId: string
  chunkText: string
  chunkIndex: number
  vectorEmbedding?: number[]
}

// Search/filter inputs for UI
export type ArticleSearchParams = {
  tags?: string[]
  query?: string
  dateFrom?: Date
  dateTo?: Date
  source?: string
  limit?: number
  offset?: number
}

// ==================== UI STATE TYPES ====================

// Loading states for different operations
export type ArticleLoadingState = {
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  error?: string
}

// Pagination state
export type PaginationState = {
  page: number
  limit: number
  total: number
  hasMore: boolean
}

// Filter state for article lists
export type ArticleFilterState = {
  selectedTags: string[]
  searchQuery: string
  dateRange?: {
    from: Date
    to: Date
  }
  sortBy: 'date' | 'relevance' | 'title'
  sortOrder: 'asc' | 'desc'
}

// ==================== TYPE PREDICATES ====================

// Check if article has chunks
export function hasChunks(article: Article): boolean {
  return article.chunkCount > 0
}

// Check if article is recent (published within days)
export function isRecentArticle(article: Article, days = 7): boolean {
  if (!article.publishedAt) return false
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return new Date(article.publishedAt) >= cutoff
}

// Check if chunk has embeddings
export function hasEmbeddings(chunk: ArticleChunk): boolean {
  return chunk.vectorEmbedding.length > 0
}

// ==================== VALIDATION HELPERS ====================

// Validate article form input
export function isValidArticleForm(input: ArticleFormInput): boolean {
  return !!(
    input.title?.trim() &&
    input.content?.trim() &&
    input.summary?.trim() &&
    input.tag?.trim() &&
    input.link?.trim()
  )
}

// Validate required fields for article creation
export function validateArticleInput(input: ArticleFormInput): string[] {
  const errors: string[] = []
  
  if (!input.title?.trim()) errors.push('Title is required')
  if (!input.content?.trim()) errors.push('Content is required')
  if (!input.summary?.trim()) errors.push('Summary is required')
  if (!input.tag?.trim()) errors.push('Tag is required')
  if (!input.link?.trim()) errors.push('Link is required')
  
  if (input.link && !isValidUrl(input.link)) {
    errors.push('Link must be a valid URL')
  }
  
  return errors
}

// Simple URL validation
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

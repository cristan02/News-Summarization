// Central type definitions for the application
import type { Article, ArticleChunk, Tag, User, Prisma } from "@prisma/client";
export * from "./prisma";
export type { Article, ArticleChunk, Tag, User, Prisma };

// ==================== EXTERNAL API TYPES ====================

// Raw news article from external APIs (GNews/NewsAPI)
export interface ExternalNewsArticle {
  title: string;
  link: string;
  content: string;
  summary: string; // Required - articles without summaries are not saved
  tag: string;
  source: "GNews" | "NewsAPI";
  author?: string;
  publishedAt: Date;
  imageUrl?: string;
}

// ==================== REQUEST/RESPONSE TYPES ====================

// Standard API response wrapper
export type ApiResponse<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
    };

// Chat API
export interface ChatRequest {
  message: string;
  context?: string[];
}

export interface ChatResponse {
  reply: string;
  sources: Array<{
    title: string;
    url: string;
    similarity: number;
  }>;
}

// Chat message for UI (with id and string timestamp)
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// User preferences for feed customization
export interface UserPreferences {
  hasPreferences: boolean;
  preferredTags: string[];
  userId: string;
}

// Text chunking configuration
export interface ChunkingOptions {
  chunkSize?: number;
  overlap?: number;
  force?: boolean;
}

// Error handling types
export interface AppError extends Error {
  message: string;
  name: string;
  code?: string;
  status?: number;
}

export interface APIError extends AppError {
  response?: {
    status: number;
    statusText: string;
    data?: unknown;
  };
}

export interface EmbeddingResult {
  embedding?: number[];
  error?: string;
}

export interface HuggingFaceResponse {
  [key: number]: number[];
  length?: number;
}

// ==================== TYPE GUARDS ====================

export function isValidExternalNewsArticle(
  article: ExternalNewsArticle | unknown
): article is ExternalNewsArticle {
  return (
    typeof article === "object" &&
    article !== null &&
    typeof (article as ExternalNewsArticle).title === "string" &&
    typeof (article as ExternalNewsArticle).link === "string" &&
    typeof (article as ExternalNewsArticle).content === "string"
  );
}

export function isCompleteArticle(
  article: Article | unknown
): article is Article {
  return (
    typeof article === "object" &&
    article !== null &&
    typeof (article as Article).id === "string" &&
    typeof (article as Article).title === "string" &&
    typeof (article as Article).content === "string" &&
    typeof (article as Article).summary === "string" &&
    typeof (article as Article).tag === "string"
  );
}

export function isValidUserPreferences(
  preferences: unknown
): preferences is UserPreferences {
  return (
    typeof preferences === "object" &&
    preferences !== null &&
    typeof (preferences as UserPreferences).hasPreferences === "boolean" &&
    Array.isArray((preferences as UserPreferences).preferredTags) &&
    typeof (preferences as UserPreferences).userId === "string"
  );
}

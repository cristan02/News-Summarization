// Centralized constants for hardcoded values
// Update this file to change API keys, model names, limits, etc.

export const GNEWS_API_URL = "https://gnews.io/api/v4/search";
export const NEWSAPI_URL = "https://newsapi.org/v2/everything";
export const DEFAULT_GNEWS_RATE_LIMIT = 100; // requests/day
export const DEFAULT_NEWSAPI_RATE_LIMIT = 100; // requests/day

export const HUGGINGFACE_SUMMARY_MODEL = "facebook/bart-large-cnn";
export const DEFAULT_SUMMARY_MAX_LENGTH = 150;
export const DEFAULT_SUMMARY_MIN_LENGTH = 50;
export const DEFAULT_ARTICLES_PER_TAG = 5;
export const DEFAULT_ARTICLE_RETENTION_DAYS = 7; // Days after which articles are deleted in cron jobs

export const HUGGINGFACE_EMBEDDING_MODEL =
  "sentence-transformers/all-MiniLM-L6-v2";

export const DEFAULT_RAG_CHAT_MODEL = "meta-llama/Llama-3.1-8B-Instruct";
export const DEFAULT_RAG_EMBEDDING_CHUNKS_LIMIT = 5; // Number of chunks to retrieve for RAG context

// Centralized constants for hardcoded values
// Update this file to change API keys, model names, limits, etc.

export const GNEWS_API_URL = "https://gnews.io/api/v4/search";
export const NEWSAPI_URL = "https://newsapi.org/v2/everything";
export const DEFAULT_GNEWS_RATE_LIMIT = 100; // requests/day
export const DEFAULT_NEWSAPI_RATE_LIMIT = 1000; // requests/day

export const HUGGINGFACE_SUMMARY_MODEL = "facebook/bart-large-cnn";
export const DEFAULT_SUMMARY_MAX_LENGTH = 150;
export const DEFAULT_SUMMARY_MIN_LENGTH = 50;
export const DEFAULT_ARTICLES_PER_TAG = 10;
export const DEFAULT_MAX_TAGS = 10;

export const HUGGINGFACE_EMBEDDING_MODEL =
  "sentence-transformers/all-MiniLM-L6-v2";

export const DEFAULT_RAG_CHAT_MODEL = "meta-llama/Llama-3.1-8B-Instruct";
export const DEFAULT_RAG_CHAT_MAX_TOKENS = 800;
export const DEFAULT_RAG_CHAT_TEMPERATURE = 0.7;
export const DEFAULT_RAG_CHAT_PROVIDER = "cerebras";
export const DEFAULT_CHUNK_EMBEDDING_SIZE = 1200;
export const DEFAULT_CHUNK_EMBEDDING_OVERLAP = 150; // Overlap between adjacent chunks
export const DEFAULT_RAG_CHUNK_EMBEDDINGS_LIMIT = 5; // Number of chunks to use for RAG

export const DEFAULT_API_TIMEOUT = 10000; // ms

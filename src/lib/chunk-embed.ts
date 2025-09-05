import { PrismaClient, Article } from '@prisma/client'
import { InferenceClient } from '@huggingface/inference'

// Initialize Hugging Face client for embeddings
const hf = new InferenceClient(process.env.HUGGINGFACE_API_KEY)

// Best embedding model for RAG performance
const EMBEDDING_MODEL = 'sentence-transformers/all-MiniLM-L6-v2'

/**
 * Splits article content into chunks for RAG.
 */
export function chunkText(
  content: string,
  options: { chunkSize?: number; overlap?: number; minChunkSize?: number } = {}
): string[] {
  const chunkSize = options.chunkSize ?? 1200; // target max chars
  const overlap = options.overlap ?? 150;       // trailing chars of previous chunk to prepend for context
  const minChunkSize = options.minChunkSize ?? Math.floor(chunkSize * 0.5); // allow slight growth to avoid word breaks

  if (!content) return [];

  // Normalize whitespace
  const cleaned = content.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= chunkSize) return [cleaned];

  // Sentence-based splitting first
  const sentences = cleaned.match(/[^.!?]+[.!?]?/g) || [cleaned];

  const rawChunks: string[] = [];
  let buffer = '';

  const pushBuffer = () => {
    const trimmed = buffer.trim();
    if (trimmed) rawChunks.push(trimmed);
    buffer = '';
  };

  for (const sentence of sentences) {
    // If adding the sentence would exceed chunkSize and buffer is already reasonably sized, flush
    if (buffer.length > 0 && (buffer + sentence).length > chunkSize && buffer.length >= minChunkSize) {
      pushBuffer();
    }
    buffer += sentence;
  }
  pushBuffer();

  // Now refine each raw chunk to ensure we don't cut mid-word when applying overlap logic.
  // If any chunk exceeds chunkSize significantly (because a single sentence was huge), we hard-wrap by whitespace.
  const finalChunks: string[] = [];
  for (const chunk of rawChunks) {
    if (chunk.length <= chunkSize + 100) { // allow slight overflow to preserve words
      finalChunks.push(chunk);
      continue;
    }
    // Break long chunk by whitespace without breaking words
    let start = 0;
    while (start < chunk.length) {
      let end = Math.min(start + chunkSize, chunk.length);
      if (end < chunk.length) {
        // Move end backward to the last space to avoid cutting word
        const spaceIdx = chunk.lastIndexOf(' ', end - 1);
        if (spaceIdx > start + 50) { // ensure we still make progress
          end = spaceIdx;
        }
      }
      finalChunks.push(chunk.slice(start, end).trim());
      start = end;
    }
  }

  // Apply overlap: build overlappedChunks from finalChunks
  if (overlap > 0 && finalChunks.length > 1) {
    const withOverlap: string[] = [];
    for (let i = 0; i < finalChunks.length; i++) {
      if (i === 0) {
        withOverlap.push(finalChunks[i]);
      } else {
        const prev = finalChunks[i - 1];
        const tail = prev.slice(-overlap);
        withOverlap.push((tail + ' ' + finalChunks[i]).trim());
      }
    }
    return withOverlap;
  }

  return finalChunks;
}

/**
 * Generate semantic embeddings using Hugging Face.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!process.env.HUGGINGFACE_API_KEY) {
    console.warn('No Hugging Face API key found, using fallback embedding');
    return fallbackDeterministicEmbedding(text);
  }

  // Clean and truncate text for embedding
  const cleanText = text.trim().slice(0, 512); // Model has 512 token limit
  if (!cleanText) {
    return new Array(384).fill(0); // MiniLM embedding dimension
  }

  try {
    const result = await hf.featureExtraction({
      model: EMBEDDING_MODEL,
      inputs: cleanText,
      // Specify provider to ensure embedding model compatibility
      provider: 'hf-inference'
    });
    
    // Handle different response formats
    let embedding: number[];
    if (Array.isArray(result) && Array.isArray(result[0])) {
      embedding = result[0] as number[];
    } else if (Array.isArray(result)) {
      embedding = result as number[];
    } else {
      throw new Error('Unexpected embedding format');
    }
    
    // Normalize the embedding
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0)) || 1;
    return embedding.map(val => val / norm);
    
  } catch (error) {
    // For now, log the error but use deterministic embedding as it's more reliable
    console.warn(`HF embedding failed, using deterministic fallback:`, error.message || error);
    return fallbackDeterministicEmbedding(text);
  }
}

/**
 * Fallback deterministic embedding when HF API is unavailable.
 */
function fallbackDeterministicEmbedding(text: string, dim = 384): number[] {
  const vec = new Array(dim).fill(0);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    vec[i % dim] += code / 255;
  }
  // L2 normalize
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => Number((v / norm).toFixed(6)));
}

/**
 * Generate embeddings for article chunks.
 */
export async function embedChunk(text: string): Promise<number[]> {
  return await generateEmbedding(text);
}

export interface ChunkProcessResult {
  created: number;
  skippedExisting: boolean;
}

/**
 * Creates ArticleChunk records with embeddings if they don't exist.
 */
export async function ensureArticleChunks(
  prisma: PrismaClient,
  article: Article,
  options: { force?: boolean; chunkSize?: number; overlap?: number } = {}
): Promise<ChunkProcessResult> {
  const existingCount = await prisma.articleChunk.count({ where: { articleId: article.id } });
  if (existingCount > 0 && !options.force) {
    return { created: 0, skippedExisting: true };
  }

  if (existingCount > 0 && options.force) {
    await prisma.articleChunk.deleteMany({ where: { articleId: article.id } });
  }

  const chunks = chunkText(article.content, { chunkSize: options.chunkSize, overlap: options.overlap });
  if (chunks.length === 0) return { created: 0, skippedExisting: false };

  const now = new Date();
  const data = await Promise.all(
    chunks.map(async (chunkText, idx) => ({
      articleId: article.id,
      chunkText,
      vectorEmbedding: await embedChunk(chunkText),
      chunkIndex: idx,
      createdAt: now,
      updatedAt: now,
    }))
  );

  // createMany limitation: floats supported; if any issue fallback to sequential creates
  try {
    await prisma.articleChunk.createMany({ data });
  } catch (e) {
    // Fallback one-by-one (mongo sometimes with large arrays?)
    for (const row of data) {
      await prisma.articleChunk.create({ data: row });
    }
  }

  // Update article with chunkCount
  await prisma.article.update({ where: { id: article.id }, data: { chunkCount: data.length } });

  return { created: data.length, skippedExisting: false };
}

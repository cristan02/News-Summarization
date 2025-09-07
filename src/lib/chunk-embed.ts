import { PrismaClient, Article } from "@prisma/client";
import { InferenceClient } from "@huggingface/inference";
import { HUGGINGFACE_EMBEDDING_MODEL } from "@/lib/constants";

// Initialize clients
const hf = new InferenceClient(process.env.HUGGINGFACE_API_KEY);
const EMBEDDING_MODEL = HUGGINGFACE_EMBEDDING_MODEL;

export interface ChunkProcessResult {
  created: number;
  skippedExisting: boolean;
  articleId: string;
}

/**
 * Fast, lightweight recursive text splitter (no dependencies)
 */
function recursiveTextSplit(
  text: string,
  chunkSize: number = 1200, // Hardcoded default chunk size
  chunkOverlap: number = 150 // Hardcoded default chunk overlap
): string[] {
  if (!text.trim()) return [];
  if (text.length <= chunkSize) return [text.trim()];

  const separators = ["\n\n", "\n", ". ", "! ", "? ", ", ", " ", ""];
  const chunks: string[] = [];

  function splitBySeparator(text: string, separators: string[]): string[] {
    if (separators.length === 0 || text.length <= chunkSize) {
      return [text];
    }

    const separator = separators[0];
    const parts = text.split(separator);
    const result: string[] = [];
    let currentChunk = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i] + (i < parts.length - 1 ? separator : "");

      if (currentChunk.length + part.length <= chunkSize) {
        currentChunk += part;
      } else {
        if (currentChunk) {
          // Try to split the current chunk further if it's still too big
          if (currentChunk.length > chunkSize) {
            result.push(...splitBySeparator(currentChunk, separators.slice(1)));
          } else {
            result.push(currentChunk.trim());
          }
        }
        currentChunk = part;
      }
    }

    if (currentChunk.trim()) {
      if (currentChunk.length > chunkSize) {
        result.push(...splitBySeparator(currentChunk, separators.slice(1)));
      } else {
        result.push(currentChunk.trim());
      }
    }

    return result;
  }

  const rawChunks = splitBySeparator(text, separators);

  // Apply overlap
  if (chunkOverlap > 0 && rawChunks.length > 1) {
    for (let i = 0; i < rawChunks.length; i++) {
      if (i === 0) {
        chunks.push(rawChunks[i]);
      } else {
        const prevChunk = rawChunks[i - 1];
        const overlap = prevChunk.slice(-chunkOverlap);
        chunks.push((overlap + " " + rawChunks[i]).trim());
      }
    }
  } else {
    chunks.push(...rawChunks);
  }

  return chunks.filter((chunk) => chunk.length > 0);
}

/**
 * Smart text chunking using lightweight recursive splitter
 */
export async function chunkText(
  content: string,
  options: { chunkSize?: number; overlap?: number } = {}
): Promise<string[]> {
  if (!content.trim()) return [];
  const chunkSize = options.chunkSize ?? 1200; // Hardcoded default chunk size
  const overlap = options.overlap ?? 150; // Hardcoded default chunk overlap

  return recursiveTextSplit(content, chunkSize, overlap);
}

/**
 * Generate embeddings with better error handling and batch support
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error("Hugging Face API key not configured");
  }

  const cleanText = text.trim().slice(0, 512);
  if (!cleanText) return new Array(384).fill(0);

  try {
    const result = await hf.featureExtraction({
      model: EMBEDDING_MODEL,
      inputs: cleanText,
      provider: "hf-inference",
    });

    // Simplified response handling with proper typing
    const embedding = Array.isArray(result[0])
      ? (result[0] as number[])
      : (result as number[]);

    // L2 normalize
    const norm =
      Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0)) || 1;
    return embedding.map((val) => val / norm);
  } catch (error) {
    console.error("Embedding failed:", error);
    throw error;
  }
}

/**
 * Batch generate embeddings for better performance
 */
export async function generateEmbeddingsBatch(
  texts: string[]
): Promise<number[][]> {
  if (texts.length === 0) return [];
  if (texts.length === 1) return [await generateEmbedding(texts[0])];

  // Process in smaller batches to avoid API limits
  const batchSize = 5;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((text) => generateEmbedding(text))
    );
    results.push(...batchResults);

    // Small delay between batches
    if (i + batchSize < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Optimized article chunk creation with batch processing
 */
export async function ensureArticleChunks(
  prisma: PrismaClient,
  article: Article,
  options: { force?: boolean; chunkSize?: number; overlap?: number } = {}
): Promise<ChunkProcessResult> {
  // Check existing chunks
  const existingCount = await prisma.articleChunk.count({
    where: { articleId: article.id },
  });

  if (existingCount > 0 && !options.force) {
    return { created: 0, skippedExisting: true, articleId: article.id };
  }

  // Clean up existing chunks if forcing recreation
  if (existingCount > 0) {
    await prisma.articleChunk.deleteMany({
      where: { articleId: article.id },
    });
  }

  // Generate chunks using optimized chunking
  const chunks = await chunkText(article.content, {
    chunkSize: options.chunkSize,
    overlap: options.overlap,
  });

  if (chunks.length === 0) {
    return { created: 0, skippedExisting: false, articleId: article.id };
  }

  // Batch generate embeddings for better performance
  console.log(`Generating embeddings for ${chunks.length} chunks...`);
  const embeddings = await generateEmbeddingsBatch(chunks);

  // Prepare data for batch insert
  const now = new Date();
  const data = chunks.map((chunkText, idx) => ({
    articleId: article.id,
    chunkText,
    vectorEmbedding: embeddings[idx],
    chunkIndex: idx,
    createdAt: now,
    updatedAt: now,
  }));

  // Bulk insert with fallback
  try {
    await prisma.articleChunk.createMany({ data });
  } catch {
    console.warn("Bulk insert failed, falling back to individual inserts");
    for (const row of data) {
      await prisma.articleChunk.create({ data: row });
    }
  }

  // Update article chunk count
  await prisma.article.update({
    where: { id: article.id },
    data: { chunkCount: data.length },
  });

  console.log(`✅ Created ${data.length} chunks for article ${article.id}`);
  return {
    created: data.length,
    skippedExisting: false,
    articleId: article.id,
  };
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

  return dotProduct / (normA * normB) || 0;
}

/**
 * Find most similar chunks to a query embedding
 */
export async function findSimilarChunks(
  prisma: PrismaClient,
  queryEmbedding: number[],
  limit: number = 5,
  minSimilarity: number = 0.1
) {
  const chunks = await prisma.articleChunk.findMany({
    include: { article: { select: { title: true, source: true } } },
  });

  const similarities = chunks
    .map((chunk) => ({
      ...chunk,
      similarity: cosineSimilarity(queryEmbedding, chunk.vectorEmbedding),
    }))
    .filter((chunk) => chunk.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return similarities;
}

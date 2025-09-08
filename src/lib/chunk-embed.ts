import { PrismaClient, Article } from "@prisma/client";
import { InferenceClient } from "@huggingface/inference";
import { HUGGINGFACE_EMBEDDING_MODEL } from "@/lib/constants";
import { AppError } from "../types";
import { prisma } from "@/lib/prisma";

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
 * Generate embeddings with error handling and fallback to zero vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error("Hugging Face API key not configured");
  }

  const cleanText = text.trim().slice(0, 512);
  if (!cleanText) throw new Error("No text provided for embedding");

  // Improved logging for API call
  console.log(
    `\n[HF API] Generating embedding for text (${cleanText.length} chars)`
  );

  try {
    const start = Date.now();
    const result: unknown = await hf.featureExtraction({
      model: EMBEDDING_MODEL,
      inputs: cleanText,
    });
    const duration = Date.now() - start;
    console.log(`[HF API] Embedding API call completed in ${duration}ms`);

    let embedding: number[];
    if (Array.isArray(result)) {
      embedding = result as number[];
    } else if (result && typeof result === "object") {
      const resultObj = result as Record<string, unknown>;
      if (Array.isArray(resultObj[0])) {
        embedding = resultObj[0] as number[];
      } else {
        throw new Error(
          `Unexpected embedding response format: ${typeof result}`
        );
      }
    } else {
      throw new Error(`Unexpected embedding response format: ${typeof result}`);
    }

    // L2 normalize
    const norm =
      Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0)) || 1;
    const finalEmbedding = embedding.map((val) => val / norm);

    console.log(
      `[HF API] ✅ Embedding generated for text: "${cleanText.substring(
        0,
        100
      )}..."`
    );
    return finalEmbedding;
  } catch (error: unknown) {
    const appError = error as AppError;
    console.error(
      `[HF API] ❌ Embedding failed:`,
      appError.message || String(error)
    );
    console.error(`[HF API] Failed text: "${cleanText.substring(0, 150)}..."`);
    throw error;
  }
}

/**
 * Batch generate embeddings with improved error handling and rate limiting
 */
export async function generateEmbeddingsBatch(
  texts: string[]
): Promise<number[][]> {
  if (texts.length === 0) return [];
  if (texts.length === 1) return [await generateEmbedding(texts[0])];

  console.log(
    `\n[HF API] Generating embeddings for ${texts.length} chunks (sequentially with rate limiting)...`
  );

  const results: number[][] = [];
  for (let i = 0; i < texts.length; i++) {
    console.log(`[HF API] Processing embedding ${i + 1}/${texts.length}...`);
    try {
      const embedding = await generateEmbedding(texts[i]);
      results.push(embedding);
    } catch (error) {
      console.error(
        `[HF API] ❌ Failed to generate embedding for chunk ${i + 1}:`,
        error
      );
      throw error;
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

  // Batch generate embeddings with better error handling
  console.log(`[HF API] Generating embeddings for ${chunks.length} chunks...`);
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
    console.log(
      `Successfully created ${chunks.length} chunks for article ${article.id}`
    );
  } catch (insertError) {
    console.warn(
      "Bulk insert failed, falling back to individual inserts:",
      insertError
    );
    let successCount = 0;
    for (const row of data) {
      try {
        await prisma.articleChunk.create({ data: row });
        successCount++;
      } catch (individualError) {
        console.error(
          `Failed to insert chunk ${row.chunkIndex}:`,
          individualError
        );
      }
    }
    console.log(
      `Individual insert completed: ${successCount}/${data.length} chunks created`
    );
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

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Find most relevant chunks using semantic embeddings
 */
export async function findRelevantChunks(
  articleId: string,
  query: string,
  limit: number = 5
): Promise<string[]> {
  const queryEmbedding = await generateEmbedding(query);

  const chunks = await prisma.articleChunk.findMany({
    where: { articleId },
    orderBy: { chunkIndex: "asc" },
  });

  if (chunks.length === 0) return [];

  const chunksWithSimilarity = chunks.map((chunk) => ({
    chunk,
    similarity: cosineSimilarity(queryEmbedding, chunk.vectorEmbedding),
  }));

  chunksWithSimilarity.sort((a, b) => b.similarity - a.similarity);

  return chunksWithSimilarity
    .slice(0, limit)
    .map((item) => item.chunk.chunkText);
}

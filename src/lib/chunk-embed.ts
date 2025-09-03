import { PrismaClient, Article } from '@prisma/client'

/**
 * Splits article content into chunks suitable for RAG.
 * Basic strategy: sentence-based accumulation up to chunkSize characters with optional overlap.
 */
export function chunkText(
  content: string,
  options: { chunkSize?: number; overlap?: number } = {}
): string[] {
  const chunkSize = options.chunkSize ?? 1200; // chars
  const overlap = options.overlap ?? 150; // chars
  if (!content) return [];

  // Normalize whitespace
  const cleaned = content.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= chunkSize) return [cleaned];

  // Split by sentence enders, keep delimiters.
  const sentences = cleaned.match(/[^.!?]+[.!?]?/g) || [cleaned];

  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + sentence).length > chunkSize) {
      if (current) chunks.push(current.trim());
      // Start new chunk with overlap tail from previous
      if (overlap > 0 && chunks.length > 0) {
        const prev = chunks[chunks.length - 1];
        const tail = prev.slice(-overlap);
        current = tail + ' ' + sentence;
      } else {
        current = sentence;
      }
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/**
 * Deterministic lightweight embedding (fallback) so pipeline works without external API.
 * Produces a fixed-length numeric vector based on character codes (NOT semantic!).
 * Replace with real model (OpenAI, HuggingFace, etc.) for production RAG quality.
 */
export function cheapDeterministicEmbedding(text: string, dim = 64): number[] {
  const vec = new Array(dim).fill(0);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    vec[i % dim] += code / 255; // simple accumulation
  }
  // L2 normalize
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => Number((v / norm).toFixed(6)));
}

/**
 * (Optional) Placeholder for real embedding provider.
 * If you later integrate OpenAI or other provider, swap implementation here.
 */
export async function embedChunk(text: string): Promise<number[]> {
  // Future: if (process.env.OPENAI_API_KEY) { call real API }
  return cheapDeterministicEmbedding(text);
}

export interface ChunkProcessResult {
  created: number;
  skippedExisting: boolean;
}

/**
 * Creates ArticleChunk records with embeddings if they do not already exist.
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

  return { created: data.length, skippedExisting: false };
}

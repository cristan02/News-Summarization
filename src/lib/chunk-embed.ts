import { PrismaClient, Article } from '@prisma/client'

/**
 * Splits article content into chunks suitable for RAG.
 * Basic strategy: sentence-based accumulation up to chunkSize characters with optional overlap.
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

  // Update article with chunkCount
  await prisma.article.update({ where: { id: article.id }, data: { chunkCount: data.length } });

  return { created: data.length, skippedExisting: false };
}

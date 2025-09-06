import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateEmbedding } from '@/lib/chunk-embed'
import { InferenceClient } from '@huggingface/inference'

// Hugging Face configuration
const HF_API_TOKEN = process.env.HUGGINGFACE_API_KEY
const hf = new InferenceClient(HF_API_TOKEN)

// Best model for RAG chat responses
const CHAT_MODEL = 'meta-llama/Llama-3.1-8B-Instruct'

// Calculate cosine similarity between two embeddings
function cosineSimilarity(a: number[], b: number[]): number {
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

// Find most relevant chunks using RAG with semantic embeddings
async function findRelevantChunks(articleId: string, query: string, limit: number = 3): Promise<string[]> {
  try {
    // Get query embedding using Hugging Face
    const queryEmbedding = await generateEmbedding(query);
    
    // Get all chunks for the article
    const chunks = await prisma.articleChunk.findMany({
      where: { articleId },
      orderBy: { chunkIndex: 'asc' }
    });
    
    if (chunks.length === 0) return [];
    
    // Calculate similarities and sort by relevance
    const chunksWithSimilarity = chunks.map(chunk => ({
      chunk,
      similarity: cosineSimilarity(queryEmbedding, chunk.vectorEmbedding)
    }));
    
    chunksWithSimilarity.sort((a, b) => b.similarity - a.similarity);
    
    // Return top chunks
    return chunksWithSimilarity
      .slice(0, limit)
      .map(item => item.chunk.chunkText);
  } catch (error) {
    console.error('Error finding relevant chunks:', error);
    return [];
  }
}

// Call Hugging Face using the official library
async function getHuggingFaceResponse(messages: Array<{role: string, content: string}>): Promise<string> {
  if (!HF_API_TOKEN) {
    console.error('Hugging Face API key not found');
    return 'API key configuration error. Please check your environment variables.';
  }

  try {
    // Try chat completion first
    try {
      const response = await hf.chatCompletion({
        model: CHAT_MODEL,
        messages: messages,
        max_tokens: 800,
        temperature: 0.7,
        // Specify provider for better reliability
        provider: 'cerebras'
      });

      if (response.choices && response.choices.length > 0) {
        const content = response.choices[0].message?.content;
        if (content) {
          return content.trim();
        }
      }
    } catch (chatError) {
      // Fallback to text generation
      const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n') + '\nassistant:';
      
      const response = await hf.textGeneration({
        model: CHAT_MODEL,
        inputs: prompt,
        parameters: {
          max_new_tokens: 600,
          temperature: 0.7,
          return_full_text: false,
        },
        // Specify provider for text generation fallback
        provider: 'hf-inference'
      });

      if (response.generated_text) {
        return response.generated_text.trim();
      }
    }
    
  } catch (error) {
    console.error(`Error with model ${CHAT_MODEL}:`, error);
  }
  
  // Fallback to rule-based response
  return generateSmartResponse(messages[messages.length - 1]?.content || '');
}

// Smart rule-based response generator as fallback
function generateSmartResponse(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('what') || lowerPrompt.includes('explain')) {
    return 'Based on the article content, this appears to be about the key points mentioned in the relevant sections.';
  } else if (lowerPrompt.includes('how')) {
    return 'The article describes the process and methodology related to your question.';
  } else if (lowerPrompt.includes('why')) {
    return 'According to the article, this is likely due to the factors and reasons discussed in the content.';
  } else if (lowerPrompt.includes('when') || lowerPrompt.includes('where')) {
    return 'The article provides context about the timing and location of these events.';
  } else {
    return 'Based on the article content, I can provide information related to your question from the relevant sections.';
  }
}// Enhanced AI response generation using RAG + Hugging Face Router
async function generateRAGResponse(
  message: string, 
  articleId: string,
  articleTitle?: string, 
  articleSummary?: string
): Promise<string> {
  try {
    // Get relevant chunks based on the query
    const relevantChunks = await findRelevantChunks(articleId, message, 2);
    
    // Build context from relevant chunks
    const context = relevantChunks.length > 0 
      ? relevantChunks.join('\n\n')
      : '';
    
    // Create messages for chat completions format
    const messages = [];
    
    // System message with context
    if (context) {
      messages.push({
        role: 'system',
        content: `You are a helpful assistant answering questions about an article titled "${articleTitle}". Use the following article content to answer questions accurately and concisely:\n\n${context}`
      });
    } else {
      messages.push({
        role: 'system',
        content: `You are a helpful assistant answering questions about an article titled "${articleTitle}". ${articleSummary ? `Article summary: ${articleSummary}` : ''}`
      });
    }
    
    // User message
    messages.push({
      role: 'user',
      content: message
    });
    
    // Get AI response from Hugging Face Router
    const aiResponse = await getHuggingFaceResponse(messages);
    
    // Clean up response but don't truncate
    let cleanResponse = aiResponse.trim();
    
    // Only truncate if response is extremely long (over 1500 characters)
    if (cleanResponse.length > 1500) {
      // Find the last complete sentence within limit
      const truncated = cleanResponse.substring(0, 1400);
      const lastSentenceEnd = Math.max(
        truncated.lastIndexOf('.'),
        truncated.lastIndexOf('!'),
        truncated.lastIndexOf('?')
      );
      
      if (lastSentenceEnd > 800) {
        cleanResponse = truncated.substring(0, lastSentenceEnd + 1);
      } else {
        cleanResponse = truncated + '...';
      }
    }
    
    return cleanResponse || 'I apologize, but I couldn\'t generate a proper response. Could you try rephrasing your question?';
    
  } catch (error) {
    console.error('Error generating RAG response:', error);
    return 'I encountered an error while processing your question. Please try again.';
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, articleId, articleTitle, articleSummary } = await request.json()

    if (!message || !articleId) {
      return NextResponse.json({ error: 'Message and articleId are required' }, { status: 400 })
    }

    // Generate AI response using RAG + Hugging Face
    const response = await generateRAGResponse(message, articleId, articleTitle, articleSummary)

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Error processing chat message:', error)
    return NextResponse.json(
      { error: 'Failed to process message' }, 
      { status: 500 }
    )
  }
}

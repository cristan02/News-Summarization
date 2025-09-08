import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { findRelevantChunks } from "@/lib/chunk-embed";
import { InferenceClient } from "@huggingface/inference";
import {
  DEFAULT_RAG_CHAT_MODEL,
  DEFAULT_RAG_EMBEDDING_CHUNKS_LIMIT,
} from "@/lib/constants";

const hf = new InferenceClient(process.env.HUGGINGFACE_API_KEY);

// Generate response using Hugging Face
async function getHuggingFaceResponse(
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error("Hugging Face API key not configured");
  }

  const response = await hf.chatCompletion({
    model: DEFAULT_RAG_CHAT_MODEL,
    messages: messages,
    max_tokens: 800,
    temperature: 0.7,
    provider: "cerebras",
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No response generated from AI model");
  }

  return content.trim();
}

// Generate RAG response
async function generateRAGResponse(
  message: string,
  articleId: string,
  articleTitle?: string,
  articleSummary?: string
): Promise<string> {
  // Get relevant chunks
  const relevantChunks = await findRelevantChunks(
    articleId,
    message,
    DEFAULT_RAG_EMBEDDING_CHUNKS_LIMIT
  );
  const context = relevantChunks.length > 0 ? relevantChunks.join("\n\n") : "";

  // Build messages
  const messages = [];

  // System message with context
  if (context) {
    messages.push({
      role: "system",
      content: `You are a helpful assistant answering questions about an article titled "${articleTitle}". Use the following article content to answer questions accurately and concisely:\n\n${context}`,
    });
  } else if (articleSummary) {
    messages.push({
      role: "system",
      content: `You are a helpful assistant answering questions about an article titled "${articleTitle}". Article summary: ${articleSummary}`,
    });
  } else {
    messages.push({
      role: "system",
      content: `You are a helpful assistant answering questions about an article titled "${articleTitle}".`,
    });
  }

  messages.push({
    role: "user",
    content: message,
  });

  const aiResponse = await getHuggingFaceResponse(messages);

  // Only truncate if extremely long
  if (aiResponse.length > 1500) {
    const truncated = aiResponse.substring(0, 1400);
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf("."),
      truncated.lastIndexOf("!"),
      truncated.lastIndexOf("?")
    );

    return lastSentenceEnd > 800
      ? truncated.substring(0, lastSentenceEnd + 1)
      : truncated + "...";
  }

  return aiResponse;
}

export async function POST(request: NextRequest) {
  console.log("🌐 Received chat request");

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, articleId, articleTitle, articleSummary } =
      await request.json();

    if (!message || !articleId) {
      console.log("❌ Missing required fields");
      return NextResponse.json(
        { error: "Message and articleId are required" },
        { status: 400 }
      );
    }

    const response = await generateRAGResponse(
      message,
      articleId,
      articleTitle,
      articleSummary
    );

    return NextResponse.json({ response });
  } catch (error) {
    console.log("🤖 AI model failed to generate response", error);

    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}

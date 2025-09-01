import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Simple AI assistant simulation for chat functionality
// In a real implementation, you would integrate with OpenAI, Anthropic, or other AI providers
function generateAIResponse(message: string, articleContent?: string, articleTitle?: string, articleSummary?: string): string {
  const lowerMessage = message.toLowerCase()
  
  // Simple keyword-based responses
  if (lowerMessage.includes('summary') || lowerMessage.includes('summarize')) {
    return articleSummary 
      ? `Here's the summary of "${articleTitle}": ${articleSummary}`
      : "I don't have a summary available for this article."
  }
  
  if (lowerMessage.includes('key points') || lowerMessage.includes('main points')) {
    if (articleContent) {
      // Simple extraction of first few sentences as key points
      const sentences = articleContent.split('.').slice(0, 3).filter(s => s.trim().length > 20)
      return `Here are the key points from the article:\n\n${sentences.map((s, i) => `${i + 1}. ${s.trim()}.`).join('\n')}`
    }
    return "I don't have enough content to extract key points."
  }
  
  if (lowerMessage.includes('opinion') || lowerMessage.includes('what do you think')) {
    return "As an AI assistant, I provide information rather than personal opinions. I can help you analyze the facts presented in the article, identify different perspectives, or discuss the implications of the reported events."
  }
  
  if (lowerMessage.includes('source') || lowerMessage.includes('reliable')) {
    return "This article comes from your news database. For the most reliable information, I recommend checking the original source link and cross-referencing with other reputable news outlets."
  }
  
  if (lowerMessage.includes('explain') || lowerMessage.includes('what does')) {
    return "I'd be happy to explain any concepts from the article. Could you be more specific about what you'd like me to clarify?"
  }
  
  if (lowerMessage.includes('similar') || lowerMessage.includes('related')) {
    return "While I can't access other articles in real-time, I recommend looking for articles with similar tags or searching for related keywords in your news feed."
  }
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return `Hello! I'm here to help you understand and discuss "${articleTitle}". You can ask me about the summary, key points, or any specific aspects of the article.`
  }
  
  if (lowerMessage.includes('help')) {
    return "I can help you with:\n• Summarizing the article\n• Explaining key points\n• Discussing specific parts of the content\n• Clarifying concepts mentioned in the article\n\nWhat would you like to know?"
  }
  
  // Default response for general questions
  return `I understand you're asking about "${message}". Based on the article "${articleTitle}", I can help you discuss its content. Could you be more specific about what aspect of the article you'd like to explore?`
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, articleContent, articleTitle, articleSummary } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Generate AI response (simulated)
    const response = generateAIResponse(message, articleContent, articleTitle, articleSummary)

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Error processing chat message:', error)
    return NextResponse.json(
      { error: 'Failed to process message' }, 
      { status: 500 }
    )
  }
}

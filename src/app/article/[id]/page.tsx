'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, ArrowLeft, ExternalLink, Send, Clock, User, Bot, Copy, MessageCircle, FileText } from "lucide-react"
import { toast } from "sonner"

interface Article {
  id: string
  title: string
  link: string
  content: string
  summary: string // renamed from shortSummary
  tag: string // Single tag instead of array
  source?: string
  author?: string
  publishedAt?: string
  imageUrl?: string
  createdAt: string
  updatedAt: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export default function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const [articleId, setArticleId] = useState<string>('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setArticleId(resolvedParams.id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
      return
    }
    
      const fetchArticle = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/articles/${articleId}`)
      if (response.ok) {
        const data = await response.json()
        setArticle(data)
        
        // Initialize chat with a welcome message
        setChatMessages([{
          id: '1',
          role: 'assistant',
          content: `Hello! I'm here to help you discuss this article: "${data.title}". Feel free to ask me questions about the content, request summaries, or discuss any aspects of the news story.`,
          timestamp: new Date().toISOString()
        }])
      } else {
        toast.error("Article not found")
        router.push('/all-feed')
      }
    } catch (error) {
      console.error('Error fetching article:', error)
      toast.error("Error fetching article")
      router.push('/all-feed')
    } finally {
      setIsLoading(false)
    }
  }
  
    if (status === 'authenticated' && articleId) {
      fetchArticle()
    }
  }, [status, router, articleId])

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  useEffect(() => {
    // Scroll to bottom when user starts typing
    if (newMessage.length > 0) {
      scrollToBottom()
    }
  }, [newMessage])

  useEffect(() => {
    // Scroll to bottom when chat loading starts
    if (isChatLoading) {
      scrollToBottom()
    }
  }, [isChatLoading])

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || isChatLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: newMessage.trim(),
      timestamp: new Date().toISOString()
    }

    setChatMessages(prev => [...prev, userMessage])
    setNewMessage('')
    setIsChatLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          articleId: article?.id,
          articleTitle: article?.title,
          articleSummary: article?.summary
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString()
        }
        setChatMessages(prev => [...prev, assistantMessage])
      } else {
        toast.error("Failed to get AI response")
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error("Error sending message")
    } finally {
      setIsChatLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="p-8">
          <CardContent className="flex items-center space-x-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-lg">Loading article...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="p-8">
          <CardContent className="text-center">
            <h3 className="text-lg font-semibold mb-2">Article not found</h3>
            <Button onClick={() => router.push('/all-feed')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Feed
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header with Navigation and Actions */}
        <div className="flex items-center justify-between lg:pr-80">
          <Button 
            variant="outline" 
            onClick={() => router.push('/all-feed')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Feed
          </Button>

          <div className="flex items-center gap-2">
            {/* Summary Dialog */}
            <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Summary
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl w-[90vw] max-h-[80vh] backdrop-blur-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center text-xl">
                    <FileText className="w-6 h-6 mr-3" />
                    Article Summary
                  </DialogTitle>
                </DialogHeader>
                <div className="mt-6 overflow-y-auto max-h-[60vh]">
                  <div className="bg-muted/50 rounded-lg p-6">
                    <p className="text-base leading-relaxed whitespace-pre-wrap">
                      {article?.summary}
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Chat Button - Only visible on mobile */}
            <div className="lg:hidden">
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Ask Questions
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-lg flex flex-col">
                  <SheetHeader>
                    <SheetTitle className="flex items-center">
                      <Bot className="w-5 h-5 mr-2" />
                      AI Article Assistant
                    </SheetTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      Ask questions about this article. I'll search through the content to find relevant information and provide detailed answers.
                    </p>
                  </SheetHeader>
                  
                  {/* Mobile Chat Interface */}
                  <div className="flex-1 flex flex-col mt-6 min-h-0">
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                      {chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-lg p-3 ${
                              message.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {message.role === 'user' ? (
                                <User className="w-4 h-4" />
                              ) : (
                                <Bot className="w-4 h-4" />
                              )}
                              <span className="text-xs opacity-70">
                                {formatDate(message.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {message.content}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {isChatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-muted rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <Bot className="w-4 h-4" />
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="text-sm">AI is thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div ref={chatEndRef} />
                    </div>

                    {/* Mobile Chat Input */}
                    <div className="flex gap-2 border-t pt-4 items-center">
                      <Textarea
                        placeholder="Ask about topics, quotes, details..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 min-h-[40px] max-h-[100px] resize-none"
                        rows={1}
                      />
                      <Button 
                        onClick={sendMessage} 
                        disabled={!newMessage.trim() || isChatLoading}
                        className="h-[40px] w-[40px] p-0"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="relative">
          {/* Article Content */}
          <div className="lg:pr-80">
            <div className="space-y-6">
              {/* Title and Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-3xl mb-3">{article.title}</CardTitle>
                      
                      {/* Tag and Source Information */}
                      <div className="flex items-center gap-3 mb-2">
                        {article.tag && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">Topic:</span>
                            <Badge variant="secondary" className="text-sm">
                              {article.tag}
                            </Badge>
                          </div>
                        )}
                        {article.source && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">Source:</span>
                            <Badge variant="outline" className="text-sm">
                              {article.source}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(article.link, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Read Original
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {formatDate(article.createdAt)}
                    </div>
                    {article.author && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>By {article.author}</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
              </Card>

              {/* Full Content */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Article Content</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(article.content)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <div className="mt-2 p-3 bg-muted/50 rounded-lg border-l-4 border-orange-500">
                    <p className="text-xs text-muted-foreground">
                      <strong>Disclaimer:</strong> Article content may not retain the exact formatting, layout, or visual elements of the original publication. This is an extracted text version for reading convenience.
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {article.content}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Fixed Chat Interface - Only visible on large screens */}
          <div className="hidden lg:block fixed top-20 right-6 w-80 h-[calc(100vh-8rem)] z-30">
            <Card className="h-full shadow-lg border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <Bot className="w-4 h-4 mr-2" />
                  AI Assistant
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Ask questions for quick, relevant answers.
                </p>
              </CardHeader>
              
              <CardContent className="flex flex-col h-[calc(100%-4rem)] p-3">
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto space-y-2 mb-3 scrollbar-hide">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg p-2 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          {message.role === 'user' ? (
                            <User className="w-3 h-3" />
                          ) : (
                            <Bot className="w-3 h-3" />
                          )}
                          <span className="text-xs opacity-70">
                            {formatDate(message.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-2">
                        <div className="flex items-center gap-1">
                          <Bot className="w-3 h-3" />
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span className="text-xs">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="flex gap-2 border-t pt-2 items-center">
                  <Textarea
                    placeholder="Ask about topics, quotes, details..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 min-h-[32px] max-h-[64px] resize-none text-xs"
                    rows={1}
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={!newMessage.trim() || isChatLoading}
                    className="h-[32px] w-[32px] p-0"
                    size="sm"
                  >
                    <Send className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

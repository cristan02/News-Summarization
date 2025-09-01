'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Loader2, Search, ExternalLink, Clock, Tag } from "lucide-react"
import { toast } from "sonner"

interface Article {
  id: string
  title: string
  link: string
  content: string
  shortSummary: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export default function AllFeedPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
      return
    }
    
    if (status === 'authenticated') {
      fetchAllArticles()
    }
  }, [status, router])

  useEffect(() => {
    filterArticles()
  }, [articles, searchQuery, selectedTag])

  const fetchAllArticles = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/articles')
      if (response.ok) {
        const data = await response.json()
        setArticles(data)
      } else {
        toast.error("Failed to fetch articles")
      }
    } catch (error) {
      console.error('Error fetching articles:', error)
      toast.error("Error fetching articles")
    } finally {
      setIsLoading(false)
    }
  }

  const filterArticles = () => {
    let filtered = articles

    if (searchQuery) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.shortSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    if (selectedTag) {
      filtered = filtered.filter(article => article.tags.includes(selectedTag))
    }

    setFilteredArticles(filtered)
  }

  const getAllTags = () => {
    const tagSet = new Set<string>()
    articles.forEach(article => {
      article.tags.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
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

  const handleArticleClick = (articleId: string) => {
    router.push(`/article/${articleId}`)
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="p-8">
          <CardContent className="flex items-center space-x-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-lg">Loading articles...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl">All News Articles</CardTitle>
                <p className="text-muted-foreground">
                  Browse all available news articles from our database
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => router.push('/feed')}
                className="hidden sm:flex"
              >
                <Search className="w-4 h-4 mr-2" />
                My Personalized Feed
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Tag Filter */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedTag === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTag(null)}
                >
                  All Tags
                </Button>
                {getAllTags().slice(0, 8).map(tag => (
                  <Button
                    key={tag}
                    variant={selectedTag === tag ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Showing {filteredArticles.length} of {articles.length} articles
          </p>
          <Button variant="outline" onClick={fetchAllArticles}>
            Refresh
          </Button>
        </div>

        {/* Articles Grid */}
        {filteredArticles.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No articles found</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedTag 
                  ? "Try adjusting your search or filter criteria."
                  : "No articles are available at the moment."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <Card 
                key={article.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => handleArticleClick(article.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </CardTitle>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Summary */}
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {article.shortSummary}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {article.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {article.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{article.tags.length - 3} more
                      </Badge>
                    )}
                  </div>

                  {/* Date */}
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDate(article.createdAt)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, Newspaper, RefreshCw, User } from "lucide-react"
import { toast } from "sonner"
import TagFilter from '@/components/tag-filter'
import ArticleGrid from '@/components/article-grid'
import Link from 'next/link'

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

export default function AllFeedPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [selectedFilterTags, setSelectedFilterTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
      return
    }
    
    if (status === 'authenticated') {
      fetchAllArticles()
      fetchAvailableTags()
    }
  }, [status, router])

  useEffect(() => {

     const filterArticles = () => {
    let filtered = articles

    if (searchQuery) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
  article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedFilterTags.length > 0) {
      filtered = filtered.filter(article =>
        selectedFilterTags.some(filterTag =>
          filterTag.toLowerCase() === article.tag.toLowerCase()
        )
      )
    }

    setFilteredArticles(filtered)
  }
  
    filterArticles()
  }, [articles, searchQuery, selectedFilterTags])

  const fetchAvailableTags = async () => {
    try {
      const response = await fetch('/api/tags')
      if (response.ok) {
        const tags = await response.json()
        setAvailableTags(tags.map((tag: any) => tag.name))
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

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


  const handleTagSelect = (tag: string) => {
    if (!selectedFilterTags.includes(tag)) {
      setSelectedFilterTags([...selectedFilterTags, tag])
    }
  }

  const handleTagRemove = (tag: string) => {
    setSelectedFilterTags(selectedFilterTags.filter(t => t !== tag))
  }

  const handleClearAllTags = () => {
    setSelectedFilterTags([])
  }

  const refreshFeed = () => {
    fetchAllArticles()
    fetchAvailableTags()
    toast.success("Articles refreshed")
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
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-primary/80 to-primary/50 rounded-xl flex items-center justify-center">
                  <Newspaper className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">All News Articles</CardTitle>
                  <CardDescription>
                    Browse all available news articles from our database
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={refreshFeed}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button asChild>
                  <Link href="/feed">
                    <User className="w-4 h-4 mr-2" />
                    My Feed
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar with filters */}
          <div className="lg:col-span-1 space-y-4">
            {/* Search */}
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tag Filter */}
            <TagFilter
              availableTags={availableTags}
              selectedTags={selectedFilterTags}
              onTagSelect={handleTagSelect}
              onTagRemove={handleTagRemove}
              onClearAll={handleClearAllTags}
              showAllTags={true}
              title="Filter by Topic"
            />
          </div>

          {/* Main content */}
          <div className="lg:col-span-3">
            <ArticleGrid
              articles={filteredArticles}
              title={`All Articles ${selectedFilterTags.length > 0 ? `(${selectedFilterTags.length} filter${selectedFilterTags.length !== 1 ? 's' : ''} applied)` : ''}`}
              emptyMessage="No articles found"
              showSource={true}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

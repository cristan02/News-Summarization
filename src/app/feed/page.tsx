'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Newspaper, Search, RefreshCw, Settings } from "lucide-react"
import { toast } from "sonner"
import TagFilter from '@/components/tag-filter'
import ArticleGrid from '@/components/article-grid'
import Link from 'next/link'

interface Article {
  id: string
  title: string
  link: string
  content: string
  shortSummary: string
  tag: string // Single tag instead of array
  source?: string
  author?: string
  publishedAt?: string
  imageUrl?: string
  createdAt: string
  updatedAt: string
}

interface UserPreferences {
  selectedTags: string[]
  hasPreferences: boolean
}

export default function FeedPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([])
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null)
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
      fetchUserPreferencesAndArticles()
      fetchAvailableTags()
    }
  }, [status, router])

  useEffect(() => {
      const filterArticles = () => {
    // Check if user has valid preferences set
    const hasValidPreferences = userPreferences?.hasPreferences && 
      userPreferences?.selectedTags && 
      userPreferences.selectedTags.length > 0;
    
    if (!hasValidPreferences) {
      // If no preferences set, show no articles (encourage setting preferences)
      setFilteredArticles([])
      return
    }

    let filtered = articles.filter(article => {
      // Check if article tag matches any of user's selected tags
      return userPreferences.selectedTags!.some(userTag => 
        userTag.toLowerCase() === article.tag.toLowerCase()
      )
    })

    // Apply additional tag filter if selected
    if (selectedFilterTags.length > 0) {
      filtered = filtered.filter(article =>
        selectedFilterTags.some(filterTag =>
          filterTag.toLowerCase() === article.tag.toLowerCase()
        )
      )
    }

    // Apply search filter if search query exists
    if (searchQuery) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.shortSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredArticles(filtered)
  }
  
    filterArticles()
  }, [articles, userPreferences, searchQuery, selectedFilterTags])

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

  const fetchUserPreferencesAndArticles = async () => {
    setIsLoading(true)
    try {
      // Fetch user preferences
      const preferencesResponse = await fetch('/api/user-preferences')
      let preferences: UserPreferences = { selectedTags: [], hasPreferences: false }
      
      if (preferencesResponse.ok) {
        const preferencesData = await preferencesResponse.json()
        // Update to work with new schema where preferredTags is directly on user
        preferences = {
          selectedTags: preferencesData.preferences?.preferredTags || [],
          hasPreferences: preferencesData.hasPreferences
        }
        setUserPreferences(preferences)
      }

      // Fetch all articles
      const articlesResponse = await fetch('/api/articles')
      if (articlesResponse.ok) {
        const allArticles = await articlesResponse.json()
        setArticles(allArticles)
      } else {
        toast.error("Failed to fetch articles")
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error("Error loading your feed")
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
    fetchUserPreferencesAndArticles()
    fetchAvailableTags()
    toast.success("Feed refreshed")
  }

  // Helper function to check if user has valid preferences
  const hasValidPreferences = userPreferences?.hasPreferences && 
    userPreferences?.selectedTags && 
    userPreferences.selectedTags.length > 0;

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="p-8">
          <CardContent className="flex items-center space-x-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-lg">Loading your personalized feed...</span>
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
                  <Newspaper className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Your News Feed</CardTitle>
                  <CardDescription>
                    Personalized news based on your interests
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
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/user-preferences')}
                  className="hidden sm:flex"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Preferences
                </Button>
                <Button asChild>
                  <Link href="/all-feed">
                    <Newspaper className="w-4 h-4 mr-2" />
                    Browse All
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* No Preferences State */}
        {!hasValidPreferences && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Newspaper className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Set Your Preferences First</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                To see your personalized news feed, please select your interests and preferred topics.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                <Button onClick={() => router.push('/user-preferences')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Set My Preferences
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/all-feed')}
                >
                  Browse All Articles
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {hasValidPreferences && (
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
                availableTags={availableTags.filter(tag => 
                  userPreferences?.selectedTags?.some(userTag => 
                    userTag.toLowerCase() === tag.toLowerCase()
                  )
                )}
                selectedTags={selectedFilterTags}
                onTagSelect={handleTagSelect}
                onTagRemove={handleTagRemove}
                onClearAll={handleClearAllTags}
                title="Filter by Topic"
              />
            </div>

            {/* Main content */}
            <div className="lg:col-span-3">
              <ArticleGrid
                articles={filteredArticles}
                title="Your Personalized Feed"
                emptyMessage="No articles match your current filters"
                showSource={true}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Loader2, Newspaper, Search, ExternalLink, Clock, RefreshCw } from "lucide-react"
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
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
      return
    }
    
    if (status === 'authenticated') {
      fetchUserPreferencesAndArticles()
    }
  }, [status, router])

  useEffect(() => {
    filterArticles()
  }, [articles, userPreferences, searchQuery])

  const fetchUserPreferencesAndArticles = async () => {
    setIsLoading(true)
    try {
      // Fetch user preferences
      const preferencesResponse = await fetch('/api/user-preferences')
      let preferences: UserPreferences = { selectedTags: [], hasPreferences: false }
      
      if (preferencesResponse.ok) {
        preferences = await preferencesResponse.json()
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
      // Check if article has any tags that match user's selected tags
      return article.tags.some(tag => 
        userPreferences.selectedTags!.some(userTag => 
          userTag.toLowerCase() === tag.toLowerCase()
        )
      )
    })

    // Apply search filter if search query exists
    if (searchQuery) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.shortSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    setFilteredArticles(filtered)
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

  const refreshFeed = () => {
    fetchUserPreferencesAndArticles()
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
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center">
                  <Newspaper className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Your News Feed</CardTitle>
                  <p className="text-muted-foreground">
                    Personalized news based on your interests
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={refreshFeed}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/all-feed')}
                  className="hidden sm:flex"
                >
                  <Newspaper className="w-4 h-4 mr-2" />
                  Browse All Articles
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* User Preferences Summary */}
        {hasValidPreferences && (
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Your Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {userPreferences?.selectedTags?.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/user-preferences')}
                >
                  Update Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search your personalized articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
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

        {/* Results Summary */}
        {hasValidPreferences && (
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              {filteredArticles.length === 0 
                ? "No articles match your preferences" 
                : `Showing ${filteredArticles.length} personalized ${filteredArticles.length === 1 ? 'article' : 'articles'}`
              }
            </p>
          </div>
        )}

        {/* No Articles Found */}
        {hasValidPreferences && filteredArticles.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No matching articles found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery 
                  ? "Try adjusting your search terms or browse all articles."
                  : "No articles match your current interests. Try updating your preferences or browse all available articles."
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                {searchQuery && (
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/user-preferences')}
                >
                  Update Preferences
                </Button>
                <Button onClick={() => router.push('/all-feed')}>
                  Browse All Articles
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Articles Grid */}
        {filteredArticles.length > 0 && (
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
                    {article.tags.slice(0, 3).map((tag) => {
                      const isUserInterest = userPreferences?.selectedTags?.some(
                        userTag => userTag.toLowerCase() === tag.toLowerCase()
                      )
                      return (
                        <Badge 
                          key={tag} 
                          variant={isUserInterest ? "default" : "secondary"} 
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      )
                    })}
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
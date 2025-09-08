'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, RefreshCw, Settings } from "lucide-react"
import TagFilter from '@/components/tag-filter'
import ArticleGrid from '@/components/article-grid'
import Link from 'next/link'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useArticles } from '@/hooks/useArticles'
import { useArticleFilter } from '@/hooks/useArticleFilter'
import { useTags } from '@/hooks/useTags'

interface FeedLayoutProps {
  type: 'personalized' | 'all'
  title: string
  emptyMessage: string
  showPreferencesLink?: boolean
}

export default function FeedLayout({
  type,
  title,
  emptyMessage,
  showPreferencesLink = false
}: FeedLayoutProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuthGuard()
  const [searchQuery, setSearchQuery] = useState('')

  const {
    articles,
    isLoading: articlesLoading,
    userPreferences,
    fetchUserPreferencesAndArticles,
    refreshArticles
  } = useArticles({ filterByPreferences: type === 'personalized' })

  // Memoize user preferred tags to prevent unnecessary re-renders
  const memoizedUserPreferredTags = useMemo(() =>
    userPreferences?.preferredTags || [],
    [userPreferences?.preferredTags]
  );

  const {
    availableTags,
    selectedFilterTags,
    fetchAvailableTags,
    handleTagSelect,
    handleTagRemove,
    clearAllTags
  } = useTags({
    filterByUserPreferences: type === 'personalized',
    userPreferredTags: memoizedUserPreferredTags
  })

  const { filteredArticles } = useArticleFilter({
    articles,
    searchQuery,
    selectedTags: selectedFilterTags,
    userPreferences,
    filterByPreferences: type === 'personalized'
  })

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserPreferencesAndArticles()
    }
  }, [isAuthenticated, fetchUserPreferencesAndArticles])

  useEffect(() => {
    if (isAuthenticated) {
      fetchAvailableTags()
    }
  }, [isAuthenticated, fetchAvailableTags])

  // Re-fetch tags when user preferences are loaded
  useEffect(() => {
    if (isAuthenticated && userPreferences && type === 'personalized') {
      fetchAvailableTags()
    }
  }, [isAuthenticated, userPreferences, type, fetchAvailableTags])

  if (authLoading || articlesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading {title.toLowerCase()}...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Auth guard will redirect
  }

  // Show preferences prompt for personalized feed
  if (type === 'personalized' && (!userPreferences?.hasPreferences || !userPreferences?.preferredTags?.length)) {
    return (
      <div className="min-h-screen p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-dashed">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome to Your Personalized Feed!</CardTitle>
              <CardDescription>
                To get started, you need to set your preferences and select topics you&apos;re interested in.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Settings className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground max-w-md mx-auto">
                Choose your favorite topics to see personalized articles tailored to your interests.
              </p>
              <Button asChild>
                <Link href="/user-preferences">
                  <Settings className="w-4 h-4 mr-2" />
                  Set Your Preferences
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Sidebar - Tags Only */}
      <div className="w-80 border-r bg-background p-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Filter by Topics</h2>
          <TagFilter
            availableTags={availableTags}
            selectedTags={selectedFilterTags}
            onTagSelect={handleTagSelect}
            onTagRemove={handleTagRemove}
            onClearAll={clearAllTags}
            showAllTags={true}
          />
        </div>
      </div>

      {/* Right Side - Search + Grid */}
      <div className="flex-1 flex flex-col">
        {/* Title and Description */}
        <div className="bg-background p-6 pb-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-muted-foreground">
              {type === 'personalized'
                ? 'Discover articles tailored to your interests and preferences'
                : 'Browse all available articles from various sources and topics'
              }
            </p>
          </div>
        </div>

        {/* Search and Refresh Bar */}
        <div className="bg-background p-4 pt-2">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={refreshArticles}
              disabled={articlesLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${articlesLoading ? 'animate-spin' : ''}`} />
              {articlesLoading ? 'Loading...' : 'Refresh'}
            </Button>
            {showPreferencesLink && (
              <Button asChild variant="outline">
                <Link href="/user-preferences">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Articles Grid */}
        <div className="flex-1 p-6 pt-4">
          <ArticleGrid
            articles={filteredArticles}
            title=""
            emptyMessage={
              searchQuery || selectedFilterTags.length > 0
                ? "No articles match your current filters. Try adjusting your search terms or selected tags."
                : emptyMessage
            }
          />
        </div>
      </div>
    </div>
  )
}

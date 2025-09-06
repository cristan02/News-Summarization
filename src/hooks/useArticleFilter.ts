'use client'

import { useState, useEffect } from 'react'
import { Article, UserPreferences } from '@/types'

interface UseArticleFilterOptions {
  articles: Article[]
  searchQuery?: string
  selectedTags?: string[]
  userPreferences?: UserPreferences | null
  filterByPreferences?: boolean
}

/**
 * Reusable hook for filtering articles based on search and tag criteria
 */
export function useArticleFilter({
  articles,
  searchQuery = '',
  selectedTags = [],
  userPreferences,
  filterByPreferences = false
}: UseArticleFilterOptions) {
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([])

  useEffect(() => {
    const filterArticles = () => {
      let filtered = articles

      // Apply user preference filtering if enabled
      if (filterByPreferences) {
        const hasValidPreferences = userPreferences?.hasPreferences && 
          userPreferences?.preferredTags && 
          userPreferences.preferredTags.length > 0

        if (!hasValidPreferences) {
          setFilteredArticles([])
          return
        }

        // Filter by user's preferred tags
        filtered = filtered.filter(article =>
          article.tag && userPreferences.preferredTags.includes(article.tag)
        )
      }

      // Apply additional tag filtering
      if (selectedTags.length > 0) {
        filtered = filtered.filter(article =>
          article.tag && selectedTags.includes(article.tag)
        )
      }

      // Apply search query filtering
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filtered = filtered.filter(article =>
          article.title?.toLowerCase().includes(query) ||
          article.summary?.toLowerCase().includes(query) ||
          (article.tag && typeof article.tag === 'string' && article.tag.toLowerCase().includes(query))
        )
      }

      setFilteredArticles(filtered)
    }

    filterArticles()
  }, [articles, searchQuery, selectedTags, userPreferences, filterByPreferences])

  return {
    filteredArticles,
    setFilteredArticles
  }
}

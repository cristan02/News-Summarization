'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Article, UserPreferences } from '@/types'

interface UseArticlesOptions {
  filterByPreferences?: boolean
}

/**
 * Reusable hook for fetching and managing articles
 */
export function useArticles(options: UseArticlesOptions = {}) {
  const [articles, setArticles] = useState<Article[]>([])
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null)

  const fetchArticles = useCallback(async (tags?: string[]) => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (tags && tags.length > 0) {
        params.append('tags', tags.join(','))
      }
      
      const response = await fetch(`/api/articles?${params}`)
      if (!response.ok) throw new Error('Failed to fetch articles')
      
      const data = await response.json()
      if (data.success) {
        setArticles(data.data)
        setFilteredArticles(data.data)
      } else {
        throw new Error(data.error || 'Failed to fetch articles')
      }
    } catch (error) {
      console.error('Error fetching articles:', error)
      toast.error('Failed to load articles')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchUserPreferences = useCallback(async () => {
    try {
      const response = await fetch('/api/user-preferences')
      if (response.ok) {
        const data = await response.json()
        setUserPreferences(data)
        return data
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error)
    }
    return null
  }, [])

  const fetchUserPreferencesAndArticles = useCallback(async () => {
    if (options.filterByPreferences) {
      const preferences = await fetchUserPreferences()
      if (preferences?.hasPreferences && preferences?.preferredTags && preferences.preferredTags.length > 0) {
        await fetchArticles(preferences.preferredTags)
      } else {
        await fetchArticles()
      }
    } else {
      await fetchArticles()
    }
  }, [options.filterByPreferences, fetchUserPreferences, fetchArticles])

  const refreshArticles = useCallback(() => {
    if (options.filterByPreferences && userPreferences?.preferredTags && userPreferences.preferredTags.length > 0) {
      fetchArticles(userPreferences.preferredTags)
    } else {
      fetchArticles()
    }
  }, [options.filterByPreferences, userPreferences?.preferredTags, fetchArticles])

  return {
    articles,
    filteredArticles,
    setFilteredArticles,
    isLoading,
    userPreferences,
    fetchArticles,
    fetchUserPreferences,
    fetchUserPreferencesAndArticles,
    refreshArticles
  }
}

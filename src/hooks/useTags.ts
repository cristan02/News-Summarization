'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'

/**
 * Reusable hook for managing tags
 */
export function useTags() {
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [selectedFilterTags, setSelectedFilterTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchAvailableTags = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/tags')
      if (response.ok) {
        const tags = await response.json()
        // Extract tag names from the tag objects
        const tagNames = tags.map((tag: { name: string }) => tag.name)
        setAvailableTags(tagNames)
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
      toast.error('Failed to load tags')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleTagSelect = useCallback((tag: string) => {
    setSelectedFilterTags(prev => 
      prev.includes(tag) ? prev : [...prev, tag]
    )
  }, [])

  const handleTagRemove = useCallback((tag: string) => {
    setSelectedFilterTags(prev => prev.filter(t => t !== tag))
  }, [])

  const clearAllTags = useCallback(() => {
    setSelectedFilterTags([])
  }, [])

  return {
    availableTags,
    selectedFilterTags,
    isLoading,
    fetchAvailableTags,
    handleTagSelect,
    handleTagRemove,
    clearAllTags,
    setSelectedFilterTags
  }
}

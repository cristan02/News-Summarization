"use client";

import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";

interface UseTagsOptions {
  filterByUserPreferences?: boolean;
  userPreferredTags?: string[];
}

/**
 * Reusable hook for managing tags
 */
export function useTags(options: UseTagsOptions = {}) {
  const { filterByUserPreferences = false, userPreferredTags = [] } = options;
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedFilterTags, setSelectedFilterTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Memoize userPreferredTags to prevent unnecessary re-renders
  const memoizedUserPreferredTags = useMemo(
    () => userPreferredTags,
    [userPreferredTags]
  );

  const fetchAvailableTags = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/tags");
      if (response.ok) {
        const tags = await response.json();
        // Extract tag names from the tag objects
        const tagNames = tags.map((tag: { name: string }) => tag.name);

        // Filter tags based on user preferences for personalized feed
        const filteredTags =
          filterByUserPreferences && memoizedUserPreferredTags.length > 0
            ? tagNames.filter((tag: string) =>
                memoizedUserPreferredTags.includes(tag)
              )
            : tagNames;

        setAvailableTags(filteredTags);
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
      toast.error("Failed to load tags");
    } finally {
      setIsLoading(false);
    }
  }, [filterByUserPreferences, memoizedUserPreferredTags]);

  const handleTagSelect = useCallback((tag: string) => {
    setSelectedFilterTags((prev) =>
      prev.includes(tag) ? prev : [...prev, tag]
    );
  }, []);

  const handleTagRemove = useCallback((tag: string) => {
    setSelectedFilterTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const clearAllTags = useCallback(() => {
    setSelectedFilterTags([]);
  }, []);

  return {
    availableTags,
    selectedFilterTags,
    isLoading,
    fetchAvailableTags,
    handleTagSelect,
    handleTagRemove,
    clearAllTags,
    setSelectedFilterTags,
  };
}

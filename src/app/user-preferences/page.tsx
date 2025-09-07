'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { TagSelector } from "@/components/tag-selector"
import { SelectedTags } from "@/components/selected-tags"
import { AddTagForm } from "@/components/add-tag-form"

interface Tag {
  id: string
  name: string
  usageCount: number
}

export default function UserPreferences() {
  const { status } = useSession()
  const router = useRouter()
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }

    if (status === 'authenticated') {
      fetchTags()
      fetchUserPreferences()
    }
  }, [status, router])

  const fetchTags = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/tags')
      if (response.ok) {
        const data = await response.json()
        setTags(data)
      } else {
        toast.error("Failed to fetch tags")
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
      toast.error("Error fetching tags")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserPreferences = async () => {
    try {
      const response = await fetch('/api/user-preferences')
      if (response.ok) {
        const data = await response.json()
        if (data.preferredTags) {
          setSelectedTags(data.preferredTags)
        }
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error)
      toast.error("Error fetching your preferences")
    }
  }

  const handleTagToggle = (tagName: string) => {
    setSelectedTags(prev =>
      prev.includes(tagName)
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    )
  }

  const handleAddNewTag = async () => {
    if (!newTag.trim()) {
      toast.error("Please enter a tag name")
      return
    }

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTag.trim() })
      })

      if (response.ok) {
        const newTagData = await response.json()
        setTags(prev => [...prev, newTagData])
        setSelectedTags(prev => [...prev, newTagData.name])
        setNewTag('')
        toast.success(`Added "${newTagData.name}" to your interests`)
      } else {
        toast.error("Failed to add tag")
      }
    } catch (error) {
      console.error('Error adding tag:', error)
      toast.error("Error adding tag")
    }
  }

  const handleSavePreferences = async () => {
    if (selectedTags.length === 0) {
      toast.error("Please select at least one tag")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/user-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredTags: selectedTags })
      })

      if (response.ok) {
        toast.success("Preferences saved successfully!")
      } else {
        toast.error("Failed to save preferences")
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      toast.error("Error saving preferences")
    } finally {
      setIsSaving(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="p-8">
          <CardContent className="flex items-center space-x-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-lg">Loading your preferences...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto p-6 space-y-8">



        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Tags Selection - Takes up 3 columns */}

          {/* Header Section */}
          <div className=" space-y-4 lg:col-span-3">
            <h2 className="text-xl font-semibold text-foreground">Choose Your Interests</h2>
            <p className="text-muted-foreground">
              Select topics that interest you to personalize your news feed. We&apos;ll curate articles
              based on your preferences to ensure you stay informed about what matters most to you.
            </p>
          </div>

          <Card className="lg:col-span-3">
            <CardContent className="p-6">
              <TagSelector
                tags={tags}
                selectedTags={selectedTags}
                onTagToggle={handleTagToggle}
              />
            </CardContent>
          </Card>

          {/* Sidebar - Takes up 1 column */}
          <div className="space-y-6">
            {/* Add Custom Tag */}
            <Card>
              <CardContent className="p-6">
                <AddTagForm
                  newTag={newTag}
                  onNewTagChange={setNewTag}
                  onAddTag={handleAddNewTag}
                />
              </CardContent>
            </Card>

            {/* Selected Tags & Actions */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <SelectedTags
                  selectedTags={selectedTags}
                  onTagRemove={handleTagToggle}
                />
                <Button
                  onClick={handleSavePreferences}
                  disabled={selectedTags.length === 0 || isSaving}
                  className="w-full"
                  size="lg"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    `Save ${selectedTags.length} interests`
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

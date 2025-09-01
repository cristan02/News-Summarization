'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Tag {
  id: string
  name: string
  usageCount: number
}

export default function UserPreferences() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
    
    if (status === 'authenticated') {
      fetchTags()
      fetchUserPreferences()
    }
  }, [status])

  const fetchTags = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/tags')
      if (response.ok) {
        const data = await response.json()
        setTags(data)
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserPreferences = async () => {
    try {
      const response = await fetch('/api/user-preferences')
      if (response.ok) {
        const data = await response.json()
        if (data.preferences && data.preferences.preferredTags) {
          setSelectedTags(data.preferences.preferredTags)
        }
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error)
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
    if (!newTag.trim()) return

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
      }
    } catch (error) {
      console.error('Error adding tag:', error)
    }
  }

  const handleSavePreferences = async () => {
    if (selectedTags.length === 0) {
      alert('Please select at least one tag')
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
        // Preferences saved successfully - stay on the page
        alert('Preferences saved successfully!')
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-6">
      <div className="max-w-6xl mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Welcome, {session?.user?.name}!
            </h1>
            <p className="text-slate-600 text-lg">
              Select your interests to get personalized news
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Available Tags - Takes up 2 columns on large screens */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4 text-slate-800">Choose Your Interests</h2>
              <div className="flex flex-wrap grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagToggle(tag.name)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all duration-200 hover:scale-105 ${
                      selectedTags.includes(tag.name)
                        ? 'border-blue-400 bg-blue-500 text-white shadow-md'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="truncate">{tag.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sidebar with Add Tag and Selected Tags */}
            <div className="lg:col-span-1 space-y-6">
              {/* Add New Tag */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-slate-800">Add Custom Tag</h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Enter a new tag..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddNewTag()}
                  />
                  <button
                    onClick={handleAddNewTag}
                    className="w-full px-4 py-2 bg-slate-600 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    Add Tag
                  </button>
                </div>
              </div>

              {/* Selected Tags Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-slate-800">
                  Selected ({selectedTags.length})
                </h3>
                <div className="max-h-64 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm font-medium cursor-pointer hover:bg-blue-200 transition-colors"
                        onClick={() => handleTagToggle(tag)}
                        title="Click to remove"
                      >
                        {tag} ×
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div>
                <button
                  onClick={handleSavePreferences}
                  disabled={selectedTags.length === 0 || isSaving}
                  className={`w-full px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    selectedTags.length === 0 || isSaving
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105'
                  }`}
                >
                  {isSaving ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    `Save ${selectedTags.length} interests`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
        </div>  
  )
}
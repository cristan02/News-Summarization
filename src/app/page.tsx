'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Github, Settings, LogOut, CheckCircle } from "lucide-react"

export default function Page() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const router = useRouter()

  // Handle redirect after authentication
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Don't auto-redirect, let user navigate manually via navbar
      // checkUserPreferencesAndRedirect()
    }
  }, [status, session])

  const checkUserPreferencesAndRedirect = async () => {
    setIsRedirecting(true)
    try {
      const response = await fetch('/api/user-preferences')
      if (response.ok) {
        const data = await response.json()
        
        if (data.hasPreferences) {
          router.push('/feed')
        } else {
          router.push('/user-preferences')
        }
      } else {
        router.push('/user-preferences')
      }
    } catch (error) {
      console.error('Error checking user preferences:', error)
      toast.error("Error checking preferences")
      router.push('/user-preferences')
    } finally {
      setIsRedirecting(false)
    }
  }

  const handleSignIn = async (provider: string) => {
    setIsLoading(true)
    try {
      await signIn(provider)
    } catch (error) {
      console.error('Sign in error:', error)
      toast.error(`Failed to sign in with ${provider}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut()
      toast.success("Signed out successfully")
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error("Failed to sign out")
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="w-96">
          <CardContent className="flex items-center justify-center space-x-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-lg">
              {isRedirecting ? 'Redirecting...' : 'Loading...'}
            </span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto p-6 pt-8">
          {/* Welcome Section */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-primary/80 to-primary/50 rounded-2xl flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-3xl">Welcome back, {session.user?.name}!</CardTitle>
                  <p className="text-muted-foreground mt-1">
                    Your personalized news dashboard
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/feed')}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">My News Feed</h3>
                <p className="text-sm text-muted-foreground">
                  Browse personalized news articles
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/all-feed')}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">All Articles</h3>
                <p className="text-sm text-muted-foreground">
                  Explore all available news articles
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/user-preferences')}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Manage Preferences</h3>
                <p className="text-sm text-muted-foreground">
                  Customize your interests and tags
                </p>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
            <Settings className="w-10 h-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">News Summarization</CardTitle>
          <p className="text-muted-foreground">
            Get personalized news recommendations tailored to your interests
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Sign In Buttons */}
          <Button
            onClick={() => handleSignIn('github')}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            <Github className="w-5 h-5 mr-2" />
            Continue with GitHub
          </Button>

          <Button
            onClick={() => handleSignIn('google')}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" />
              Connecting...
            </div>
          )}

          {/* Footer */}
          <p className="text-xs text-center text-muted-foreground mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Github, Settings, LogOut, CheckCircle } from "lucide-react"

export default function HomePage() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const router = useRouter()

  // Handle redirect after authentication
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      checkUserPreferencesAndRedirect()
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-4">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Welcome Back!</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* User Profile Section */}
            <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
              <div className="relative">
                <img 
                  src={session.user?.image || '/api/placeholder/64/64'} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full border-4 border-primary/20"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold truncate">
                  {session.user?.name || 'User'}
                </h3>
                <p className="text-sm text-muted-foreground truncate">{session.user?.email}</p>
                <Badge variant="secondary" className="mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Online
                </Badge>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/user-preferences')}
                variant="outline"
                className="w-full justify-start"
              >
                <Settings className="w-4 h-4 mr-2" />
                Manage Preferences
              </Button>
              
              <Button
                onClick={() => router.push('/feed')}
                className="w-full justify-start"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                View News Feed
              </Button>
            </div>

            {/* Sign Out Button */}
            <Button
              onClick={handleSignOut}
              disabled={isLoading}
              variant="destructive"
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing out...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </>
              )}
            </Button>
          </CardContent>
        </Card>
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

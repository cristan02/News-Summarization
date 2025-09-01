'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { 
  User, 
  Settings, 
  LogOut, 
  Home, 
  Newspaper, 
  Sun, 
  Moon,
  Monitor,
  Menu
} from 'lucide-react'
import { toast } from 'sonner'

export function Navbar() {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/' })
      toast.success('Signed out successfully')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  const toggleTheme = () => {
    // Get the actual current theme (resolve system theme)
    const currentTheme = theme === 'system' ? systemTheme : theme
    
    // Toggle between light and dark only
    if (currentTheme === 'light') {
      setTheme('dark')
    } else {
      setTheme('light')
    }
  }

  const getCurrentThemeIcon = () => {
    if (!mounted) return <Sun className="h-5 w-5" />
    
    // Always resolve to actual theme (no system icon in toggle)
    const currentTheme = theme === 'system' ? systemTheme : theme
    
    if (currentTheme === 'dark') {
      return <Moon className="h-5 w-5 text-blue-400" />
    } else {
      return <Sun className="h-5 w-5 text-yellow-600" />
    }
  }

  const getNextThemeLabel = () => {
    if (!mounted) return 'Toggle Theme'
    
    // Always resolve to actual theme
    const currentTheme = theme === 'system' ? systemTheme : theme
    
    if (currentTheme === 'dark') {
      return 'Switch to Light'
    } else {
      return 'Switch to Dark'
    }
  }

  const isActivePage = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }

  if (!session) return null

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        {/* Logo/Brand */}
        <div className="mr-6 flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-primary/80 to-primary/50 rounded-lg flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="hidden font-bold sm:inline-block">News Hub</span>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-1 items-center space-x-1">
          <Button 
            variant={isActivePage('/') ? "default" : "ghost"}
            size="sm"
            onClick={() => router.push('/')}
            className="hidden sm:flex"
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
          <Button 
            variant={isActivePage('/feed') ? "default" : "ghost"}
            size="sm"
            onClick={() => router.push('/feed')}
            className="hidden sm:flex"
          >
            <Newspaper className="w-4 h-4 mr-2" />
            My Feed
          </Button>
          <Button 
            variant={isActivePage('/all-feed') ? "default" : "ghost"}
            size="sm"
            onClick={() => router.push('/all-feed')}
            className="hidden sm:flex"
          >
            <Newspaper className="w-4 h-4 mr-2" />
            All Articles
          </Button>
          <Button 
            variant={isActivePage('/user-preferences') ? "default" : "ghost"}
            size="sm"
            onClick={() => router.push('/user-preferences')}
            className="hidden sm:flex"
          >
            <Settings className="w-4 h-4 mr-2" />
            Preferences
          </Button>
        </div>

        {/* Theme Toggle */}
        <div className="flex items-center mr-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-9 w-9 rounded-full p-0"
            aria-label={getNextThemeLabel()}
          >
            {getCurrentThemeIcon()}
          </Button>
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative h-9 w-9 rounded-full p-0 overflow-hidden">
              {session.user?.image ? (
                <img
                  src={session.user.image}
                  alt="Profile"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <User className="h-5 w-5" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {session.user?.name || 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session.user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Mobile Navigation Items */}
            <div className="sm:hidden">
              <DropdownMenuItem 
                onClick={() => router.push('/')}
                className={isActivePage('/') ? "bg-accent text-accent-foreground" : ""}
              >
                <Home className="mr-2 h-4 w-4" />
                Home
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push('/feed')}
                className={isActivePage('/feed') ? "bg-accent text-accent-foreground" : ""}
              >
                <Newspaper className="mr-2 h-4 w-4" />
                My Feed
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push('/all-feed')}
                className={isActivePage('/all-feed') ? "bg-accent text-accent-foreground" : ""}
              >
                <Newspaper className="mr-2 h-4 w-4" />
                All Articles
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push('/user-preferences')}
                className={isActivePage('/user-preferences') ? "bg-accent text-accent-foreground" : ""}
              >
                <Settings className="mr-2 h-4 w-4" />
                Preferences
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </div>
            
            <DropdownMenuItem 
              onClick={handleSignOut}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}

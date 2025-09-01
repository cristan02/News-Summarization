'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
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
  Menu
} from 'lucide-react'
import { toast } from 'sonner'

export function Navbar() {
  const { data: session } = useSession()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/' })
      toast.success('Signed out successfully')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  if (!session) return null

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        {/* Logo/Brand */}
        <div className="mr-6 flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="hidden font-bold sm:inline-block">News Hub</span>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-1 items-center space-x-1">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push('/')}
            className="hidden sm:flex"
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push('/feed')}
            className="hidden sm:flex"
          >
            <Newspaper className="w-4 h-4 mr-2" />
            My Feed
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push('/all-feed')}
            className="hidden sm:flex"
          >
            <Newspaper className="w-4 h-4 mr-2" />
            All Articles
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push('/user-preferences')}
            className="hidden sm:flex"
          >
            <Settings className="w-4 h-4 mr-2" />
            Preferences
          </Button>
        </div>

        {/* Theme Toggle */}
        <div className="flex items-center space-x-2 mr-4">
          <Sun className="h-4 w-4" />
          <Switch
            checked={theme === 'dark'}
            onCheckedChange={toggleTheme}
            aria-label="Toggle theme"
          />
          <Moon className="h-4 w-4" />
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative h-9 w-9 rounded-full">
              {session.user?.image ? (
                <img
                  src={session.user.image}
                  alt="Profile"
                  className="h-9 w-9 rounded-full"
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
              <DropdownMenuItem onClick={() => router.push('/')}>
                <Home className="mr-2 h-4 w-4" />
                Home
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/feed')}>
                <Newspaper className="mr-2 h-4 w-4" />
                My Feed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/all-feed')}>
                <Newspaper className="mr-2 h-4 w-4" />
                All Articles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/user-preferences')}>
                <Settings className="mr-2 h-4 w-4" />
                Preferences
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </div>
            
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Check if user has preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user with their preferred tags
    const user = await prisma.user.findFirst({
      where: { email: session.user.email },
      select: {
        id: true,
        preferredTags: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      hasPreferences: user.preferredTags.length > 0,
      userId: user.id,
      preferences: {
        id: user.id,
        userId: user.id,
        preferredTags: user.preferredTags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error checking user preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Save user preferences
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { preferredTags } = await req.json()

    if (!Array.isArray(preferredTags) || preferredTags.length === 0) {
      return NextResponse.json({ error: 'At least one tag must be selected' }, { status: 400 })
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update user's preferred tags directly
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        preferredTags: preferredTags
      },
      select: {
        id: true,
        preferredTags: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      id: updatedUser.id,
      userId: updatedUser.id,
      preferredTags: updatedUser.preferredTags,
      createdAt: new Date().toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString()
    })
  } catch (error) {
    console.error('Error saving preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}